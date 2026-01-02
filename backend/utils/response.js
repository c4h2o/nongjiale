// utils/response.js - 统一响应格式
class Response {
  // 成功响应
  static success(res, data = null, message = '操作成功', code = 200) {
    return res.status(code).json({
      success: true,
      code,
      message,
      data,
      timestamp: new Date().toISOString()
    })
  }

  // 错误响应
  static error(res, message = '操作失败', code = 400, data = null) {
    return res.status(code).json({
      success: false,
      code,
      message,
      data,
      timestamp: new Date().toISOString()
    })
  }

  // 未授权
  static unauthorized(res, message = '未授权访问') {
    return this.error(res, message, 401)
  }

  // 禁止访问
  static forbidden(res, message = '禁止访问') {
    return this.error(res, message, 403)
  }

  // 资源不存在
  static notFound(res, message = '资源不存在') {
    return this.error(res, message, 404)
  }

  // 服务器错误
  static serverError(res, message = '服务器内部错误') {
    return this.error(res, message, 500)
  }

  // 参数验证错误
  static validationError(res, errors) {
    return this.error(res, '参数验证失败', 422, errors)
  }

  // 分页响应
  static paginated(res, data, pagination, message = '获取成功') {
    return res.status(200).json({
      success: true,
      code: 200,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit)
      },
      timestamp: new Date().toISOString()
    })
  }
}

module.exports = Response