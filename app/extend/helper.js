
'use strict';

module.exports = {
  /**
     *
     * @param {*} action 行为
     * @param {*} payload 参数
     * @param {*} metadata 元数据
     * @return
     */
  parseMsg(action, payload = {}, metadata = {}) {
    const meta = Object.assign({}, {
      timestamp: Date.now(),
    }, metadata);

    return {
      meta,
      data: {
        action,
        payload,
      },
    };
  },
};
