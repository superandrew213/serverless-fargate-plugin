"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
const PORT_MAP = {
    "HTTP": 80,
    "HTTPS": 443
};
class Protocol extends resource_1.Resource {
    constructor(cluster, service, stage, options) {
        super(options, stage, service.getNamePrefix());
        this.cluster = cluster;
        this.service = service;
    }
    getName(namePostFix) {
        return super.getName(namePostFix) + this.options.protocol.toUpperCase();
    }
    generate() {
        if (this.options.protocol === "HTTPS" && (!this.options.certificateArns || this.options.certificateArns.length === 0)) {
            throw new Error('Certificate ARN required for HTTPS');
        }
        var def = {
            [this.getName(resource_1.NamePostFix.LOAD_BALANCER_LISTENER)]: {
                "Type": "AWS::ElasticLoadBalancingV2::Listener",
                "DependsOn": [
                    this.cluster.getName(resource_1.NamePostFix.LOAD_BALANCER)
                ],
                "Properties": {
                    "DefaultActions": [
                        {
                            "TargetGroupArn": {
                                "Ref": this.service.getName(resource_1.NamePostFix.TARGET_GROUP)
                            },
                            "Type": "forward"
                        }
                    ],
                    "LoadBalancerArn": {
                        "Ref": this.cluster.getName(resource_1.NamePostFix.LOAD_BALANCER)
                    },
                    "Port": PORT_MAP[this.options.protocol],
                    "Protocol": this.options.protocol
                }
            },
            [this.getName(resource_1.NamePostFix.LOAD_BALANCER_LISTENER_RULE)]: {
                "Type": "AWS::ElasticLoadBalancingV2::ListenerRule",
                "Properties": {
                    "Actions": [{
                            "TargetGroupArn": {
                                "Ref": this.service.getName(resource_1.NamePostFix.TARGET_GROUP)
                            },
                            "Type": "forward"
                        }],
                    "Conditions": [
                        {
                            "Field": "path-pattern",
                            "Values": [this.service.getOptions().path ? this.service.getOptions().path : '*']
                        }
                    ],
                    "ListenerArn": {
                        "Ref": this.getName(resource_1.NamePostFix.LOAD_BALANCER_LISTENER)
                    },
                    "Priority": this.service.getOptions().priority ? this.service.getOptions().priority : 1
                }
            }
        };
        if (this.options.protocol === "HTTPS") {
            def[this.getName(resource_1.NamePostFix.LOAD_BALANCER_LISTENER)].Properties.Certificates = this.options
                .certificateArns.map((certificateArn) => ({
                "CertificateArn": certificateArn
            }));
        }
        return def;
    }
}
exports.Protocol = Protocol;
//# sourceMappingURL=protocol.js.map