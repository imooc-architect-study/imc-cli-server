'use strict';

const CloudBuild = require('../cloud-build/index');


module.exports = app => {
  class Controller extends app.Controller {
    async index() {
      const { ctx } = this;
      const { socket, helper } = ctx;
      const cloudBuild = new CloudBuild(ctx);
      try {
        // 创建一个云构建任务
        await cloudBuild.createTask();
        // await cloudBuild.prepare();
        // await cloudBuild.download();
        // await cloudBuild.checkPackageJson();
        // await cloudBuild.install();
        // await cloudBuild.build();
        await cloudBuild.uploadPrepare();
      } catch (error) {
        socket.emit(
          'build',
          helper.parseMsg('error', {
            message: '云构建失败，失败原因：' + error.message,
          })
        );
      } finally {
        // cloudBuild.clearTask();
        socket.disconnect();
      }
    }
  }
  return Controller;
};
