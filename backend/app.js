// app.js - 主应用入口
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const logger = require('./utils/logger')
const { connectDB } = require('./config/database')
const { connectRedis } = require('./config/redis')
const errorHandler = require('./middleware/errorHandler')
const authMiddleware = require('./middleware/auth')

// 路由
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const gardenRoutes = require('./routes/gardens')
const deviceRoutes = require('./routes/devices')
const serviceRoutes = require('./routes/services')
const orderRoutes = require('./routes/orders')
const promotionRoutes = require('./routes/promotion')
const applicationRoutes = require('./routes/applications')

const app = express()
const PORT = process.env.PORT || 3000

// 安全中间件
app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  credentials: true
}))

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
})
app.use('/api/', limiter)

// 解析中间件
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`)
  next()
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// API路由
app.use('/api/auth', authRoutes)
app.use('/api/users', authMiddleware, userRoutes)
app.use('/api/gardens', authMiddleware, gardenRoutes)
app.use('/api/devices', authMiddleware, deviceRoutes)
app.use('/api/services', authMiddleware, serviceRoutes)
app.use('/api/orders', authMiddleware, orderRoutes)
app.use('/api/promotion', authMiddleware, promotionRoutes)
app.use('/api/applications', authMiddleware, applicationRoutes)

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  })
})

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDB()
    logger.info('数据库连接成功')
    
    // 连接Redis
    await connectRedis()
    logger.info('Redis连接成功')
    
    // 启动HTTP服务器
    app.listen(PORT, () => {
      logger.info(`服务器启动成功，端口: ${PORT}`)
      logger.info(`健康检查: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    logger.error('服务器启动失败:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('收到SIGTERM信号，正在关闭服务器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('收到SIGINT信号，正在关闭服务器...')
  process.exit(0)
})

startServer()

module.exports = app