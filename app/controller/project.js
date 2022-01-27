'use strict';

const { Controller } = require('egg');

const ProjectModel = require('../models/project.js');

class ProjectController extends Controller {
  async getTemplate() {
    const { ctx } = this;
    const result = await ProjectModel.find();
    ctx.body = result;
  }
}

module.exports = ProjectController;
