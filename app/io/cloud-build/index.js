'use strict';

const CloudBuildTask = require('./task');
const { FAILED } = require('../../const');

const REDIS_PREFIX = 'cloudBuild';

class CloudBuild {
  constructor(ctx) {
    this.ctx = ctx;
    this.socket = ctx.socket;
    this.helper = ctx.helper;
    this.redis = ctx.redis;
    const client = this.socket.id;
    this.redisKey = `${REDIS_PREFIX}:${client}`;
    this.cloudBuildTask = null;
  }

  async createTask() {
    // 获取任务信息
    const task = this.redis.get(this.redisKey);
    this.socket.emit(
      'build',
      this.helper.parseMsg('create task', {
        message: '创建云构建任务',
      })
    );
    this.cloudBuildTask = new CloudBuildTask(
      {
        repo: task.repo,
        branch: task.branch,
        buildCmd: task.buildCmd,
      },
      this.ctx
    );
  }

  // 清除任务
  async clearTask() {
    this.redis.remove(this.redisKey);
  }

  async prepare() {
    await this.callHook('prepare', {
      startMsg: '开始执行构建前准备工作',
      endMsg: '构建前准备工作成功',
      failedMsg: '执行构建前准备工作失败',
      type: 'prepare',
    });
  }

  async download() {
    await this.callHook('download', {
      startMsg: '开始下载源码',
      endMsg: '下载源码成功',
      failedMsg: '下载源码失败',
      type: 'download',
    });
  }

  async checkPackageJson() {
    await this.callHook('checkPackageJson', {
      startMsg: '开始检查 package.json',
      endMsg: 'package.json 检查成功',
      failedMsg: result => {
        return `package.json 检查失败，失败原因：${result && result.message ? result.message : '未知'}`;
      },
      type: 'check package.json',
    });
  }

  async install() {
    await this.callHook('install', {
      startMsg: '开始安装依赖',
      endMsg: '安装依赖成功',
      failedMsg: '安装依赖失败',
      type: 'install',
    });
  }

  async build() {
    await this.callHook('build', {
      startMsg: '开始启动云构建',
      endMsg: '云构建任务执行成功',
      failedMsg: '云构建任务执行失败',
      type: 'build',
    });
  }

  async uploadPrepare() {
    await this.callHook('uploadPrepare', {
      startMsg: '开始检查构建产物',
      endMsg: '构建产物检查完成',
      failedMsg: result => {
        return `构建产物检查失败，失败原因：${result.message}`;
      },
      type: 'uploadPrepare',
    });
  }

  async callHook(method, {
    startMsg,
    endMsg,
    failedMsg,
    type,
  }) {
    this.socket.emit(
      'build',
      this.helper.parseMsg(type, {
        message: startMsg,
      })
    );

    const result = await this.cloudBuildTask[method]();
    if (!result || result.code === FAILED) {
      failedMsg = typeof failedMsg === 'function' ? failedMsg(result) : failedMsg;
      this.socket.emit(
        'build',
        this.helper.parseMsg(`${type} failed`, {
          message: failedMsg,
        })
      );
      return;
    }
    this.socket.emit(
      'build',
      this.helper.parseMsg(type, {
        message: endMsg,
      })
    );
  }

}

module.exports = CloudBuild;
