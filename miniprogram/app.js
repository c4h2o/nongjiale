// app.js
const errorHandler = require('./utils/errorHandler')
const performanceMonitor = require('./utils/performance')
const systemIntegration = require('./utils/systemIntegration')
const deploymentCheck = require('./utils/deploymentCheck')

App({
  onLaunch() {
    console.log('智慧共享菜园小程序启动')
    
    // 初始化错误处理
    this.initErrorHandler()
    
    // 初始化性能监控
    this.initPerformanceMonitor()
    
    // 检查网络状态
    this.checkNetworkStatus()
    
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 获取系统信息
    this.getSystemInfo()
    
    // 清理过期缓存
    this.cleanupExpiredCache()
    
    // 预登录（获取code但不立即登录）
    wx.login({
      success: res => {
        console.log('获取登录code成功:', res.code)
        this.globalData.loginCode = res.code
      },
      fail: err => {
        console.error('获取登录code失败:', err)
        errorHandler.logError('LOGIN_CODE_FAIL', err)
      }
    })

    // 预加载关键资源
    this.preloadCriticalResources()

    // 开发环境下运行系统检查
    if (this.globalData.isDev) {
      this.runDevelopmentChecks()
    }
  },

  onShow() {
    console.log('小程序显示')
    // 检查网络状态
    this.checkNetworkStatus()
    
    // 生成性能报告（仅在开发环境）
    if (this.globalData.isDev) {
      this.generatePerformanceReport()
    }
  },

  onHide() {
    console.log('小程序隐藏')
  },

  onError(error) {
    console.error('小程序错误:', error)
    errorHandler.logError('APP_ERROR', error)
  },

  // 初始化错误处理
  initErrorHandler() {
    console.log('初始化全局错误处理')
    // errorHandler已经在require时自动初始化
  },

  // 初始化性能监控
  initPerformanceMonitor() {
    console.log('初始化性能监控')
    
    // 设置性能监控配置
    this.globalData.performanceConfig = {
      enableMonitoring: true,
      pageLoadThreshold: 3000, // 页面加载时间阈值
      apiResponseThreshold: 2000, // API响应时间阈值
      memoryUsageThreshold: 0.8 // 内存使用率阈值
    }
  },

  // 运行开发环境检查
  async runDevelopmentChecks() {
    console.log('运行开发环境检查...')
    
    try {
      // 延迟执行，避免影响启动性能
      setTimeout(async () => {
        // 运行系统集成测试
        const integrationReport = await systemIntegration.runIntegrationTests()
        console.log('系统集成测试完成:', integrationReport.summary)
        
        // 如果有失败的测试，显示警告
        if (integrationReport.summary.failed > 0) {
          console.warn('发现系统集成问题，请检查控制台日志')
        }
        
        // 运行部署准备检查
        const deploymentReport = await deploymentCheck.runDeploymentCheck()
        console.log('部署准备检查完成:', deploymentReport.summary)
        
        // 存储检查结果供调试使用
        this.globalData.systemStatus = {
          integration: integrationReport,
          deployment: deploymentReport,
          lastCheck: new Date().toISOString()
        }
        
      }, 3000) // 3秒后执行
      
    } catch (error) {
      console.error('开发环境检查失败:', error)
    }
  },

  // 检查网络状态
  async checkNetworkStatus() {
    try {
      const networkStatus = await errorHandler.checkNetworkStatus()
      this.globalData.networkStatus = networkStatus
      
      if (!networkStatus.isConnected) {
        errorHandler.showError('网络连接不可用，请检查网络设置')
      } else if (networkStatus.isSlowNetwork) {
        console.log('检测到慢速网络，可能影响使用体验')
        // 在慢速网络下启用优化策略
        this.enableSlowNetworkOptimization()
      }
    } catch (error) {
      console.error('检查网络状态失败:', error)
    }
  },

  // 慢速网络优化
  enableSlowNetworkOptimization() {
    console.log('启用慢速网络优化策略')
    
    // 减少图片质量
    this.globalData.imageQuality = 'low'
    
    // 增加缓存时间
    this.globalData.cacheTime = 60 * 60 * 1000 // 1小时
    
    // 减少轮询频率
    this.globalData.pollInterval = 10000 // 10秒
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      this.globalData.systemInfo = systemInfo
      
      console.log('系统信息:', {
        platform: systemInfo.platform,
        version: systemInfo.version,
        SDKVersion: systemInfo.SDKVersion,
        screenWidth: systemInfo.screenWidth,
        screenHeight: systemInfo.screenHeight
      })
      
      // 检查基础库版本
      if (this.compareVersion(systemInfo.SDKVersion, '2.30.0') < 0) {
        wx.showModal({
          title: '版本过低',
          content: '当前微信版本过低，可能影响小程序正常使用，建议升级到最新版本。',
          showCancel: false
        })
      }

      // 根据设备性能调整配置
      this.adjustConfigByDevice(systemInfo)
    } catch (error) {
      console.error('获取系统信息失败:', error)
      errorHandler.logError('SYSTEM_INFO_FAIL', error)
    }
  },

  // 根据设备性能调整配置
  adjustConfigByDevice(systemInfo) {
    const { platform, model } = systemInfo
    
    // 低端设备优化
    const isLowEndDevice = this.isLowEndDevice(systemInfo)
    if (isLowEndDevice) {
      console.log('检测到低端设备，启用性能优化')
      
      this.globalData.performanceMode = 'low'
      this.globalData.imageQuality = 'low'
      this.globalData.animationEnabled = false
      this.globalData.maxCacheSize = 10 // MB
    } else {
      this.globalData.performanceMode = 'normal'
      this.globalData.imageQuality = 'high'
      this.globalData.animationEnabled = true
      this.globalData.maxCacheSize = 50 // MB
    }
  },

  // 判断是否为低端设备
  isLowEndDevice(systemInfo) {
    // 简单的设备性能判断逻辑
    const { platform, model, system } = systemInfo
    
    // iOS设备判断
    if (platform === 'ios') {
      // iPhone 6及以下认为是低端设备
      const lowEndModels = ['iPhone 5', 'iPhone 6', 'iPhone SE']
      return lowEndModels.some(lowModel => model.includes(lowModel))
    }
    
    // Android设备判断（简化版）
    if (platform === 'android') {
      // 根据系统版本简单判断
      const androidVersion = parseFloat(system.match(/Android (\d+\.\d+)/)?.[1] || '0')
      return androidVersion < 8.0
    }
    
    return false
  },

  // 清理过期缓存
  cleanupExpiredCache() {
    try {
      performanceMonitor.cacheManager.clearExpired()
    } catch (error) {
      console.error('清理过期缓存失败:', error)
    }
  },

  // 预加载关键资源
  preloadCriticalResources() {
    const criticalResources = [
      // 预加载关键页面
      { type: 'page', url: '/pages/gardens/gardens' },
      { type: 'page', url: '/pages/monitor/monitor' },
      
      // 预加载关键图片（如果有的话）
      // { type: 'image', url: '/images/garden-placeholder.png' }
    ]
    
    performanceMonitor.preloadResources(criticalResources)
  },

  // 生成性能报告
  generatePerformanceReport() {
    try {
      const report = performanceMonitor.generatePerformanceReport()
      console.log('性能报告:', report)
      
      // 如果有性能问题，显示建议
      if (report.optimizationSuggestions.length > 0) {
        console.warn('性能优化建议:', report.optimizationSuggestions)
      }
    } catch (error) {
      console.error('生成性能报告失败:', error)
    }
  },

  // 版本比较
  compareVersion(v1, v2) {
    const arr1 = v1.split('.')
    const arr2 = v2.split('.')
    const length = Math.max(arr1.length, arr2.length)
    
    for (let i = 0; i < length; i++) {
      const num1 = parseInt(arr1[i] || '0')
      const num2 = parseInt(arr2[i] || '0')
      
      if (num1 > num2) return 1
      if (num1 < num2) return -1
    }
    
    return 0
  },

  // 设置用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    console.log('用户信息已更新')
  },

  // 设置token
  setToken(token) {
    this.globalData.token = token
    console.log('Token已更新')
  },

  // 清除用户数据
  clearUserData() {
    this.globalData.userInfo = null
    this.globalData.token = null
    console.log('用户数据已清除')
  },

  // 获取系统状态（调试用）
  getSystemStatus() {
    return this.globalData.systemStatus
  },
  
  globalData: {
    userInfo: null,
    token: null,
    loginCode: null,
    systemInfo: null,
    networkStatus: null,
    baseUrl: 'http://localhost:3000/api', // 后端API地址，开发环境
    isDev: true, // 开发环境标识
    performanceConfig: null,
    performanceMode: 'normal',
    imageQuality: 'high',
    animationEnabled: true,
    maxCacheSize: 50,
    cacheTime: 30 * 60 * 1000, // 默认缓存30分钟
    pollInterval: 5000, // 默认轮询间隔5秒
    systemStatus: null // 系统状态信息
  }
})