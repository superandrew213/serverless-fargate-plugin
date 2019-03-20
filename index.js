"use strict";
const cluster_1 = require("./resources/cluster");
const vpc_1 = require("./resources/vpc");
class ServerlessFargatePlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.hooks = {
            'deploy:compileFunctions': this.compile.bind(this)
        };
    }
    compile() {
        const service = this.serverless.service;
        const options = service.custom.fargate;
        const stage = service.provider ? service.provider.stage : service.stage;
        const vpc = new vpc_1.VPC(stage, options.vpc);
        const cluster = new cluster_1.Cluster(stage, options, vpc);
        Object.assign(this.serverless.service.provider.compiledCloudFormationTemplate.Resources, vpc.generate(), cluster.generate());
    }
}
module.exports = ServerlessFargatePlugin;
//# sourceMappingURL=index.js.map