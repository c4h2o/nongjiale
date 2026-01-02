// 网络请求工具类
const app = getApp()
const errorHandler = require('./errorHandler')
const performanceMonitor = require('./performance')

class Request {
  constructor() {
    this.baseUrl = ''
    this.timeout = 10000
    this.retryCount = 2
    this.requestQueue = new Map() // 请求队列，防止重复请求
  }

  // 获取基础URL
  getBaseUrl() {
    if (!this.baseUrl) {
      this.baseUrl = app.globalData.baseUrl || 'http://localhost:3000/api'
    }
    return this.baseUrl
  }

  // 生成请求缓存key
  generateCacheKey(url, method, data) {
    const key = `${method}_${url}_${JSON.stringify(data)}`
    return key.replace(/[^a-zA-Z0-9]/g, '_')
  }

  // 统一请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      const { url, method = 'GET', data = {}, header = {}, retry = 0, useCache = false, cacheTime } = options
      const startTime = Date.now()
      
      // 生成请求唯一标识
      const requestKey = this.generateCacheKey(url, method, data)
      
      // 检查是否有相同的请求正在进行
      if (this.requestQueue.has(requestKey)) {
        console.log(`[请求去重] 发现重复请求: ${url}`)
        return this.requestQueue.get(requestKey)
      }
      
      // 检查缓存（仅GET请求且启用缓存）
      if (method === 'GET' && useCache) {
        const cachedData = performanceMonitor.cacheManager.get(requestKey)
        if (cachedData) {
          console.log(`[缓存命中] ${url}`)
          resolve(cachedData)
          return
        }
      }
      
      // 添加token到请求头
      if (app.globalData.token) {
        header.Authorization = `Bearer ${app.globalData.token}`
      }
      
      // 添加请求ID用于日志追踪
      const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
      header['X-Request-ID'] = requestId
      
      console.log(`[${requestId}] 发起请求:`, {
        url: this.getBaseUrl() + url,
        method,
        data: method === 'GET' ? data : '***',
        hasToken: !!app.globalData.token,
        useCache
      })
      
      const requestPromise = new Promise((innerResolve, innerReject) => {
        wx.request({
          url: this.getBaseUrl() + url,
          method,
          data,
          header: {
            'Content-Type': 'application/json',
            ...header
          },
          timeout: this.timeout,
          success: (res) => {
            const responseTime = Date.now() - startTime
            
            // 记录API响应时间
            performanceMonitor.recordApiResponseTime(url, responseTime)
            
            console.log(`[${requestId}] 请求响应:`, {
              statusCode: res.statusCode,
              success: res.data?.success,
              message: res.data?.message,
              responseTime: responseTime + 'ms'
            })
            
            if (res.statusCode === 200) {
              if (res.data.success !== false) {
                // 缓存成功的GET请求结果
                if (method === 'GET' && useCache && res.data) {
                  const actualCacheTime = cacheTime || app.globalData.cacheTime
                  performanceMonitor.cacheManager.set(requestKey, res.data, actualCacheTime)
                }
                
                innerResolve(res.data)
              } else {
                const errorMessage = errorHandler.handleBusinessError(res.data)
                errorHandler.showError(errorMessage)
                innerReject(res.data)
              }
            } else if (res.statusCode === 401) {
              // token过期或无效，尝试刷新或跳转登录
              this.handleUnauthorized()
              innerReject(res.data)
            } else if (res.statusCode === 403) {
              errorHandler.showError('无权限访问')
              innerReject(res.data)
            } else if (res.statusCode >= 500) {
              const errorMessage = errorHandler.handlePerformanceError({ code: 'SERVER_ERROR' })
              errorHandler.showError(errorMessage)
              innerReject(res.data)
            } else {
              errorHandler.showError(`请求失败 (${res.statusCode})`)
              innerReject(res.data)
            }
          },
          fail: (err) => {
            const responseTime = Date.now() - startTime
            console.error(`[${requestId}] 请求失败:`, err, `耗时: ${responseTime}ms`)
            
            // 网络错误重试机制
            if (retry < this.retryCount && this.shouldRetry(err)) {
              console.log(`[${requestId}] 重试请求 (${retry + 1}/${this.retryCount})`)
              setTimeout(() => {
                this.request({ ...options, retry: retry + 1 })
                  .then(innerResolve)
                  .catch(innerReject)
              }, 1000 * (retry + 1))
            } else {
              const errorMessage = errorHandler.handleNetworkError(err)
              errorHandler.showError(errorMessage)
              errorHandler.logError('NETWORK_ERROR', err, { url, method, retry })
              innerReject(err)
            }
          },
          complete: () => {
            // 请求完成后从队列中移除
            this.requestQueue.delete(requestKey)
          }
        })
      })
      
      // 将请求添加到队列
      this.requestQueue.set(requestKey, requestPromise)
      
