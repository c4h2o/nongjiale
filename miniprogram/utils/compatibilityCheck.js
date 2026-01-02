// 兼容性检查工具
class CompatibilityCheck {
  constructor() {
    this.checkResults = []
    this.compatibilityIssues = []
  }

  // 执行完整的兼容性检查
  async runCompatibilityCheck() {
    console.log('开始执行兼容性检查...')
    
    const checks = [
      { name: '微信基础库版本检查', check: this.checkWechatSDKVersion.bind(this) },
      { name: '设备屏幕尺寸适配检查', check: this.checkScreenSizeCompatibility.bind(this) },
      { name: 'iOS系统兼容性检查', check: this.checkIOSCompatibility.bind(this) },
      { name: 'Android系统兼容性检查', check: this.checkAndroidCompatibility.bind(this) },
      { name: '网络环境适配检查', check: this.checkNetworkCompatibility.bind(this) },
      { name: 'API兼容性检查', check: this.checkApiCompatibility.bind(this) },
      { name: '存储兼容性检查', check: this.checkStorageCompatibility.bind(this) },
      { name: '性能兼容性检查', check: this.checkPerformanceCompatibility.bind(this) }
    ]

    const results = []
    let allCompatible = true

    for (const checkItem of checks) {
      try {
        console.log(`执行检查: ${checkItem.name}`)
        const result = await checkItem.check()
        
        results.push({
          name: checkItem.name,
          status: result.compatible ? 'compatible' : 'incompatible',
          details: result,
          timestamp: new Date().toISOString()
        })
        
        if (!result.compatible) {
          allCompatible = false
          this.compatibilityIssues.push(...(result.issues || []))
        }
        
        console.log(`${result.compatible ? '✓' : '⚠'} ${checkItem.name} - ${result.compatible ? '兼容' : '不兼容'}`)
      } catch (error) {
        results.push({
          name: checkItem.name,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        })
        allCompatible = false
        console.error(`✗ ${checkItem.name} - 检查失败:`, error.message)
      }
    }

    this.checkResults = results
    return this.generateCompatibilityReport(allCompatible)
  }

  // 检查微信基础库版本
  async checkWechatSDKVersion() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      const sdkVersion = systemInfo.SDKVersion
      const minRequiredVersion = '2.30.0'
      
      const compatible = this.compareVersion(sdkVersion, minRequiredVersion) >= 0
      const issues = []
      
      if (!compatible) {
        issues.push({
          type: 'version',
          message: `微信基础库版本过低: ${sdkVersion}，要求 >= ${minRequiredVersion}`,
          solution: '建议用户升级微信到最新版本'
        })
      }

      // 检查特定API支持
      const apiSupport = {
        'wx.createIntersectionObserver': typeof wx.createIntersectionObserver === 'function',
        'wx.getPerformance': typeof wx.getPerformance === 'function',
        'wx.onMemoryWarning': typeof wx.onMemoryWarning === 'function',
        'wx.createLivePlayerContext': typeof wx.createLivePlayerContext === 'function'
      }

      const unsupportedApis = Object.entries(apiSupport)
        .filter(([api, supported]) => !supported)
        .map(([api]) => api)

      if (unsupportedApis.length > 0) {
        issues.push({
          type: 'api',
          message: `不支持的API: ${unsupportedApis.join(', ')}`,
          solution: '部分功能可能无法正常使用，建议提供降级方案'
        })
      }

