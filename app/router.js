'use strict';
const mongoose = require('mongoose');
const dbConfig = require('../config/db');
mongoose.connect(dbConfig.mongodbURI).then(() => {
  console.log('数据库连接成功');
}).catch(() => {
  console.log('数据库连接失败');
});

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/project/getTemplate', controller.project.getTemplate);
};
