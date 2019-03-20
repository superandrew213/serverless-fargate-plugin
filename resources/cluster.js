"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("./service");
const resource_1 = require("../resource");
class Cluster extends resource_1.Resource {
    constructor(stage, options, vpc) {
        super(options, stage, 'ECS');
        this.vpc = vpc;
    }
    getExecutionRoleArn() {
        return this.options.executionRoleArn;
    }
    getVPC() {
        return this.vpc;
    }
    generate() {
        const defs = this.options.services.map((serviceOptions) => {
            return new service_1.Service(this.stage, serviceOptions, this).generate();
        });
        return Object.assign({
            [this.getName(resource_1.NamePostFix.CLUSTER)]: {
                "Type": "AWS::ECS::Cluster"
            },
            [this.getName(resource_1.NamePostFix.CONTAINER_SECURITY_GROUP)]: {
                "Type": "AWS::EC2::SecurityGroup",
                "Properties": {
                    "GroupDescription": "Access to the Fargate containers",
                    "VpcId": {
                        "Ref": this.getVPC().getName(resource_1.NamePostFix.VPC)
                    }
                }
            },
            [this.getName(resource_1.NamePostFix.SECURITY_GROUP_INGRESS_ALB)]: {
                "Type": "AWS::EC2::SecurityGroupIngress",
                "Properties": {
                    "Description": "Ingress from the public ALB",
                    "GroupId": {
                        "Ref": this.getName(resource_1.NamePostFix.CONTAINER_SECURITY_GROUP)
                    },
                    "IpProtocol": -1,
                    "SourceSecurityGroupId": {
                        "Ref": this.getName(resource_1.NamePostFix.LOAD_BALANCER_SECURITY_GROUP)
                    }
                }
            },
            [this.getName(resource_1.NamePostFix.SECURITY_GROUP_INGRESS_SELF)]: {
                "Type": "AWS::EC2::SecurityGroupIngress",
                "Properties": {
                    "Description": "Ingress from other containers in the same security group",
                    "GroupId": {
                        "Ref": this.getName(resource_1.NamePostFix.CONTAINER_SECURITY_GROUP)
                    },
                    "IpProtocol": -1,
                    "SourceSecurityGroupId": {
                        "Ref": this.getName(resource_1.NamePostFix.CONTAINER_SECURITY_GROUP)
                    }
                }
            },
            [this.getName(resource_1.NamePostFix.LOAD_BALANCER_SECURITY_GROUP)]: {
                "Type": "AWS::EC2::SecurityGroup",
                "Properties": {
                    "GroupDescription": "Access to the public facing load balancer",
                    "VpcId": {
                        "Ref": this.getVPC().getName(resource_1.NamePostFix.VPC)
                    },
                    "SecurityGroupIngress": [
                        {
                            "CidrIp": "0.0.0.0/0",
                            "IpProtocol": -1
                        }
                    ]
                }
            },
            [this.getName(resource_1.NamePostFix.LOAD_BALANCER)]: {
                "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
                "Properties": {
                    "Scheme": "internet-facing",
                    "LoadBalancerAttributes": [
                        {
                            "Key": "idle_timeout.timeout_seconds",
                            "Value": "30"
                        }
                    ],
                    "Subnets": this.vpc.getSubnetNames().map((subnetName) => ({
                        "Ref": subnetName
                    })),
                    "SecurityGroups": [
                        {
                            "Ref": this.getName(resource_1.NamePostFix.LOAD_BALANCER_SECURITY_GROUP)
                        }
                    ]
                }
            },
        }, ...defs);
    }
}
exports.Cluster = Cluster;
//# sourceMappingURL=cluster.js.map