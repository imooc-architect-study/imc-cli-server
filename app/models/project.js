
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
});


module.exports = mongoose.model('project', project);
