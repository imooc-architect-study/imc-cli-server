
'use strict';

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const schemaModel = new Schema({
  // 名称
  name: {
    type: String,
    required: true,
  },
  // 仓库地址
  repo: {
    type: String,
    required: true,
  },
  //   允许打包的分支
  branches: {
    type: Array,
  },
  // 打包构建产物目录
  distPath: {
    type: String,
    default: './dist',
  },
  // 服务器存放目录
  serverDir: {
    type: String,
    required: true,
  },
  // 安装命令
  installCommand: {
    type: String,
    default: 'npm install',
  },
  // 打包命令
  buildCommand: {
    type: String,
    default: 'npm run build',
  },
  sshHost: {
    type: String,
    required: true,
  },
  sshUsername: {
    type: String,
    required: true,
  },
  sshPassword: {
    type: String,
    required: true,
  },
  sshPort: {
    type: Number,
    default: 22,
  },
});


module.exports = mongoose.model('CloudBuildTask', schemaModel);
