
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
  remove(key) {
    if (key in this._cacheObj) {
      delete this._cacheObj[key];
    }
  }
}

module.exports = { redis: new Redis() };
