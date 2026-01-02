// 性能优化工具
class PerformanceMonitor {
  constructor() {
    this.pageLoadTimes = new Map()
    this.apiResponseTimes = new Map()
    this.memoryUsage = []
    this.init()
  }

  // 初始化性能监控
  init() {
    // 监听页面性能
    this.monitorPagePerformance()
    
    // 监听内存使用
    this.monitorMemoryUsage()
    
    console.log('性能监控已启动')
  }

  // 监控页面性能
  monitorPagePerformance() {
    const originalPage = Page
    const self = this
    
    Page = function(options) {
      const originalOnLoad = options.onLoad || function() {}
      const originalOnShow = options.onShow || function() {}
      const originalOnReady = options.onReady || function() {}
      
      // 重写onLoad
      options.onLoad = function(...args) {
        const startTime = Date.now()
        this._pageLoadStartTime = startTime
        
        console.log(`[性能] 页面开始加载: ${this.route || 'unknown'}`)
        
        return originalOnLoad.apply(this, args)
      }
      
      // 重写onShow
      options.onShow = function(...args) {
        if (this._pageLoadStartTime) {
          const loadTime = Date.now() - this._pageLoadStartTime
          const route = this.route || 'unknown'
          
          self.recordPageLoadTime(route, loadTime)
          
          // 检查加载时间是否超标
          if (loadTime > 3000) {
            console.warn(`[性能警告] 页面加载时间过长: ${route} (${loadTime}ms)`)
          }
        }
        
        return originalOnShow.apply(this, args)
      }
      
      // 重写onReady
      options.onReady = function(...args) {
        if (this._pageLoadStartTime) {
          const readyTime = Date.now() - this._pageLoadStartTime
          const route = this.route || 'unknown'
          
          console.log(`[性能] 页面渲染完成: ${route} (${readyTime}ms)`)
          
          // 首屏加载时间检查
          if (route === 'pages/index/index' && readyTime > 3000) {
            console.warn(`[性能警告] 首屏加载时间超标: ${readyTime}ms`)
          }
        }
        
        return originalOnReady.apply(this, args)
      }
      
      return originalPage(options)
    }
  }

  // 监控内存使用
  monitorMemoryUsage() {
    setInterval(() => {
      try {
        const performance = wx.getPerformance()
        if (performance && performance.memory) {
          const memoryInfo = {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
            timestamp: Date.now()
          }
          
          this.memoryUsage.push(memoryInfo)
          
          // 只保留最近10条记录
          if (this.memoryUsage.length > 10) {
            this.memoryUsage.shift()
          }
          
          // 检查内存使用率
          const usageRate = memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit
          if (usageRate > 0.8) {
            console.warn('[性能警告] 内存使用率过高:', (usageRate * 100).toFixed(1) + '%')
          }
        }
      } catch (error) {
        console.error('获取内存信息失败:', error)
      }
    }, 30000) // 每30秒检查一次
  }

  // 记录页面加载时间
  recordPageLoadTime(route, loadTime) {
    if (!this.pageLoadTimes.has(route)) {
      this.pageLoadTimes.set(route, [])
    }
    
    const times = this.pageLoadTimes.get(route)
    times.push({
      loadTime,
      timestamp: Date.now()
    })
    
    // 只保留最近5次记录
    if (times.length > 5) {
      times.shift()
    }
    
    console.log(`[性能] 页面加载完成: ${route} (${loadTime}ms)`)
  }

  // 记录API响应时间
  recordApiResponseTime(url, responseTime) {
    if (!this.apiResponseTimes.has(url)) {
      this.apiResponseTimes.set(url, [])
    }
    
    const times = this.apiResponseTimes.get(url)
    times.push({
      responseTime,
      timestamp: Date.now()
    })
    
    // 只保留最近10次记录
    if (times.length > 10) {
      times.shift()
    }
    
    // 检查响应时间是否超标
    if (responseTime > 5000) {
      console.warn(`[性能警告] API响应时间过长: ${url} (${responseTime}ms)`)
    }
  }

