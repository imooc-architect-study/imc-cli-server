'use strict';

const { Controller } = require('egg');

const CloudBuildTaskModel = require('../models/cloud-build-task');

class CloudBuildTaskController extends Controller {
  async getTaskList() {
    const { ctx } = this;
    // const object = {
    //   name: '测试仓库',
    //   repo: 'https://gitee.com/c10342/imc-cli-test.git',
    //   sshHost: '120.79.209.208',
    //   sshUsername: 'root',
    //   sshPassword: 'Lin19960519',
    // };
    const result = await CloudBuildTaskModel.find();

    ctx.body = result;
  }

  async checkTask() {
    const { ctx } = this;
    const { repo, branch } = ctx.query;
    if (!repo) {
      ctx.body = {
        code: 1,
        message: 'repo 参数不存在',
        data: false,
      };
      return;
    }
    if (!branch) {
      ctx.body = {
        code: 1,
        message: 'branch 参数不存在',
        data: false,
      };
      return;
    }
    const taskItem = await CloudBuildTaskModel.findOne({ repo });
    if (!taskItem) {
      ctx.body = {
        code: 2,
        message: '仓库地址不存在，请前往平台进行注册',
        date: false,
      };
      return;
    }
    const branches = taskItem.brakches || [];
    if (branches.length > 0 && branches.indexOf(branch) < 0) {
      ctx.body = {
        code: 3,
        message: '当前分支不允许打包',
        date: true,
      };
      return;
    }
    ctx.body = {
      code: 200,
      message: 'OK',
      date: true,
    };
  }
}

module.exports = CloudBuildTaskController;
