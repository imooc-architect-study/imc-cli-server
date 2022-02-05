'use strict';
const mongoose = require('mongoose');
const dbConfig = require('../config/db');
// mongoose.connect(dbConfig.mongodbURI).then(() => {
//   console.log('数据库连接成功');
// }).catch(() => {
//   console.log('数据库连接失败');
// });

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = async app => {
  await mongoose.connect(dbConfig.mongodbURI);
  console.log('数据库连接成功');
  const { router, controller } = app;
  router.prefix('/imcCli');
  router.get('/project/template', controller.project.getTemplate);
  router.get('/cloudBuildTask/list', controller.cloudBuildTask.getTaskList);
  router.get('/cloudBuildTask/checkTask', controller.cloudBuildTask.checkTask);
  // webscoket
  // app.io.of('/')
  app.io.route('build', app.io.controller.build.index);

  // app.io.of('/chat')
  // app.io.of('/chat').route('chat', app.io.controller.chat.index);
};
