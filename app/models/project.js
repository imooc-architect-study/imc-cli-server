
'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const project = new Schema({
  name: {
    type: String,
    required: true,
  },
  npmName: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  // 模板类型，normal:标准，custom:自定义
  type: {
    type: String,
  },
  // 安装命令
  installCommand: {
    type: String,
  },
  // 启动命令
  startCommand: {
    type: String,
  },
});


module.exports = mongoose.model('project', project);