      return {
        compatible: compatible && unsupportedApis.length === 0,
        sdkVersion,
        minRequiredVersion,
        apiSupport,
        issues
      }
    } catch (error) {
      throw new Error(`微信基础库版本检查失败: ${error.message}`)
    }
  }

  // 检查屏幕尺寸适配
  async checkScreenSizeCompatibility() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      const { screenWidth, screenHeight, pixelRatio } = systemInfo
      
      // 主流手机尺寸检查
      const supportedSizes = [
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPhone 12/13', width: 390, height: 844 },
        { name: 'iPhone 12/13 Pro Max', width: 428, height: 926 },
        { name: 'Android 标准', width: 360, height: 640 },
        { name: 'Android 大屏', width: 414, height: 896 }
      ]

      const issues = []
      let compatible = true

      // 检查最小尺寸支持
      if (screenWidth < 320 || screenHeight < 480) {
        compatible = false
        issues.push({
          type: 'size',
          message: `屏幕尺寸过小: ${screenWidth}x${screenHeight}`,
          solution: '建议优化小屏幕设备的界面布局'
        })
      }

      // 检查像素密度
      if (pixelRatio < 1) {
        issues.push({
          type: 'density',
          message: `像素密度过低: ${pixelRatio}`,
          solution: '可能影响图片显示质量'
        })
      }

      // 检查是否为异形屏
      const aspectRatio = screenHeight / screenWidth
      const isNotchScreen = aspectRatio > 2.0

      return {
        compatible,
        screenInfo: { screenWidth, screenHeight, pixelRatio, aspectRatio },
        isNotchScreen,
        supportedSizes,
        issues
      }
    } catch (error) {
      throw new Error(`屏幕尺寸适配检查失败: ${error.message}`)
    }
  }

  // 检查iOS兼容性
  async checkIOSCompatibility() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      const { platform, system } = systemInfo
      
      if (platform !== 'ios') {
        return {
          compatible: true,
          platform,
          message: '非iOS设备，跳过iOS兼容性检查'
        }
      }

      const issues = []
      let compatible = true

      // 提取iOS版本
      const iosVersionMatch = system.match(/iOS (\d+\.\d+)/)
      const iosVersion = iosVersionMatch ? iosVersionMatch[1] : '0.0'
      const minIOSVersion = '12.0'

      if (this.compareVersion(iosVersion, minIOSVersion) < 0) {
        compatible = false
        issues.push({
          type: 'version',
          message: `iOS版本过低: ${iosVersion}，建议 >= ${minIOSVersion}`,
          solution: '建议用户升级iOS系统'
        })
      }

      // 检查iOS特定功能
      const iosFeatures = {
        'Safari兼容性': true, // 微信内置浏览器基于Safari
        '触摸事件': 'ontouchstart' in window,
        '设备方向': typeof window.orientation !== 'undefined'
      }

      return {
        compatible,
        platform,
        iosVersion,
        minIOSVersion,
        features: iosFeatures,
        issues
      }
    } catch (error) {
      throw new Error(`iOS兼容性检查失败: ${error.message}`)
    }
  }

  // 检查Android兼容性
  async checkAndroidCompatibility() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      const { platform, system } = systemInfo
      
      if (platform !== 'android') {
        return {
          compatible: true,
          platform,
          message: '非Android设备，跳过Android兼容性检查'
        }
      }

      const issues = []
      let compatible = true

      // 提取Android版本
      const androidVersionMatch = system.match(/Android (\d+\.\d+)/)
      const androidVersion = androidVersionMatch ? androidVersionMatch[1] : '0.0'
      const minAndroidVersion = '7.0'

      if (this.compareVersion(androidVersion, minAndroidVersion) < 0) {
        compatible = false
        issues.push({
          type: 'version',
          message: `Android版本过低: ${androidVersion}，建议 >= ${minAndroidVersion}`,
          solution: '建议用户升级Android系统或使用新设备'
        })
      }

      // 检查Android特定功能
      const androidFeatures = {
        'WebView兼容性': true, // 微信内置WebView
        '触摸事件': 'ontouchstart' in window,
        '网络状态': typeof navigator.onLine !== 'undefined'
      }

      return {
        compatible,
        platform,
        androidVersion,
        minAndroidVersion,
        features: androidFeatures,
        issues
      }
    } catch (error) {
      throw new Error(`Android兼容性检查失败: ${error.message}`)
    }
  }

  // 检查网络环境兼容性
  async checkNetworkCompatibility() {
    try {
      const issues = []
      let compatible = true

      // 检查网络状态API
      const networkApis = {
        'wx.getNetworkType': typeof wx.getNetworkType === 'function',
        'wx.onNetworkStatusChange': typeof wx.onNetworkStatusChange === 'function'
      }

      const unsupportedNetworkApis = Object.entries(networkApis)
        .filter(([api, supported]) => !supported)
        .map(([api]) => api)

      if (unsupportedNetworkApis.length > 0) {
        compatible = false
        issues.push({
          type: 'api',
          message: `网络API不支持: ${unsupportedNetworkApis.join(', ')}`,
          solution: '网络状态监控功能可能无法正常工作'
        })
      }

      // 测试网络连接
      let networkStatus = null
      try {
        networkStatus = await wx.getNetworkType()
      } catch (error) {
        issues.push({
          type: 'network',
          message: '无法获取网络状态',
          solution: '检查网络权限设置'
        })
      }

      // 检查支持的网络类型
      const supportedNetworkTypes = ['wifi', '4g', '5g', '3g', '2g']
      const currentNetworkType = networkStatus?.networkType

      if (currentNetworkType && !supportedNetworkTypes.includes(currentNetworkType)) {
        issues.push({
          type: 'network',
          message: `未知的网络类型: ${currentNetworkType}`,
          solution: '可能影响网络优化策略'
        })
      }

      return {
        compatible,
        networkApis,
        networkStatus,
        supportedNetworkTypes,
        issues
      }
    } catch (error) {
      throw new Error(`网络环境兼容性检查失败: ${error.message}`)
    }
  }

  // 检查API兼容性
  async checkApiCompatibility() {
    try {
      const issues = []
      let compatible = true

      // 检查核心API
      const coreApis = {
        // 基础API
        'wx.request': typeof wx.request === 'function',
        'wx.uploadFile': typeof wx.uploadFile === 'function',
        'wx.downloadFile': typeof wx.downloadFile === 'function',
        
        // 界面API
        'wx.showToast': typeof wx.showToast === 'function',
        'wx.showModal': typeof wx.showModal === 'function',
        'wx.showLoading': typeof wx.showLoading === 'function',
        
        // 导航API
        'wx.navigateTo': typeof wx.navigateTo === 'function',
        'wx.redirectTo': typeof wx.redirectTo === 'function',
        'wx.reLaunch': typeof wx.reLaunch === 'function',
        
        // 存储API
        'wx.setStorageSync': typeof wx.setStorageSync === 'function',
        'wx.getStorageSync': typeof wx.getStorageSync === 'function',
        'wx.removeStorageSync': typeof wx.removeStorageSync === 'function',
        
        // 系统API
        'wx.getSystemInfoSync': typeof wx.getSystemInfoSync === 'function',
        'wx.login': typeof wx.login === 'function',
        'wx.getUserProfile': typeof wx.getUserProfile === 'function'
      }

      const unsupportedCoreApis = Object.entries(coreApis)
        .filter(([api, supported]) => !supported)
        .map(([api]) => api)

      if (unsupportedCoreApis.length > 0) {
        compatible = false
        issues.push({
          type: 'core_api',
          message: `核心API不支持: ${unsupportedCoreApis.join(', ')}`,
          solution: '核心功能可能无法正常工作，需要检查微信版本'
        })
      }

      // 检查高级API
      const advancedApis = {
        'wx.createLivePlayerContext': typeof wx.createLivePlayerContext === 'function',
        'wx.createIntersectionObserver': typeof wx.createIntersectionObserver === 'function',
        'wx.getPerformance': typeof wx.getPerformance === 'function',
        'wx.onMemoryWarning': typeof wx.onMemoryWarning === 'function',
        'wx.preloadPage': typeof wx.preloadPage === 'function'
      }

      const unsupportedAdvancedApis = Object.entries(advancedApis)
        .filter(([api, supported]) => !supported)
        .map(([api]) => api)

      if (unsupportedAdvancedApis.length > 0) {
        issues.push({
          type: 'advanced_api',
          message: `高级API不支持: ${unsupportedAdvancedApis.join(', ')}`,
          solution: '部分高级功能可能无法使用，但不影响核心功能'
        })
      }

      return {
        compatible,
        coreApis,
        advancedApis,
        issues
      }
    } catch (error) {
      throw new Error(`API兼容性检查失败: ${error.message}`)
    }
  }

  // 检查存储兼容性
  async checkStorageCompatibility() {
    try {
      const issues = []
      let compatible = true

      // 测试存储功能
      const testKey = 'compatibility_test_' + Date.now()
      const testData = { test: true, timestamp: Date.now() }

      try {
        // 测试同步存储
        wx.setStorageSync(testKey, testData)
        const retrievedData = wx.getStorageSync(testKey)
        
        if (JSON.stringify(testData) !== JSON.stringify(retrievedData)) {
          compatible = false
          issues.push({
            type: 'storage',
            message: '同步存储数据不一致',
            solution: '可能影响数据持久化功能'
          })
        }
        
        // 清理测试数据
        wx.removeStorageSync(testKey)
      } catch (error) {
        compatible = false
        issues.push({
          type: 'storage',
          message: `存储功能异常: ${error.message}`,
          solution: '检查存储权限和空间'
        })
      }

      // 检查存储容量
      try {
        const storageInfo = wx.getStorageInfoSync()
        const { keys, currentSize, limitSize } = storageInfo
        
        const usageRate = currentSize / limitSize
        
        if (usageRate > 0.8) {
          issues.push({
            type: 'storage_space',
            message: `存储空间使用率过高: ${(usageRate * 100).toFixed(1)}%`,
            solution: '建议清理存储空间或优化数据存储策略'
          })
        }

        return {
          compatible,
          storageInfo: { keys: keys.length, currentSize, limitSize, usageRate },
          issues
        }
      } catch (error) {
        issues.push({
          type: 'storage_info',
          message: '无法获取存储信息',
          solution: '存储监控功能可能受影响'
        })
      }

      return { compatible, issues }
    } catch (error) {
      throw new Error(`存储兼容性检查失败: ${error.message}`)
    }
  }

  // 检查性能兼容性
  async checkPerformanceCompatibility() {
    try {
      const issues = []
      let compatible = true

      // 检查性能API
      const performanceApis = {
        'wx.getPerformance': typeof wx.getPerformance === 'function',
        'performance.now': typeof performance !== 'undefined' && typeof performance.now === 'function',
        'Date.now': typeof Date.now === 'function'
      }

      const unsupportedPerformanceApis = Object.entries(performanceApis)
        .filter(([api, supported]) => !supported)
        .map(([api]) => api)

      if (unsupportedPerformanceApis.length > 0) {
        issues.push({
          type: 'performance_api',
          message: `性能API不支持: ${unsupportedPerformanceApis.join(', ')}`,
          solution: '性能监控功能可能受限'
        })
      }

      // 测试基础性能
      const performanceTest = await this.runBasicPerformanceTest()
      
      if (performanceTest.averageTime > 100) {
        issues.push({
          type: 'performance',
          message: `基础操作性能较低: 平均${performanceTest.averageTime}ms`,
          solution: '可能需要启用低端设备优化模式'
        })
      }

      // 检查内存API
      let memoryInfo = null
      try {
        const performance = wx.getPerformance()
        if (performance && performance.memory) {
          memoryInfo = performance.memory
          
          const usageRate = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit
          if (usageRate > 0.8) {
            issues.push({
              type: 'memory',
              message: `内存使用率过高: ${(usageRate * 100).toFixed(1)}%`,
              solution: '建议启用内存优化策略'
            })
          }
        }
      } catch (error) {
        issues.push({
          type: 'memory_api',
          message: '无法获取内存信息',
          solution: '内存监控功能不可用'
        })
      }

      return {
        compatible,
        performanceApis,
        performanceTest,
        memoryInfo,
        issues
      }
    } catch (error) {
      throw new Error(`性能兼容性检查失败: ${error.message}`)
    }
  }

  // 运行基础性能测试
  async runBasicPerformanceTest() {
    const iterations = 100
    const times = []

    for (let i = 0; i < iterations; i++) {
      const start = Date.now()
      
      // 执行基础操作
      const data = { index: i, timestamp: Date.now() }
      const serialized = JSON.stringify(data)
      const parsed = JSON.parse(serialized)
      
      const end = Date.now()
      times.push(end - start)
    }

    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length
    const maxTime = Math.max(...times)
    const minTime = Math.min(...times)

    return {
      iterations,
      averageTime: Math.round(averageTime * 100) / 100,
      maxTime,
      minTime
    }
  }

  // 版本比较工具
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

  // 生成兼容性报告
  generateCompatibilityReport(allCompatible) {
    const compatibleChecks = this.checkResults.filter(c => c.status === 'compatible').length
    const incompatibleChecks = this.checkResults.filter(c => c.status === 'incompatible').length
    const errorChecks = this.checkResults.filter(c => c.status === 'error').length
    const totalChecks = this.checkResults.length

    const report = {
      summary: {
        allCompatible,
        total: totalChecks,
        compatible: compatibleChecks,
        incompatible: incompatibleChecks,
        errors: errorChecks,
        compatibilityRate: totalChecks > 0 ? ((compatibleChecks / totalChecks) * 100).toFixed(1) : 0,
        timestamp: new Date().toISOString()
      },
      details: this.checkResults,
      issues: this.compatibilityIssues,
      recommendations: this.generateCompatibilityRecommendations()
    }

    console.log('兼容性检查报告:', report)
    return report
  }

  // 生成兼容性建议
  generateCompatibilityRecommendations() {
    const recommendations = []
    
    const criticalIssues = this.compatibilityIssues.filter(issue => 
      issue.type === 'version' || issue.type === 'core_api'
    )
    
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'high',
        type: 'critical',
        message: '发现关键兼容性问题，可能影响核心功能',
        actions: criticalIssues.map(issue => issue.solution)
      })
    }

    const performanceIssues = this.compatibilityIssues.filter(issue => 
      issue.type === 'performance' || issue.type === 'memory'
    )
    
    if (performanceIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        type: 'performance',
        message: '发现性能相关问题，建议优化',
        actions: performanceIssues.map(issue => issue.solution)
      })
    }

    const minorIssues = this.compatibilityIssues.filter(issue => 
      issue.type === 'advanced_api' || issue.type === 'storage_space'
    )
    
    if (minorIssues.length > 0) {
      recommendations.push({
        priority: 'low',
        type: 'enhancement',
        message: '发现次要兼容性问题，不影响核心功能',
        actions: minorIssues.map(issue => issue.solution)
      })
    }

    if (this.compatibilityIssues.length === 0) {
      recommendations.push({
        priority: 'info',
        type: 'success',
        message: '所有兼容性检查通过，系统兼容性良好',
        actions: ['可以正常部署和使用']
      })
    }

    return recommendations
  }

  // 清理检查数据
  clearCheckData() {
    this.checkResults = []
    this.compatibilityIssues = []
    console.log('兼容性检查数据已清理')
  }
}

module.exports = new CompatibilityCheck()