  // 获取页面性能报告
  getPagePerformanceReport() {
    const report = {}
    
    for (const [route, times] of this.pageLoadTimes.entries()) {
      const avgTime = times.reduce((sum, item) => sum + item.loadTime, 0) / times.length
      const maxTime = Math.max(...times.map(item => item.loadTime))
      const minTime = Math.min(...times.map(item => item.loadTime))
      
      report[route] = {
        averageLoadTime: Math.round(avgTime),
        maxLoadTime: maxTime,
        minLoadTime: minTime,
        sampleCount: times.length
      }
    }
    
    return report
  }

  // 获取API性能报告
  getApiPerformanceReport() {
    const report = {}
    
    for (const [url, times] of this.apiResponseTimes.entries()) {
      const avgTime = times.reduce((sum, item) => sum + item.responseTime, 0) / times.length
      const maxTime = Math.max(...times.map(item => item.responseTime))
      const minTime = Math.min(...times.map(item => item.responseTime))
      
      report[url] = {
        averageResponseTime: Math.round(avgTime),
        maxResponseTime: maxTime,
        minResponseTime: minTime,
        sampleCount: times.length
      }
    }
    
    return report
  }

  // 获取内存使用报告
  getMemoryUsageReport() {
    if (this.memoryUsage.length === 0) {
      return null
    }
    
    const latest = this.memoryUsage[this.memoryUsage.length - 1]
    const usageRate = (latest.usedJSHeapSize / latest.jsHeapSizeLimit * 100).toFixed(1)
    
    return {
      currentUsage: latest.usedJSHeapSize,
      totalHeap: latest.totalJSHeapSize,
      heapLimit: latest.jsHeapSizeLimit,
      usageRate: usageRate + '%',
      timestamp: latest.timestamp
    }
  }

  // 优化建议
  getOptimizationSuggestions() {
    const suggestions = []
    
    // 检查页面加载时间
    const pageReport = this.getPagePerformanceReport()
    for (const [route, data] of Object.entries(pageReport)) {
      if (data.averageLoadTime > 3000) {
        suggestions.push({
          type: 'PAGE_LOAD',
          route,
          issue: `页面平均加载时间过长 (${data.averageLoadTime}ms)`,
          suggestion: '建议优化页面结构，减少初始化数据请求，使用懒加载'
        })
      }
    }
    
    // 检查API响应时间
    const apiReport = this.getApiPerformanceReport()
    for (const [url, data] of Object.entries(apiReport)) {
      if (data.averageResponseTime > 2000) {
        suggestions.push({
          type: 'API_RESPONSE',
          url,
          issue: `API平均响应时间过长 (${data.averageResponseTime}ms)`,
          suggestion: '建议优化后端接口性能，添加缓存，减少数据传输量'
        })
      }
    }
    
    // 检查内存使用
    const memoryReport = this.getMemoryUsageReport()
    if (memoryReport && parseFloat(memoryReport.usageRate) > 80) {
      suggestions.push({
        type: 'MEMORY_USAGE',
        issue: `内存使用率过高 (${memoryReport.usageRate})`,
        suggestion: '建议清理无用数据，优化数据结构，及时释放资源'
      })
    }
    
    return suggestions
  }

  // 图片懒加载优化
  lazyLoadImage(selector, options = {}) {
    const defaultOptions = {
      threshold: 0.1,
      rootMargin: '50px'
    }
    
    const config = { ...defaultOptions, ...options }
    
    // 创建交叉观察器
    const observer = wx.createIntersectionObserver(null, {
      thresholds: [config.threshold],
      initialRatio: 0,
      observeAll: true
    })
    
    observer.relativeTo('.container', {
      top: config.rootMargin,
      bottom: config.rootMargin
    })
    
    observer.observe(selector, (res) => {
      if (res.intersectionRatio > 0) {
        // 图片进入视口，开始加载
        const dataset = res.dataset
        if (dataset && dataset.src) {
          // 这里可以触发图片加载
          console.log('懒加载图片:', dataset.src)
        }
      }
    })
    
    return observer
  }

