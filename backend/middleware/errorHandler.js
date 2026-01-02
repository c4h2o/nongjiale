// middleware/errorHandler.js - 错误处理中间件
const logger = require('../utils/logger')
const Response = require('../utils/response')

function errorHandler(err, req, res, next) {
  logger.error('API错误:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // 数据库错误
  if (err.code === 'ER_DUP_ENTRY') {
    return Response.error(res, '数据已存在', 409)
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return Response.error(res, '关联数据不存在', 400)
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return Response.unauthorized(res, 'Token无效')
  }

  if (err.name === 'TokenExpiredError') {
    return Response.unauthorized(res, 'Token已过期')
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return Response.validationError(res, err.details)
  }

  // 自定义业务错误
  if (err.isBusinessError) {
    return Response.error(res, err.message, err.statusCode || 400)
  }

  // 默认服务器错误
  return Response.serverError(res, process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message)
}

module.exports = errorHandler