// 部署准备检查工具
class DeploymentCheck {
  constructor() {
    this.checkResults = []
  }

  // 运行完整的部署准备检查
  async runDeploymentCheck() {
    console.log('开始部署准备检查...')
    
    const checks = [
      { name: '环境配置检查', check: this.checkEnvironmentConfig },
      { name: '微信基础库版本检查', check: this.checkWeChatSDKVersion },
      { name: 'API配置检查', check: this.checkApiConfiguration },
      { name: '页面配置检查', check: this.checkPageConfiguration },
      { name: '资源文件检查', check: this.checkResourceFiles },
      { name: '权限配置检查', check: this.checkPermissions },
      { name: '性能配置检查', check: this.checkPerformanceConfig },
      { name: '安全配置检查', check: this.checkSecurityConfig },
      { name: '兼容性检查', check: this.checkCompatibility }
    ]

    this.checkResults = []
    let passed = 0
    let failed = 0
    let warnings = 0

    for (const checkItem of checks) {
      try {
        console.log(`执行检查: ${checkItem.name}`)
        const result = await checkItem.check.call(this)
        
        this.checkResults.push({
          name: checkItem.name,
          status: result.status || 'PASSED',
          result: result,
          timestamp: new Date().toISOString()
        })
        
        if (result.status === 'WARNING') {
          warnings++
        } else {
          passed++
        }
        
        console.log(`✅ ${checkItem.name} - ${result.status || 'PASSED'}`)
      } catch (error) {
        this.checkResults.push({
          name: checkItem.name,
          status: 'FAILED',
          error: error.message,
          timestamp: new Date().toISOString()
        })
        
        failed++
        console.error(`❌ ${checkItem.name} - 失败:`, error.message)
      }
    }

    const summary = {
      total: checks.length,
      passed,
      failed,
      warnings,
      readyForDeployment: failed === 0
    }

    console.log('部署准备检查完成:', summary)
    
    return {
      summary,
      results: this.checkResults,
      timestamp: new Date().toISOString()
    }
  }

  // 环境配置检查
  async checkEnvironmentConfig() {
    const app = getApp()
    const issues = []
    const warnings = []

    // 检查开发环境标识
    if (app.globalData.isDev === true) {
      warnings.push('当前为开发环境，部署前需要切换到生产环境')
    }

    // 检查API地址
    if (app.globalData.baseUrl.includes('localhost') || app.globalData.baseUrl.includes('127.0.0.1')) {
      issues.push('API地址仍指向本地服务器，需要更新为生产环境地址')
    }

    // 检查必要的全局配置
    const requiredConfigs = ['baseUrl', 'cacheTime', 'pollInterval']
    for (const config of requiredConfigs) {
      if (!app.globalData[config]) {
        issues.push(`缺少必要配置: ${config}`)
      }
    }

    if (issues.length > 0) {
      throw new Error(`环境配置问题: ${issues.join(', ')}`)
    }

    return {
      status: warnings.length > 0 ? 'WARNING' : 'PASSED',
      message: '环境配置检查完成',
      warnings: warnings,
      configs: {
        isDev: app.globalData.isDev,
        baseUrl: app.globalData.baseUrl,
        cacheTime: app.globalData.cacheTime,
        pollInterval: app.globalData.pollInterval
      }
    }
  }

  // 微信基础库版本检查
  async checkWeChatSDKVersion() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      const sdkVersion = systemInfo.SDKVersion
      const minVersion = '2.30.0'

      const versionCompare = this.compareVersion(sdkVersion, minVersion)
      
      if (versionCompare < 0) {
        throw new Error(`基础库版本过低: ${sdkVersion}，最低要求: ${minVersion}`)
      }