  // 防抖函数
  debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // 节流函数
  throttle(func, limit) {
    let inThrottle
    return function() {
      const args = arguments
      const context = this
      if (!inThrottle) {
        func.apply(context, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }

  // 预加载资源
  preloadResources(resources) {
    resources.forEach(resource => {
      if (resource.type === 'image') {
        wx.getImageInfo({
          src: resource.url,
          success: () => {
            console.log('图片预加载成功:', resource.url)
          },
          fail: (err) => {
            console.error('图片预加载失败:', resource.url, err)
          }
        })
      } else if (resource.type === 'page') {
        // 预加载页面
        this.preloadPage(resource.url)
      }
    })
  }

  // 预加载页面
  preloadPage(url) {
    try {
      // 使用wx.preloadPage预加载页面
      if (wx.preloadPage) {
        wx.preloadPage({
          url: url,
          success: () => {
            console.log('页面预加载成功:', url)
          },
          fail: (err) => {
            console.error('页面预加载失败:', url, err)
          }
        })
      }
    } catch (error) {
      console.error('预加载页面异常:', error)
    }
  }

  // 缓存策略管理
  cacheManager = {
    // 设置缓存
    set(key, data, expireTime = 30 * 60 * 1000) { // 默认30分钟过期
      const cacheData = {
        data,
        timestamp: Date.now(),
        expireTime
      }
      
      try {
        wx.setStorageSync(`cache_${key}`, cacheData)
        console.log('缓存设置成功:', key)
      } catch (error) {
        console.error('设置缓存失败:', key, error)
      }
    },

    // 获取缓存
    get(key) {
      try {
        const cacheData = wx.getStorageSync(`cache_${key}`)
        if (!cacheData) {
          return null
        }

        const now = Date.now()
        if (now - cacheData.timestamp > cacheData.expireTime) {
          // 缓存过期，删除
          this.remove(key)
          return null
        }

        console.log('缓存命中:', key)
        return cacheData.data
      } catch (error) {
        console.error('获取缓存失败:', key, error)
        return null
      }
    },

    // 删除缓存
    remove(key) {
      try {
        wx.removeStorageSync(`cache_${key}`)
        console.log('缓存删除成功:', key)
      } catch (error) {
        console.error('删除缓存失败:', key, error)
      }
    },

    // 清理过期缓存
    clearExpired() {
      try {
        const storage = wx.getStorageInfoSync()
        const cacheKeys = storage.keys.filter(key => key.startsWith('cache_'))
        
        let clearedCount = 0
        cacheKeys.forEach(key => {
          const cacheData = wx.getStorageSync(key)
          if (cacheData && cacheData.timestamp) {
            const now = Date.now()
            if (now - cacheData.timestamp > cacheData.expireTime) {
              wx.removeStorageSync(key)
              clearedCount++
            }
          }
        })
        
        console.log(`清理过期缓存完成，清理了 ${clearedCount} 个缓存`)
      } catch (error) {
        console.error('清理过期缓存失败:', error)
      }
    }
  }

  // 页面性能优化建议
  optimizePage(pageInstance) {
    if (!pageInstance) return

    // 添加页面级别的性能监控
    const originalSetData = pageInstance.setData
    pageInstance.setData = function(data, callback) {
      const startTime = Date.now()
      
      originalSetData.call(this, data, () => {
        const setDataTime = Date.now() - startTime
        if (setDataTime > 100) {
          console.warn(`[性能警告] setData耗时过长: ${setDataTime}ms`, Object.keys(data))
        }
        
        if (callback) callback()
      })
    }

    // 添加防抖的下拉刷新
    if (pageInstance.onPullDownRefresh) {
      const originalPullDownRefresh = pageInstance.onPullDownRefresh
      pageInstance.onPullDownRefresh = this.debounce(originalPullDownRefresh.bind(pageInstance), 1000)
    }

    // 添加节流的滚动事件
    if (pageInstance.onPageScroll) {
      const originalPageScroll = pageInstance.onPageScroll
      pageInstance.onPageScroll = this.throttle(originalPageScroll.bind(pageInstance), 100)
    }
  }

  // 清理性能数据
  clearPerformanceData() {
    this.pageLoadTimes.clear()
    this.apiResponseTimes.clear()
    this.memoryUsage = []
    console.log('性能数据已清理')
  }

  // 生成性能报告
  generatePerformanceReport() {
    return {
      pagePerformance: this.getPagePerformanceReport(),
      apiPerformance: this.getApiPerformanceReport(),
      memoryUsage: this.getMemoryUsageReport(),
      optimizationSuggestions: this.getOptimizationSuggestions(),
      timestamp: new Date().toISOString()
    }
  }
}

// 创建全局实例
const performanceMonitor = new PerformanceMonitor()

module.exports = performanceMonitor