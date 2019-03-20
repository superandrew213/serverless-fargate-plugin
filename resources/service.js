"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
const protocol_1 = require("./protocol");
class Service extends resource_1.Resource {
    constructor(stage, options, cluster) {
        super(options, stage, options.name
            .toLowerCase()
            .replace(/[^A-Za-z0-9]/g, ' ')
            .split(' ')
            .filter((piece) => piece.trim().length > 0)
            .map((piece) => piece.charAt(0).toUpperCase() + piece.substring(1))
            .join(''));
        this.cluster = cluster;
        this.protocols = this.options.protocols.map((serviceProtocolOptions) => {
            return new protocol_1.Protocol(cluster, this, stage, serviceProtocolOptions);
        });
    }
    generate() {
        const executionRole = this.cluster.getExecutionRoleArn() ? undefined : this.generateExecutionRole();
        return Object.assign({}, this.generateService(), this.generateTaskDefinition(), this.generateTargetGroup(), this.generateLogGroup(), ...this.protocols.map((protocol) => protocol.generate()), executionRole);
    }
    generateService() {
        return {
            [this.getName(resource_1.NamePostFix.SERVICE)]: {
                "Type": "AWS::ECS::Service",
                "DependsOn": this.protocols.map((protocol) => {
                    return protocol.getName(resource_1.NamePostFix.LOAD_BALANCER_LISTENER_RULE);
                }),
                "Properties": {
                    "ServiceName": this.options.name,
                    "Cluster": {
                        "Ref": this.cluster.getName(resource_1.NamePostFix.CLUSTER)
                    },
                    "LaunchType": "FARGATE",
                    "DeploymentConfiguration": {
                        "MaximumPercent": 200,
                        "MinimumHealthyPercent": 75
                    },
                    "DesiredCount": this.options.desiredCount ? this.options.desiredCount : 1,
                    "NetworkConfiguration": {
                        "AwsvpcConfiguration": {
                            "AssignPublicIp": "ENABLED",
                            "SecurityGroups": [
                                {
                                    "Ref": this.cluster.getName(resource_1.NamePostFix.CONTAINER_SECURITY_GROUP)
                                }
                            ],
                            "Subnets": this.cluster.getVPC().getSubnetNames().map((subnetName) => ({
                                "Ref": subnetName
                            }))
                        }
                    },
                    "TaskDefinition": {
                        "Ref": this.getName(resource_1.NamePostFix.TASK_DEFINITION)
                    },
                    "LoadBalancers": [
                        {
                            "ContainerName": this.getName(resource_1.NamePostFix.CONTAINER_NAME),
                            "ContainerPort": this.options.port,
                            "TargetGroupArn": {
                                "Ref": this.getName(resource_1.NamePostFix.TARGET_GROUP)
                            }
                        }
                    ]
                }
            },
        };
    }
    generateTaskDefinition() {
        return {
            [this.getName(resource_1.NamePostFix.TASK_DEFINITION)]: {
                "Type": "AWS::ECS::TaskDefinition",
                "Properties": {
                    "Family": this.options.name,
                    "Cpu": this.options.cpu,
                    "Memory": this.options.memory,
                    "NetworkMode": "awsvpc",
                    "RequiresCompatibilities": [
                        "FARGATE"
                    ],
                    "ExecutionRoleArn": this.getExecutionRoleValue(),
                    "TaskRoleArn": this.options.taskRoleArn ? this.options.taskRoleArn : ({
                        "Ref": "AWS::NoValue"
                    }),
                    "ContainerDefinitions": [
                        {
                            "Name": this.getName(resource_1.NamePostFix.CONTAINER_NAME),
                            "Cpu": this.options.cpu,
                            "Memory": this.options.memory,
                            "Image": this.options.image || `${this.options.imageRepository}:${this.options.name}-${this.options.imageTag}`,
                            "EntryPoint": this.options.entryPoint,
                            "PortMappings": [
                                {
                                    "ContainerPort": this.options.port
                                }
                            ],
                            "LogConfiguration": {
                                "LogDriver": "awslogs",
                                "Options": {
                                    "awslogs-group": `serverless-fargate-${this.stage}`,
                                    "awslogs-region": {
                                        "Ref": "AWS::Region"
                                    },
                                    "awslogs-stream-prefix": this.options.name
                                }
                            }
                        }
                    ]
                }
            }
        };
    }
    generateTargetGroup() {
        return {
            [this.getName(resource_1.NamePostFix.TARGET_GROUP)]: {
                "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
                "Properties": {
                    "HealthCheckIntervalSeconds": this.options.healthCheckInterval ? this.options.healthCheckInterval : 6,
                    "HealthCheckPath": this.options.healthCheckUri ? this.options.healthCheckUri : "/",
                    "HealthCheckProtocol": this.options.healthCheckProtocol ? this.options.healthCheckProtocol : "HTTP",
                    "HealthCheckTimeoutSeconds": 5,
                    "HealthyThresholdCount": 2,
                    "TargetType": "ip",
                    "Name": this.getName(resource_1.NamePostFix.TARGET_GROUP),
                    "Port": this.options.port,
                    "Protocol": "HTTP",
                    "UnhealthyThresholdCount": 2,
                    "VpcId": {
                        "Ref": this.cluster.getVPC().getName(resource_1.NamePostFix.VPC)
                    }
                }
            }
        };
    }
    generateExecutionRole() {
        return {
            [Service.EXECUTION_ROLE_NAME]: {
                "Type": "AWS::IAM::Role",
                "Properties": {
                    "AssumeRolePolicyDocument": {
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": [
                                        "ecs-tasks.amazonaws.com"
                                    ]
                                },
                                "Action": [
                                    "sts:AssumeRole"
                                ]
                            }
                        ]
                    },
                    "Path": "/",
                    "Policies": [
                        {
                            "PolicyName": "AmazonECSTaskExecutionRolePolicy",
                            "PolicyDocument": {
                                "Statement": [
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "ecr:GetAuthorizationToken",
                                            "ecr:BatchCheckLayerAvailability",
                                            "ecr:GetDownloadUrlForLayer",
                                            "ecr:BatchGetImage",
                                            "logs:CreateLogStream",
                                            "logs:PutLogEvents"
                                        ],
                                        "Resource": "*"
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        };
    }
    generateLogGroup() {
        return {
            [this.getName(resource_1.NamePostFix.LOG_GROUP)]: {
                "Type": "AWS::Logs::LogGroup",
                "Properties": {
                    "LogGroupName": `serverless-fargate-${this.stage}`,
                    "RetentionInDays": 30
                }
            }
        };
    }
    getExecutionRoleValue() {
        const executionRoleArn = this.cluster.getExecutionRoleArn();
        if (executionRoleArn) {
            return executionRoleArn;
        }
        return {
            "Ref": Service.EXECUTION_ROLE_NAME
        };
    }
}
Service.EXECUTION_ROLE_NAME = "ECSServiceExecutionRole";
exports.Service = Service;
//# sourceMappingURL=service.js.map