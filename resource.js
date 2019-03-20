"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var NamePostFix;
(function (NamePostFix) {
    NamePostFix["CLUSTER"] = "Cluster";
    NamePostFix["CONTAINER_SECURITY_GROUP"] = "ContainerSecurityGroup";
    NamePostFix["CONTAINER_NAME"] = "ContainerName";
    NamePostFix["LOAD_BALANCER"] = "LoadBalancer";
    NamePostFix["LOAD_BALANCER_SECURITY_GROUP"] = "LoadBalancerSecurityGroup";
    NamePostFix["LOAD_BALANCER_LISTENER"] = "LoadBalancerListener";
    NamePostFix["LOAD_BALANCER_LISTENER_RULE"] = "LoadBalancerListenerRule";
    NamePostFix["SECURITY_GROUP_INGRESS_ALB"] = "SecurityGroupIngressAlb";
    NamePostFix["SECURITY_GROUP_INGRESS_SELF"] = "SecurityGroupIngressSelf";
    NamePostFix["LOG_GROUP"] = "LogGroup";
    NamePostFix["VPC"] = "VPC";
    NamePostFix["SUBNET_NAME"] = "SubnetName";
    NamePostFix["INTERNET_GATEWAY"] = "InternetGateway";
    NamePostFix["GATEWAY_ATTACHMENT"] = "GatewayAttachement";
    NamePostFix["ROUTE_TABLE"] = "PublicRouteTable";
    NamePostFix["ROUTE"] = "PublicRoute";
    NamePostFix["ROUTE_TABLE_ASSOCIATION"] = "SubnetRouteTableAssociation";
    NamePostFix["SERVICE"] = "Service";
    NamePostFix["TASK_DEFINITION"] = "TDef";
    NamePostFix["TARGET_GROUP"] = "TGroup";
})(NamePostFix = exports.NamePostFix || (exports.NamePostFix = {}));
class Resource {
    constructor(options, stage, namePrefix) {
        this.options = options;
        this.stage = stage;
        this.namePrefix = namePrefix;
    }
    getName(namePostFix) {
        if (this.namePrefix) {
            return this.namePrefix + namePostFix.toString() + this.stage;
        }
        return namePostFix + this.stage;
    }
    getOptions() {
        return this.options;
    }
    getNamePrefix() {
        return this.namePrefix;
    }
}
exports.Resource = Resource;
//# sourceMappingURL=resource.js.map