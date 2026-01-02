// 全局错误处理工具
class ErrorHandler {
  constructor() {
    this.init()
  }

  // 初始化错误处理
  init() {
    // 监听小程序全局错误
    wx.onError((error) => {
      console.error('小程序全局错误:', error)
      this.handleGlobalError(error)
    })

    // 监听未处理的Promise拒绝
    wx.onUnhandledRejection((res) => {
      console.error('未处理的Promise拒绝:', res)
      this.handleUnhandledRejection(res)
    })

    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      this.handleNetworkStatusChange(res)
    })

    // 监听内存不足警告
    wx.onMemoryWarning((res) => {
      console.warn('内存不足警告:', res)
      this.handleMemoryWarning(res)
    })
  }

  // 处理全局错误
  handleGlobalError(error) {
    // 过滤掉一些不需要处理的错误
    const ignoredErrors = [
      'Non-Error promise rejection captured',
      'Script error',
      'Network request failed'
    ]

    if (ignoredErrors.some(ignored => error.includes(ignored))) {
      return
    }

    // 显示用户友好的错误提示
    wx.showToast({
      title: '系统异常，请重试',
      icon: 'none',
      duration: 2000
    })

    // 记录错误日志（可以发送到服务器）
    this.logError('GLOBAL_ERROR', error)
  }

  // 处理未处理的Promise拒绝
  handleUnhandledRejection(res) {
    console.error('未处理的Promise拒绝:', res.reason)
    
    // 如果是网络错误，不重复显示提示
    if (res.reason && res.reason.errMsg && res.reason.errMsg.includes('request:fail')) {
      return
    }

    this.logError('UNHANDLED_REJECTION', res.reason)
  }

  // 处理网络状态变化
  handleNetworkStatusChange(res) {
    if (!res.isConnected) {
      wx.showToast({
        title: '网络连接已断开',
        icon: 'none',
        duration: 2000
      })
    } else if (res.networkType === '2g') {
      wx.showToast({
        title: '网络较慢，请耐心等待',
        icon: 'none',
        duration: 2000
      })
    }
  }

  // 处理内存警告
  handleMemoryWarning(res) {
    console.warn('内存使用过高，建议释放资源')
    
    // 可以在这里执行一些清理操作
    this.clearCache()
  }

  // 网络错误处理
  handleNetworkError(error) {
    const errorMessages = {
      'request:fail timeout': '请求超时，请检查网络连接',
      'request:fail -1': '网络连接失败，请检查网络设置',
      'request:fail net::ERR_NETWORK_CHANGED': '网络环境发生变化，请重试',
      'request:fail net::ERR_INTERNET_DISCONNECTED': '网络连接已断开，请检查网络',
      'request:fail net::ERR_NAME_NOT_RESOLVED': '无法连接到服务器，请稍后重试',
      'request:fail net::ERR_CONNECTION_REFUSED': '服务器拒绝连接，请稍后重试'
    }

    let message = '网络连接失败，请检查网络设置'
    
    if (error.errMsg) {
      for (const [key, value] of Object.entries(errorMessages)) {
        if (error.errMsg.includes(key)) {
          message = value
          break
        }
      }
    }

    return message
  }

  // 设备操作错误处理
  handleDeviceError(error) {
    const deviceErrorMessages = {
      'DEVICE_OFFLINE': '设备离线，请检查设备连接状态',
      'OPERATION_COOLDOWN': '操作冷却中，请稍后再试',
      'DEVICE_BUSY': '设备忙碌中，请稍后重试',
      'CAMERA_OFFLINE': '摄像头离线，无法查看实时画面',
      'STREAM_ERROR': '视频流异常，请刷新重试',
      'IRRIGATION_TIMEOUT': '灌溉操作超时，请检查设备状态',
      'SENSOR_ERROR': '传感器异常，数据可能不准确'
    }

    return deviceErrorMessages[error.code] || '设备操作失败，请重试'
  }

  // 业务逻辑错误处理
  handleBusinessError(error) {
    const businessErrorMessages = {
      'GARDEN_NOT_FOUND': '菜园不存在',
      'GARDEN_ALREADY_BOUND': '菜园已绑定',
      'GARDEN_ID_INVALID': '菜园ID格式不正确',
      'ORDER_NOT_FOUND': '订单不存在',
      'ORDER_STATUS_INVALID': '订单状态不允许此操作',
      'INVALID_DATE': '预约日期无效（请选择近7天内日期）',
      'SERVICE_UNAVAILABLE': '服务暂时不可用',
      'FORM_VALIDATION_ERROR': '表单信息填写不完整',
      'PHONE_FORMAT_ERROR': '请输入正确的手机号格式',
      'USER_NOT_FOUND': '用户不存在',
      'PERMISSION_DENIED': '权限不足',
      'RESOURCE_LIMIT_EXCEEDED': '资源使用超限',
      'DUPLICATE_OPERATION': '重复操作，请勿重复提交'
    }

    return businessErrorMessages[error.code] || error.message || '操作失败，请重试'
  }

  // 表单验证错误处理
  handleValidationError(errors) {
    if (Array.isArray(errors)) {
      // 显示第一个错误
      const firstError = errors[0]
      wx.showToast({
        title: firstError.message || '表单验证失败',
        icon: 'none',
        duration: 2000
      })
    } else if (typeof errors === 'string') {
      wx.showToast({
        title: errors,
        icon: 'none',
        duration: 2000
      })
    }
  }

  // 性能相关错误处理
  handlePerformanceError(error) {
    const performanceErrorMessages = {
      'PAGE_LOAD_TIMEOUT': '页面加载超时，请刷新重试',
      'VIDEO_LOAD_TIMEOUT': '视频加载超时，请检查网络连接',
      'OPERATION_TIMEOUT': '操作响应超时，请重试',
      'MEMORY_LIMIT_EXCEEDED': '内存使用过高，请重启小程序',
      'RENDER_ERROR': '页面渲染异常，请重试'
    }

    return performanceErrorMessages[error.code] || '系统响应超时，请重试'
  }

  // 显示错误提示
  showError(message, options = {}) {
    const defaultOptions = {
      title: message,
      icon: 'none',
      duration: 2000,
      mask: false
    }

    wx.showToast({
      ...defaultOptions,
      ...options
    })
  }

  // 显示成功提示
  showSuccess(message, options = {}) {
    const defaultOptions = {
      title: message,
      icon: 'success',
      duration: 1500,
      mask: false
    }

    wx.showToast({
      ...defaultOptions,
      ...options
    })
  }

  // 显示加载提示
  showLoading(message = '加载中...', options = {}) {
    const defaultOptions = {
      title: message,
      mask: true
    }

    wx.showLoading({
      ...defaultOptions,
      ...options
    })
  }

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading()
  }

  // 显示确认对话框
  showConfirm(options = {}) {
    const defaultOptions = {
      title: '提示',
      content: '确定要执行此操作吗？',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消'
    }

    return new Promise((resolve) => {
      wx.showModal({
        ...defaultOptions,
        ...options,
        success: (res) => {
          resolve(res.confirm)
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  }

  // 记录错误日志
  logError(type, error, context = {}) {
    const errorLog = {
      type,
      error: typeof error === 'string' ? error : JSON.stringify(error),
      context,
      timestamp: new Date().toISOString(),
      userAgent: wx.getSystemInfoSync(),
      page: getCurrentPages().pop()?.route || 'unknown'
    }

    console.error('错误日志:', errorLog)

    // 可以在这里发送错误日志到服务器
    // this.sendErrorLog(errorLog)
  }

  // 发送错误日志到服务器（可选）
  async sendErrorLog(errorLog) {
    try {
      // 这里可以调用API发送错误日志
      // await request.post('/logs/error', errorLog)
    } catch (err) {
      console.error('发送错误日志失败:', err)
    }
  }

  // 清理缓存
  clearCache() {
    try {
      // 清理本地存储中的临时数据
      const storage = wx.getStorageInfoSync()
      const tempKeys = storage.keys.filter(key => 
        key.startsWith('temp_') || key.startsWith('cache_')
      )
      
      tempKeys.forEach(key => {
        wx.removeStorageSync(key)
      })

      console.log('缓存清理完成，清理了', tempKeys.length, '个临时文件')
    } catch (error) {
      console.error('清理缓存失败:', error)
    }
  }

  // 检查网络状态
  async checkNetworkStatus() {
    try {
      const networkInfo = await wx.getNetworkType()
      return {
        isConnected: networkInfo.networkType !== 'none',
        networkType: networkInfo.networkType,
        isWifi: networkInfo.networkType === 'wifi',
        isSlowNetwork: ['2g', '3g'].includes(networkInfo.networkType)
      }
    } catch (error) {
      console.error('获取网络状态失败:', error)
      return {
        isConnected: false,
        networkType: 'unknown',
        isWifi: false,
        isSlowNetwork: false
      }
    }
  }

  // 重试机制
  async retry(fn, maxRetries = 3, delay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error) {
        console.log(`重试 ${i + 1}/${maxRetries}:`, error)
        
        if (i === maxRetries - 1) {
          throw error
        }
        
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
}

// 创建全局实例
const errorHandler = new ErrorHandler()

module.exports = errorHandler