      requestPromise.then(resolve).catch(reject)
    })
  }

  // 判断是否应该重试
  shouldRetry(error) {
    const retryableErrors = [
      'request:fail timeout',
      'request:fail -1',
      'request:fail net::ERR_NETWORK_CHANGED',
      'request:fail net::ERR_INTERNET_DISCONNECTED'
    ]
    
    return retryableErrors.some(errType => 
      error.errMsg && error.errMsg.includes(errType)
    )
  }

  // GET请求（支持缓存）
  get(url, data = {}, options = {}) {
    // GET请求将参数拼接到URL
    if (Object.keys(data).length > 0) {
      const params = new URLSearchParams(data).toString()
      url += (url.includes('?') ? '&' : '?') + params
    }
    
    // 默认启用缓存
    const requestOptions = {
      url, 
      method: 'GET',
      useCache: options.useCache !== false, // 默认启用缓存
      cacheTime: options.cacheTime,
      ...options
    }
    
    return this.request(requestOptions)
  }

  // POST请求
  post(url, data = {}, options = {}) {
    return this.request({ 
      url, 
      method: 'POST', 
      data,
      ...options
    })
  }

  // PUT请求
  put(url, data = {}, options = {}) {
    return this.request({ 
      url, 
      method: 'PUT', 
      data,
      ...options
    })
  }

  // DELETE请求
  delete(url, data = {}, options = {}) {
    return this.request({ 
      url, 
      method: 'DELETE', 
      data,
      ...options
    })
  }

  // 处理未授权错误
  handleUnauthorized() {
    console.log('Token无效或过期，需要重新登录')
    
    // 清除本地token和缓存
    const authService = require('../services/auth')
    authService.clearLoginData()
    
    // 清除相关缓存
    performanceMonitor.cacheManager.clearExpired()
    
    wx.showModal({
      title: '提示',
      content: '登录已过期，请重新登录',
      showCancel: false,
      success: () => {
        wx.reLaunch({
          url: '/pages/login/login'
        })
      }
    })
  }

  // 设置基础URL（用于切换环境）
  setBaseUrl(url) {
    this.baseUrl = url
  }

  // 设置超时时间
  setTimeout(timeout) {
    this.timeout = timeout
  }

  // 批量请求（支持并发控制）
  async batchRequest(requests, concurrency = 3) {
    try {
      const results = []
      
      // 分批处理请求
      for (let i = 0; i < requests.length; i += concurrency) {
        const batch = requests.slice(i, i + concurrency)
        const batchResults = await Promise.allSettled(
          batch.map(req => this.request(req))
        )
        
        results.push(...batchResults.map((result, index) => ({
          index: i + index,
          status: result.status,
          data: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason : null
        })))
      }
      
      return results
    } catch (error) {
      errorHandler.logError('BATCH_REQUEST_ERROR', error)
      throw error
    }
  }

  // 上传文件（支持进度回调）
  uploadFile(options) {
    return new Promise((resolve, reject) => {
      const { 
        filePath, 
        name = 'file', 
        formData = {}, 
        header = {},
        onProgress
      } = options
      const startTime = Date.now()
      
      // 添加token到请求头
      if (app.globalData.token) {
        header.Authorization = `Bearer ${app.globalData.token}`
      }
      
      const requestId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)
      
      console.log(`[${requestId}] 开始上传文件:`, filePath)
      
      const uploadTask = wx.uploadFile({
        url: this.getBaseUrl() + '/upload',
        filePath,
        name,
        formData,
        header,
        success: (res) => {
          const responseTime = Date.now() - startTime
          console.log(`[${requestId}] 文件上传成功:`, `耗时: ${responseTime}ms`)
          
          try {
            const data = JSON.parse(res.data)
            resolve(data)
          } catch (error) {
            resolve(res.data)
          }
        },
        fail: (err) => {
          const responseTime = Date.now() - startTime
          console.error(`[${requestId}] 文件上传失败:`, err, `耗时: ${responseTime}ms`)
          
          errorHandler.showError('文件上传失败')
          errorHandler.logError('UPLOAD_ERROR', err, { filePath, name })
          reject(err)
        }
      })
      
      // 监听上传进度
      if (onProgress && typeof onProgress === 'function') {
        uploadTask.onProgressUpdate((res) => {
          onProgress({
            progress: res.progress,
            totalBytesSent: res.totalBytesSent,
            totalBytesExpectedToSend: res.totalBytesExpectedToSend
          })
        })
      }
    })
  }

  // 清除所有缓存
  clearCache() {
    performanceMonitor.cacheManager.clearExpired()
    console.log('请求缓存已清除')
  }

  // 预热请求（预加载数据）
  async preloadData(requests) {
    console.log('开始预加载数据:', requests.length, '个请求')
    
    try {
      const results = await this.batchRequest(
        requests.map(req => ({ ...req, useCache: true })),
        2 // 限制并发数
      )
      
      const successCount = results.filter(r => r.status === 'fulfilled').length
      console.log(`数据预加载完成: ${successCount}/${requests.length} 成功`)
      
      return results
    } catch (error) {
      console.error('数据预加载失败:', error)
      return []
    }
  }
}

module.exports = new Request()