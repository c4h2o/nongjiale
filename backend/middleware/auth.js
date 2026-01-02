// middleware/auth.js - 认证中间件
const jwt = require('jsonwebtoken')
const Response = require('../utils/response')
const logger = require('../utils/logger')

function authMiddleware(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return Response.unauthorized(res, '缺少访问令牌')
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    logger.error('Token验证失败:', error)
    
    if (error.name === 'TokenExpiredError') {
      return Response.unauthorized(res, 'Token已过期')
    }
    
    if (error.name === 'JsonWebTokenError') {
      return Response.unauthorized(res, 'Token无效')
    }
    
    return Response.unauthorized(res, '认证失败')
  }
}

module.exports = authMiddleware