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
        await cloudBuild.prepare();
        await cloudBuild.download();
        await cloudBuild.checkPackageJson();
        await cloudBuild.install();
        await cloudBuild.build();
        await cloudBuild.uploadPrepare();
        await cloudBuild.compressFile();
        await cloudBuild.sSHConnect();
        await cloudBuild.deleteServerFile();
        await cloudBuild.putFile();
        await cloudBuild.unzip();
        await cloudBuild.deleleZip();
      } catch (error) {
        const message = typeof error === 'string' ? error : error.message;
        socket.emit(
          'build',
          helper.parseMsg('error', {
            message: '云构建失败，失败原因：' + message,
          })
        );
      } finally {
        cloudBuild.clearTask();
        socket.disconnect();
      }
    }
  }
  return Controller;
};
