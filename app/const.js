
'use strict';
const path = require('path');
const userhome = require('userhome');
module.exports = {
  SUCCESS: 0,
  FAILED: -1,
  CACHEDIR: path.resolve(userhome(), '.imc-cli', 'cloud-build'),
};
