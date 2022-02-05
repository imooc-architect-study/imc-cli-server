'use strict';

const path = require('path');
const fse = require('fs-extra');
const gitClone = require('git-clone/promise');
const cp = require('child_process');
const CloudBuildTaskModel = require('../../models/cloud-build-task');

const { SUCCESS, FAILED, CACHEDIR } = require('../../const');

class CloudBuildTask {
  constructor(props, ctx) {
    this._ctx = ctx;
    //   仓库地址
    this._repo = props.repo;
    // 分支
    this._branch = props.branch;
    //   构建命令
    this._buildCmd = props.buildCmd;
    //   缓存源码目录
    this._sourceCodeDir = path.resolve(
      CACHEDIR,
      Buffer.from(props.repo).toString('base64')
    );

    this._ctx.logger.info('_sourceCodeDir', this._sourceCodeDir);
  }

  // 准备工作
  async prepare() {
    fse.ensureDirSync(CACHEDIR);
    fse.emptyDirSync(this._sourceCodeDir);
    return this.success();
  }

  // 下载源码
  async download() {
    await gitClone(this._repo, this._sourceCodeDir, {
      checkout: this._branch,
    });
    return this.success();
  }

  // 安装依赖
  async install() {
    let res = true;
    res && (res = await this.execCommand('npm install'));
    return res ? this.success() : this.failed();
  }
  // 打包
  async build() {
    let res = true;
    res && (res = await this.execCommand(this._buildCmd));
    return res ? this.success() : this.failed();
  }

  async checkPackageJson() {
    const pckPath = path.resolve(this._sourceCodeDir, 'package.json');
    if (!fse.existsSync(pckPath)) {
      return this.failed('package.json不存在');
    }
    return this.success();
  }

  async uploadPrepare() {
    // 打包构建产物检查
    const taskItem = await CloudBuildTaskModel.findOne({ repo: this._repo });
    const distPath = path.resolve(this._sourceCodeDir, taskItem.distPath);
    if (!fse.existsSync(distPath)) {
      return this.failed('查询不到构建产物');
    }
    return this.success();
  }


  execCommand(command) {
    const commands = command.split(' ');
    if (commands.length === 0) {
      return null;
    }
    const firstCommand = commands[0];
    const leftCommands = commands.slice(1);
    return new Promise(resolve => {
      const p = exec(
        firstCommand,
        leftCommands,
        {
          cwd: this._sourceCodeDir,
        },
        { stdio: 'pipe' }
      );
      p.on('error', e => {
        this._ctx.logger.error('build error', e);
        resolve(false);
      });
      p.on('exit', c => {
        this._ctx.logger.info('build exit', c);
        resolve(true);
      });

      p.stdout.on('data', data => {
        this._ctx.socket.emit('building', data.toString());
      });
      p.stderr.on('data', data => {
        this._ctx.socket.emit('building', data.toString());
      });
    });
  }

  success(message, data) {
    return this.response(SUCCESS, message, data);
  }

  failed(message, data) {
    return this.response(FAILED, message, data);
  }

  response(code, message, data) {
    return {
      code,
      message,
      data,
    };
  }
}

function exec(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? [ '/c' ].concat(command, args) : args;
  return cp.spawn(cmd, cmdArgs, options || {});
}

module.exports = CloudBuildTask;
