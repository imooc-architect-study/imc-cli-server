
'use strict';

class Redis {
  constructor() {
    this._cacheObj = {};
  }

  get(key) {
    return this._cacheObj[key];
  }

  set(key, value) {
    this._cacheObj[key] = value;
  }
}

module.exports = { redis: new Redis() };
