"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class VPC extends resource_1.Resource {
    constructor(stage, options) {
        super(options, stage);
        this.subnetNames = this.options.subnets
            .map((subnet, index) => `${this.getName(resource_1.NamePostFix.SUBNET_NAME)}${index}`);
    }
    getSubnetNames() {
        return this.subnetNames;
    }
    generate() {
        const vpc = this.options.cidr;
        const subnets = this.options.subnets;
        return Object.assign({
            [this.getName(resource_1.NamePostFix.VPC)]: {
                "Type": "AWS::EC2::VPC",
                "Properties": {
                    "EnableDnsSupport": true,
                    "EnableDnsHostnames": true,
                    "CidrBlock": vpc
                }
            },
            [this.getName(resource_1.NamePostFix.INTERNET_GATEWAY)]: {
                "Type": "AWS::EC2::InternetGateway"
            },
            [this.getName(resource_1.NamePostFix.GATEWAY_ATTACHMENT)]: {
                "Type": "AWS::EC2::VPCGatewayAttachment",
                "Properties": {
                    "VpcId": {
                        "Ref": this.getName(resource_1.NamePostFix.VPC)
                    },
                    "InternetGatewayId": {
                        "Ref": this.getName(resource_1.NamePostFix.INTERNET_GATEWAY)
                    }
                }
            },
            [this.getName(resource_1.NamePostFix.ROUTE_TABLE)]: {
                "Type": "AWS::EC2::RouteTable",
                "Properties": {
                    "VpcId": {
                        "Ref": this.getName(resource_1.NamePostFix.VPC)
                    }
                }
            },
            [this.getName(resource_1.NamePostFix.ROUTE)]: {
                "Type": "AWS::EC2::Route",
                "DependsOn": this.getName(resource_1.NamePostFix.GATEWAY_ATTACHMENT),
                "Properties": {
                    "RouteTableId": {
                        "Ref": this.getName(resource_1.NamePostFix.ROUTE_TABLE)
                    },
                    "DestinationCidrBlock": "0.0.0.0/0",
                    "GatewayId": {
                        "Ref": this.getName(resource_1.NamePostFix.INTERNET_GATEWAY)
                    }
                }
            },
        }, ...this.generateSubnets(subnets));
    }
    generateSubnets(subnets) {
        const subnetNames = this.getSubnetNames();
        return subnets.map((subnet, index) => {
            const subnetName = subnetNames[index];
            const def = {};
            def[subnetName] = {
                "Type": "AWS::EC2::Subnet",
                "Properties": {
                    "AvailabilityZone": {
                        "Fn::Select": [
                            index,
                            {
                                "Fn::GetAZs": {
                                    "Ref": "AWS::Region"
                                }
                            }
                        ]
                    },
                    "VpcId": {
                        "Ref": this.getName(resource_1.NamePostFix.VPC)
                    },
                    "CidrBlock": subnet,
                    "MapPublicIpOnLaunch": true
                }
            };
            def[`${this.getName(resource_1.NamePostFix.ROUTE_TABLE_ASSOCIATION)}${index}`] = {
                "Type": "AWS::EC2::SubnetRouteTableAssociation",
                "Properties": {
                    "SubnetId": {
                        "Ref": subnetName
                    },
                    "RouteTableId": {
                        "Ref": this.getName(resource_1.NamePostFix.ROUTE_TABLE)
                    }
                }
            };
            return def;
        });
    }
}
exports.VPC = VPC;
//# sourceMappingURL=vpc.js.map