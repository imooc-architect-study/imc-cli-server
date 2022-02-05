'use strict';

const path = require('path');
const fse = require('fs-extra');
const gitClone = require('git-clone/promise');
const cp = require('child_process');
const archiver = require('archiver');
const { NodeSSH } = require('node-ssh');


const CloudBuildTaskModel = require('../../models/cloud-build-task');

const { SUCCESS, FAILED, CACHEDIR } = require('../../const');

const zipName = 'dist.zip';


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
    // 压缩文件目录
    this.zipPath = path.resolve(this._sourceCodeDir, 'temp', zipName);

    // 任务详情
    this.taskItem = null;
    // ssh连接实例
    this.ssh = null;
    // 构建产物路径
    this.distPath = null;

    // 服务器路径
    this.serverDir = null;
    // 服务器文件夹
    this.serverTarget = null;

    this._ctx.logger.info('_sourceCodeDir', this._sourceCodeDir);
  }

  // 准备工作
  async prepare() {
    fse.ensureDirSync(CACHEDIR);
    fse.emptyDirSync(this._sourceCodeDir);
    this.taskItem = await CloudBuildTaskModel.findOne({ repo: this._repo });
    if (!this.taskItem) {
      return this.failed('查询不到注册任务');
    }
    // 构建产物路径
    this.distPath = path.resolve(this._sourceCodeDir, this.taskItem.distPath);
    this.serverDir = formatPath(path.join(this.taskItem.serverDir, '..'));
    this.serverTarget = path.basename(this.taskItem.serverDir);
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

  // 上传资源预检查
  async uploadPrepare() {
    // 打包构建产物检查
    if (!fse.existsSync(this.distPath)) {
      return this.failed('查询不到构建产物');
    }
    return this.success();
  }

  // 连接服务器
  async sSHConnect() {
    this.ssh = new NodeSSH();
    return this.ssh
      .connect({
        host: this.taskItem.sshHost,
        username: this.taskItem.sshUsername,
        password: this.taskItem.sshPassword,
        tryKeyboard: true,
        onKeyboardInteractive(
          name,
          instructions,
          instructionsLang,
          prompts,
          finish
        ) {
          if (
            prompts.length > 0 &&
              prompts[0].prompt.toLowerCase().includes('password')
          ) {
            finish([ this.taskItem.sshPassword ]);
          }
        },
      })
      .then(() => {
        return this.success(`${this.taskItem.sshHost} 连接成功`);
      })
      .catch(() => {
        return this.failed(`${this.taskItem.sshHost} 连接失败`);
      });

  }

  // 压缩文件
  compressFile() {
    return new Promise((resolve, reject) => {
      fse.ensureFileSync(this.zipPath);
      const output = fse.createWriteStream(this.zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // 设置压缩等级
      });
      output
        .on('close', () => {
          resolve(this.success(`压缩完成！共计 ${(archive.pointer() / 1024 / 1024).toFixed(3)}MB`));
        })
        .on('error', err => {
          reject(this.failed(err.message));
        });
      archive.pipe(output); // 管道存档数据到文件
      archive.directory(this.distPath, this.serverTarget); // 存储目标文件并重命名
      archive.finalize(); // 完成文件追加 确保写入流完成
    });
  }

  // 删除服务器文件
  async deleteServerFile() {
    // 先删除文件
    await runCommand(
      this.ssh,
      `
      if [ -d ${this.serverTarget} ];
      then rm -rf ${this.serverTarget}
      fi
      `,
      this.serverDir
    );
    return this.success();
  }

  // 上传文件
  async putFile() {
    const targetPath = path.join(this.serverDir, zipName);
    await this.ssh.putFile(this.zipPath, formatPath(targetPath));
    return this.success();
  }

  // 解压文件
  async unzip() {
    await runCommand(this.ssh, `unzip ${zipName}`, this.serverDir);
    return this.success();
  }

  // 删除压缩文件
  async deleleZip() {
    const targetPath = path.join(this.serverDir, zipName);
    await runCommand(this.ssh, `rm -f ${formatPath(targetPath)}`, this.serverDir);
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

  clear() {
    fse.removeSync(this._sourceCodeDir);
  }
}

function exec(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? [ '/c' ].concat(command, args) : args;
  return cp.spawn(cmd, cmdArgs, options || {});
}

function runCommand(ssh, command, path) {
  return new Promise((resolve, reject) => {
    ssh
      .execCommand(command, {
        cwd: path,
      })
      .then(res => {
        if (res.stderr) {
          reject(res.stderr);
        } else {
          resolve(res);
        }
      });
  });
}

function formatPath(str) {
  if (!str) {
    return '';
  }
  return str.replace(/\\/g, '/');
}

module.exports = CloudBuildTask;
