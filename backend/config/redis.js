// config/redis.js - Redis配置
const redis = require('redis')
const logger = require('../utils/logger')

let client = null

// Redis配置
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
}

// 连接Redis
async function connectRedis() {
  try {
    client = redis.createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port
      },
      password: redisConfig.password,
      database: redisConfig.db
    })

    client.on('error', (err) => {
      logger.error('Redis连接错误:', err)
    })

    client.on('connect', () => {
      logger.info('Redis连接成功')
    })

    client.on('ready', () => {
      logger.info('Redis准备就绪')
    })

    await client.connect()
    return client
  } catch (error) {
    logger.error('Redis连接失败:', error)
    throw error
  }
}

// 获取Redis客户端
function getRedis() {
  if (!client) {
    throw new Error('Redis未连接')
  }
  return client
}

// Redis工具方法
const redisUtils = {
  // 设置缓存
  async set(key, value, expireSeconds = 3600) {
    try {
      const client = getRedis()
      if (typeof value === 'object') {
        value = JSON.stringify(value)
      }
      await client.setEx(key, expireSeconds, value)
      return true
    } catch (error) {
      logger.error('Redis设置失败:', error)
      return false
    }
  },

  // 获取缓存
  async get(key) {
    try {
      const client = getRedis()
      const value = await client.get(key)
      if (value) {
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      }
      return null
    } catch (error) {
      logger.error('Redis获取失败:', error)
      return null
    }
  },

  // 删除缓存
  async del(key) {
    try {
      const client = getRedis()
      await client.del(key)
      return true
    } catch (error) {
      logger.error('Redis删除失败:', error)
      return false
    }
  },

  // 检查key是否存在
  async exists(key) {
    try {
      const client = getRedis()
      const result = await client.exists(key)
      return result === 1
    } catch (error) {
      logger.error('Redis检查存在失败:', error)
      return false
    }
  },

  // 设置过期时间
  async expire(key, seconds) {
    try {
      const client = getRedis()
      await client.expire(key, seconds)
      return true
    } catch (error) {
      logger.error('Redis设置过期时间失败:', error)
      return false
    }
  },

  // 获取剩余过期时间
  async ttl(key) {
    try {
      const client = getRedis()
      return await client.ttl(key)
    } catch (error) {
      logger.error('Redis获取TTL失败:', error)
      return -1
    }
  }
}

module.exports = {
  connectRedis,
  getRedis,
  redisUtils
}