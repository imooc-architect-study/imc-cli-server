'use strict';

const { FAILED } = require('../../const');
const CloudBuildTask = require('../../models/cloud-build-task');

const REDIS_PREFIX = 'cloudBuild';

async function createCloudBuildTask(ctx, app) {
  const { socket, helper, redis } = ctx;
  const client = socket.id;
  const redisKey = `${REDIS_PREFIX}:${client}`;
  // 获取任务信息
  const task = redis.get(redisKey);
  socket.emit(
    'build',
    helper.parseMsg('create task', {
      message: '创建云构建任务',
    })
  );
  return new CloudBuildTask(
    {
      repo: task.repo,
      branch: task.branch,
      buildCmd: task.buildCmd,
    },
    ctx
  );
}

async function prepare(cloudBuildTask, socket, helper) {
  socket.emit(
    'build',
    helper.parseMsg('prepare', {
      message: '开始执行构建前准备工作',
    })
  );

  const prepareRes = await cloudBuildTask.prepare();
  if (!prepareRes || prepareRes.code === FAILED) {
    socket.emit(
      'build',
      helper.parseMsg('prepare failed', {
        message: '执行构建前准备工作失败',
      })
    );
    return;
  }
  socket.emit(
    'build',
    helper.parseMsg('prepare', {
      message: '构建前准备工作成功',
    })
  );
}

async function download(cloudBuildTask, socket, helper) {
  socket.emit(
    'build',
    helper.parseMsg('download repo', {
      message: '开始下载源码',
    })
  );

  const downloadRes = await cloudBuildTask.download();
  if (!downloadRes || downloadRes.code === FAILED) {
    socket.emit(
      'build',
      helper.parseMsg('download failed', {
        message: '下载源码失败',
      })
    );
    return;
  }
  socket.emit(
    'build',
    helper.parseMsg('download repo', {
      message: '下载源码成功',
    })
  );
}

async function install(cloudBuildTask, socket, helper) {
  socket.emit(
    'build',
    helper.parseMsg('install', {
      message: '开始安装依赖',
    })
  );

  const installRes = await cloudBuildTask.install();
  if (!installRes || installRes.code === FAILED) {
    socket.emit(
      'build',
      helper.parseMsg('install failed', {
        message: '安装依赖失败',
      })
    );
    return;
  }
  socket.emit(
    'build',
    helper.parseMsg('install', {
      message: '安装依赖成功',
    })
  );
}

async function build(cloudBuildTask, socket, helper) {
  socket.emit(
    'build',
    helper.parseMsg('build', {
      message: '开始启动云构建',
    })
  );

  const buildRes = await cloudBuildTask.build();
  if (!buildRes || buildRes.code === FAILED) {
    socket.emit(
      'build',
      helper.parseMsg('build failed', {
        message: '云构建任务执行失败',
      })
    );
    return;
  }
  socket.emit(
    'build',
    helper.parseMsg('build', {
      message: '云构建任务执行成功',
    })
  );
}


module.exports = app => {
  class Controller extends app.Controller {
    async index() {
      const { ctx, app } = this;
      const { socket, helper } = ctx;
      // 创建一个云构建任务
      const cloudBuildTask = await createCloudBuildTask(ctx, app);
      try {
        await prepare(cloudBuildTask, socket, helper);
        await download(cloudBuildTask, socket, helper);
        await install(cloudBuildTask, socket, helper);
        await build(cloudBuildTask, socket, helper);
      } catch (error) {
        socket.emit(
          'build',
          helper.parseMsg('error', {
            message: '云构建失败，失败原因：' + error.message,
          })
        );
        // 出现错误主动断开
        socket.disconnect();
      }
    }
  }
  return Controller;
};