      return {
        message: '基础库版本检查通过',
        currentVersion: sdkVersion,
        minVersion: minVersion,
        systemInfo: {
          platform: systemInfo.platform,
          version: systemInfo.version,
          model: systemInfo.model
        }
      }
    } catch (error) {
      throw new Error(`基础库版本检查失败: ${error.message}`)
    }
  }

  // API配置检查
  async checkApiConfiguration() {
    const app = getApp()
    const baseUrl = app.globalData.baseUrl
    const issues = []

    // 检查API地址格式
    if (!baseUrl.startsWith('https://')) {
      issues.push('生产环境必须使用HTTPS协议')
    }

    // 检查API地址可达性（简单检查）
    try {
      const result = await this.makeRequest(`${baseUrl}/health`, { timeout: 5000 })
      if (!result || result.status !== 'ok') {
        issues.push('API健康检查失败')
      }
    } catch (error) {
      issues.push(`API连接测试失败: ${error.message}`)
    }

    if (issues.length > 0) {
      throw new Error(`API配置问题: ${issues.join(', ')}`)
    }

    return {
      message: 'API配置检查通过',
      baseUrl: baseUrl,
      protocol: baseUrl.startsWith('https://') ? 'HTTPS' : 'HTTP'
    }
  }

  // 页面配置检查
  async checkPageConfiguration() {
    const issues = []
    const warnings = []

    try {
      // 检查app.json配置
      const appConfig = require('../app.json')
      
      // 检查必要的页面
      const requiredPages = [
        'pages/index/index',
        'pages/login/login',
        'pages/gardens/gardens',
        'pages/monitor/monitor',
        'pages/services/services',
        'pages/orders/orders',
        'pages/profile/profile',
        'pages/promotion/promotion'
      ]

      for (const page of requiredPages) {
        if (!appConfig.pages.includes(page)) {
          issues.push(`缺少必要页面: ${page}`)
        }
      }

      // 检查tabBar配置
      if (!appConfig.tabBar || !appConfig.tabBar.list || appConfig.tabBar.list.length === 0) {
        warnings.push('未配置tabBar，可能影响用户体验')
      }

      // 检查window配置
      if (!appConfig.window) {
        warnings.push('未配置window，建议设置导航栏样式')
      }

      if (issues.length > 0) {
        throw new Error(`页面配置问题: ${issues.join(', ')}`)
      }

      return {
        status: warnings.length > 0 ? 'WARNING' : 'PASSED',
        message: '页面配置检查完成',
        warnings: warnings,
        pageCount: appConfig.pages.length,
        hasTabBar: !!appConfig.tabBar
      }
    } catch (error) {
      throw new Error(`页面配置检查失败: ${error.message}`)
    }
  }

  // 资源文件检查
  async checkResourceFiles() {
    const issues = []
    const warnings = []

    // 检查关键工具文件
    const requiredUtils = [
      'utils/request.js',
      'utils/errorHandler.js',
      'utils/performance.js'
    ]

    for (const util of requiredUtils) {
      try {
        require(`../${util}`)
      } catch (error) {
        issues.push(`缺少关键工具文件: ${util}`)
      }
    }

    // 检查服务文件
    const requiredServices = [
      'services/auth.js',
      'services/garden.js',
      'services/order.js',
      'services/promotion.js'
    ]

    for (const service of requiredServices) {
      try {
        require(`../${service}`)
      } catch (error) {
        issues.push(`缺少服务文件: ${service}`)
      }
    }

    if (issues.length > 0) {
      throw new Error(`资源文件问题: ${issues.join(', ')}`)
    }

    return {
      status: warnings.length > 0 ? 'WARNING' : 'PASSED',
      message: '资源文件检查完成',
      warnings: warnings
    }
  }

  // 权限配置检查
  async checkPermissions() {
    const issues = []
    const warnings = []

    try {
      // 检查app.json中的权限配置
      const appConfig = require('../app.json')
      
      // 检查必要的权限
      const requiredPermissions = [
        'scope.userInfo',
        'scope.camera',
        'scope.writePhotosAlbum'
      ]

      // 这里只是检查配置，实际权限需要在运行时检查
      if (!appConfig.permission) {
        warnings.push('未配置权限说明，可能影响审核通过')
      }

      return {
        status: warnings.length > 0 ? 'WARNING' : 'PASSED',
        message: '权限配置检查完成',
        warnings: warnings
      }
    } catch (error) {
      throw new Error(`权限配置检查失败: ${error.message}`)
    }
  }

  // 性能配置检查
  async checkPerformanceConfig() {
    const app = getApp()
    const issues = []
    const warnings = []

    // 检查性能相关配置
    if (!app.globalData.performanceConfig) {
      warnings.push('未配置性能监控参数')
    }

    // 检查缓存配置
    if (!app.globalData.cacheTime || app.globalData.cacheTime < 60000) {
      warnings.push('缓存时间过短，可能影响性能')
    }

    // 检查轮询间隔
    if (!app.globalData.pollInterval || app.globalData.pollInterval < 3000) {
      warnings.push('轮询间隔过短，可能影响性能和电量')
    }

    return {
      status: warnings.length > 0 ? 'WARNING' : 'PASSED',
      message: '性能配置检查完成',
      warnings: warnings,
      config: {
        cacheTime: app.globalData.cacheTime,
        pollInterval: app.globalData.pollInterval,
        performanceMode: app.globalData.performanceMode
      }
    }
  }

  // 安全配置检查
  async checkSecurityConfig() {
    const app = getApp()
    const issues = []
    const warnings = []

    // 检查HTTPS使用
    if (!app.globalData.baseUrl.startsWith('https://')) {
      issues.push('生产环境必须使用HTTPS')
    }

    // 检查开发模式
    if (app.globalData.isDev === true) {
      warnings.push('开发模式仍然开启，部署前需要关闭')
    }

    // 检查敏感信息
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i
    ]

    // 这里可以添加更多的安全检查逻辑

    if (issues.length > 0) {
      throw new Error(`安全配置问题: ${issues.join(', ')}`)
    }

    return {
      status: warnings.length > 0 ? 'WARNING' : 'PASSED',
      message: '安全配置检查完成',
      warnings: warnings
    }
  }

  // 兼容性检查
  async checkCompatibility() {
    const issues = []
    const warnings = []

    try {
      const systemInfo = wx.getSystemInfoSync()
      
      // 检查基础库版本兼容性
      const sdkVersion = systemInfo.SDKVersion
      if (this.compareVersion(sdkVersion, '2.30.0') < 0) {
        issues.push(`基础库版本过低: ${sdkVersion}`)
      }

      // 检查屏幕适配
      const screenWidth = systemInfo.screenWidth
      if (screenWidth < 320) {
        warnings.push('屏幕宽度过小，可能影响显示效果')
      }

      // 检查系统版本
      const system = systemInfo.system
      if (system.includes('iOS')) {
        const iosVersion = parseFloat(system.match(/iOS (\d+\.\d+)/)?.[1] || '0')
        if (iosVersion < 12.0) {
          warnings.push(`iOS版本较低: ${iosVersion}，可能影响兼容性`)
        }
      } else if (system.includes('Android')) {
        const androidVersion = parseFloat(system.match(/Android (\d+\.\d+)/)?.[1] || '0')
        if (androidVersion < 7.0) {
          warnings.push(`Android版本较低: ${androidVersion}，可能影响兼容性`)
        }
      }

      if (issues.length > 0) {
        throw new Error(`兼容性问题: ${issues.join(', ')}`)
      }

      return {
        status: warnings.length > 0 ? 'WARNING' : 'PASSED',
        message: '兼容性检查完成',
        warnings: warnings,
        systemInfo: {
          platform: systemInfo.platform,
          system: systemInfo.system,
          version: systemInfo.version,
          SDKVersion: systemInfo.SDKVersion,
          screenWidth: systemInfo.screenWidth,
          screenHeight: systemInfo.screenHeight
        }
      }
    } catch (error) {
      throw new Error(`兼容性检查失败: ${error.message}`)
    }
  }

  // 辅助方法：发送请求
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        method: options.method || 'GET',
        data: options.data,
        header: options.header,
        timeout: options.timeout || 10000,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data)
          } else {
            reject(new Error(`HTTP ${res.statusCode}`))
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || 'Request failed'))
        }
      })
    })
  }

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
  }

  // 生成部署清单
  generateDeploymentChecklist() {
    const checklist = [
      {
        category: '环境配置',
        items: [
          { task: '将isDev设置为false', checked: false },
          { task: '更新baseUrl为生产环境地址', checked: false },
          { task: '配置HTTPS证书', checked: false },
          { task: '设置正确的微信AppID', checked: false }
        ]
      },
      {
        category: '代码优化',
        items: [
          { task: '移除调试代码和console.log', checked: false },
          { task: '压缩图片资源', checked: false },
          { task: '优化代码结构', checked: false },
          { task: '检查内存泄漏', checked: false }
        ]
      },
      {
        category: '功能测试',
        items: [
          { task: '完成所有功能测试', checked: false },
          { task: '验证错误处理机制', checked: false },
          { task: '测试网络异常情况', checked: false },
          { task: '验证性能指标', checked: false }
        ]
      },
      {
        category: '安全检查',
        items: [
          { task: '检查敏感信息泄露', checked: false },
          { task: '验证输入验证机制', checked: false },
          { task: '确认权限配置正确', checked: false },
          { task: '测试安全漏洞', checked: false }
        ]
      },
      {
        category: '微信平台配置',
        items: [
          { task: '配置服务器域名白名单', checked: false },
          { task: '设置业务域名', checked: false },
          { task: '配置支付参数（如需要）', checked: false },
          { task: '设置客服消息', checked: false }
        ]
      }
    ]

    return checklist
  }

  // 获取检查报告
  getCheckReport() {
    return {
      results: this.checkResults,
      summary: this.generateSummary(),
      checklist: this.generateDeploymentChecklist(),
      timestamp: new Date().toISOString()
    }
  }

  // 生成检查摘要
  generateSummary() {
    const total = this.checkResults.length
    const passed = this.checkResults.filter(r => r.status === 'PASSED').length
    const warnings = this.checkResults.filter(r => r.status === 'WARNING').length
    const failed = this.checkResults.filter(r => r.status === 'FAILED').length

    return {
      total,
      passed,
      warnings,
      failed,
      readyForDeployment: failed === 0,
      score: total > 0 ? Math.round((passed / total) * 100) : 0
    }
  }

  // 清理检查数据
  cleanup() {
    this.checkResults = []
    console.log('检查数据已清理')
  }
}

// 创建全局实例
const deploymentCheck = new DeploymentCheck()

module.exports = deploymentCheck