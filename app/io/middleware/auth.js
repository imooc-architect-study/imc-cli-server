'use strict';

const REDIS_PREFIX = 'cloudBuild';

module.exports = () => {
  return async (ctx, next) => {
    // console.log('connect');
    const { socket, logger, helper, redis } = ctx;
    // 连接的唯一id
    const { id } = socket;
    const query = socket.handshake.query;
    try {
      // logger.info('query', query);
      socket.emit(id, helper.parseMsg('connect', {
        type: 'connect',
        message: '云构建服务连接成功',
      }));

      // 存储云构建任务
      const redisKey = `${REDIS_PREFIX}:${id}`;
      let hasTask = redis.get(redisKey);
      if (!hasTask) {
        redis.set(redisKey, { ...query });
      }
      hasTask = redis.get(redisKey);
      await next();
      // console.log('disconnect!');
    } catch (error) {
      logger.error('build error', error.message);
    }
  };
};
