'use strict';
// const mongoose = require('mongoose');
// const dbConfig = require('../config/db');
// mongoose.connect(dbConfig.mongodbURI).then(() => {
//   console.log('数据库连接成功');
// }).catch(() => {
//   console.log('数据库连接失败');
// });

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = async app => {
  // await mongoose.connect(dbConfig.mongodbURI);
  const { router, controller } = app;
  router.get('/project/template', controller.project.getTemplate);
  // webscoket
  // app.io.of('/')
  app.io.route('chat', app.io.controller.build.index);

  // app.io.of('/chat')
  // app.io.of('/chat').route('chat', app.io.controller.chat.index);
};
