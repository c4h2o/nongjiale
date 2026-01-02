// 页面性能优化工具
const performanceMonitor = require('./performance')
const errorHandler = require('./errorHandler')

class PageOptimizer {
  constructor() {
    this.optimizedPages = new Set()
  }

  // 优化页面性能
  optimizePage(pageInstance, options = {}) {
    if (!pageInstance || this.optimizedPages.has(pageInstance)) {
      return
    }

    const defaultOptions = {
      enableSetDataOptimization: true,
      enableScrollOptimization: true,
      enablePullRefreshOptimization: true,
      enablePreloadOptimization: true,
      enableCacheOptimization: true
    }

    const config = { ...defaultOptions, ...options }

    console.log('开始优化页面性能:', pageInstance.route || 'unknown')

    // setData性能优化
    if (config.enableSetDataOptimization) {
      this.optimizeSetData(pageInstance)
    }

    // 滚动事件优化
    if (config.enableScrollOptimization) {
      this.optimizeScrollEvents(pageInstance)
    }

    // 下拉刷新优化
    if (config.enablePullRefreshOptimization) {
      this.optimizePullRefresh(pageInstance)
    }

    // 预加载优化
    if (config.enablePreloadOptimization) {
      this.enablePreloadOptimization(pageInstance)
    }

    // 缓存优化
    if (config.enableCacheOptimization) {
      this.enableCacheOptimization(pageInstance)
    }

    // 添加性能监控
    performanceMonitor.optimizePage(pageInstance)

    this.optimizedPages.add(pageInstance)
  }

  // 优化setData性能
  optimizeSetData(pageInstance) {
    const originalSetData = pageInstance.setData
    let setDataQueue = []
    let setDataTimer = null

    pageInstance.setData = function(data, callback) {
      const startTime = Date.now()

      // 检查数据大小
      const dataSize = JSON.stringify(data).length
      if (dataSize > 1024 * 100) { // 100KB
        console.warn('[性能警告] setData数据过大:', dataSize, 'bytes')
      }

      // 批量setData优化
      if (setDataTimer) {
        clearTimeout(setDataTimer)
      }

      setDataQueue.push({ data, callback })

      setDataTimer = setTimeout(() => {
        // 合并数据
        const mergedData = {}
        const callbacks = []

        setDataQueue.forEach(item => {
          Object.assign(mergedData, item.data)
          if (item.callback) {
            callbacks.push(item.callback)
          }
        })

        // 执行合并后的setData
        originalSetData.call(this, mergedData, () => {
          const setDataTime = Date.now() - startTime
          if (setDataTime > 100) {
            console.warn(`[性能警告] setData耗时过长: ${setDataTime}ms`, Object.keys(mergedData))
          }

          // 执行所有回调
          callbacks.forEach(cb => cb())
        })

        // 清空队列
        setDataQueue = []
        setDataTimer = null
      }, 16) // 一帧的时间
    }
  }

  // 优化滚动事件
  optimizeScrollEvents(pageInstance) {
    if (pageInstance.onPageScroll) {
      const originalPageScroll = pageInstance.onPageScroll
      pageInstance.onPageScroll = performanceMonitor.throttle(
        originalPageScroll.bind(pageInstance), 
        100
      )
    }

    // 优化触底事件
    if (pageInstance.onReachBottom) {
      const originalReachBottom = pageInstance.onReachBottom
      let isLoading = false

      pageInstance.onReachBottom = function() {
        if (isLoading) {
          console.log('[优化] 防止重复触发触底事件')
          return
        }

        isLoading = true
        
        try {
          const result = originalReachBottom.call(this)
          
          // 如果返回Promise，等待完成
          if (result && typeof result.then === 'function') {
            result.finally(() => {
              isLoading = false
            })
          } else {
            setTimeout(() => {
              isLoading = false
            }, 1000)
          }
        } catch (error) {
          isLoading = false
          throw error
        }
      }
    }
  }

  // 优化下拉刷新
  optimizePullRefresh(pageInstance) {
    if (pageInstance.onPullDownRefresh) {
      const originalPullDownRefresh = pageInstance.onPullDownRefresh
      pageInstance.onPullDownRefresh = performanceMonitor.debounce(
        originalPullDownRefresh.bind(pageInstance), 
        1000
      )
    }
  }

  // 启用预加载优化
  enablePreloadOptimization(pageInstance) {
    const originalOnLoad = pageInstance.onLoad || function() {}
    
    pageInstance.onLoad = function(options) {
      // 预加载下一个可能访问的页面
      this.preloadNextPages()
      
      return originalOnLoad.call(this, options)
    }

    // 预加载下一个页面的方法
    pageInstance.preloadNextPages = function() {
      const currentRoute = this.route
      const nextPages = this.getNextPossiblePages ? this.getNextPossiblePages() : []
      
      nextPages.forEach(pageUrl => {
        performanceMonitor.preloadPage(pageUrl)
      })
    }
  }

  // 启用缓存优化
  enableCacheOptimization(pageInstance) {
    // 为页面添加缓存方法
    pageInstance.setCache = function(key, data, expireTime) {
      const cacheKey = `${this.route}_${key}`
      performanceMonitor.cacheManager.set(cacheKey, data, expireTime)
    }

    pageInstance.getCache = function(key) {
      const cacheKey = `${this.route}_${key}`
      return performanceMonitor.cacheManager.get(cacheKey)
    }

    pageInstance.clearCache = function(key) {
      if (key) {
        const cacheKey = `${this.route}_${key}`
        performanceMonitor.cacheManager.remove(cacheKey)
      } else {
        // 清除页面所有缓存
        this.clearPageCache()
      }
    }

    pageInstance.clearPageCache = function() {
      try {
        const storage = wx.getStorageInfoSync()
        const pagePrefix = `cache_${this.route}_`
        const pageCacheKeys = storage.keys.filter(key => key.startsWith(pagePrefix))
        
        pageCacheKeys.forEach(key => {
          wx.removeStorageSync(key)
        })
        
        console.log(`清除页面缓存: ${pageCacheKeys.length} 个`)
      } catch (error) {
        console.error('清除页面缓存失败:', error)
      }
    }
  }

  // 图片懒加载优化
  setupLazyLoading(pageInstance, selector = '.lazy-image') {
    if (!pageInstance.createIntersectionObserver) {
      console.warn('当前环境不支持IntersectionObserver')
      return
    }

    const observer = pageInstance.createIntersectionObserver({
      thresholds: [0.1],
      observeAll: true
    })

    observer.relativeToViewport({ bottom: 100 })

    observer.observe(selector, (res) => {
      if (res.intersectionRatio > 0) {
        const dataset = res.dataset
        if (dataset && dataset.src) {
          // 触发图片加载
          pageInstance.setData({
            [`${dataset.index}.loaded`]: true,
            [`${dataset.index}.src`]: dataset.src
          })
        }
      }
    })

    // 页面卸载时断开观察
    const originalOnUnload = pageInstance.onUnload || function() {}
    pageInstance.onUnload = function() {
      if (observer) {
        observer.disconnect()
      }
      return originalOnUnload.call(this)
    }

    return observer
  }

  // 长列表优化
  optimizeLongList(pageInstance, options = {}) {
    const defaultOptions = {
      pageSize: 20,
      threshold: 5,
      maxCachePages: 3
    }

    const config = { ...defaultOptions, ...options }
    
    // 添加虚拟滚动支持
    pageInstance.virtualScrollData = {
      allData: [],
      visibleData: [],
      startIndex: 0,
      endIndex: config.pageSize,
      pageSize: config.pageSize
    }

    // 更新可见数据
    pageInstance.updateVisibleData = function(scrollTop, itemHeight = 100) {
      const containerHeight = this.data.containerHeight || 600
      const startIndex = Math.floor(scrollTop / itemHeight)
      const visibleCount = Math.ceil(containerHeight / itemHeight)
      const endIndex = Math.min(
        startIndex + visibleCount + config.threshold,
        this.virtualScrollData.allData.length
      )

      const actualStartIndex = Math.max(0, startIndex - config.threshold)
      
      this.virtualScrollData.startIndex = actualStartIndex
      this.virtualScrollData.endIndex = endIndex
      this.virtualScrollData.visibleData = this.virtualScrollData.allData.slice(
        actualStartIndex, 
        endIndex
      )

      this.setData({
        visibleList: this.virtualScrollData.visibleData,
        scrollViewHeight: this.virtualScrollData.allData.length * itemHeight,
        offsetY: actualStartIndex * itemHeight
      })
    }

    // 添加数据到虚拟滚动
    pageInstance.addVirtualScrollData = function(newData) {
      this.virtualScrollData.allData = this.virtualScrollData.allData.concat(newData)
      this.updateVisibleData(0)
    }
  }

  // 内存优化
  optimizeMemory(pageInstance) {
    const originalOnHide = pageInstance.onHide || function() {}
    const originalOnShow = pageInstance.onShow || function() {}

    // 页面隐藏时释放资源
    pageInstance.onHide = function() {
      // 清理定时器
      if (this._timers) {
        this._timers.forEach(timer => clearTimeout(timer))
        this._timers = []
      }

      // 清理动画
      if (this._animations) {
        this._animations.forEach(animation => {
          if (animation.stop) animation.stop()
        })
        this._animations = []
      }

      // 暂停视频播放
      if (this.videoContext) {
        this.videoContext.pause()
      }

      return originalOnHide.call(this)
    }

    // 页面显示时恢复资源
    pageInstance.onShow = function() {
      // 重新初始化必要的资源
      this._timers = this._timers || []
      this._animations = this._animations || []

      return originalOnShow.call(this)
    }

    // 添加定时器管理
    pageInstance.setTimeout = function(callback, delay) {
      this._timers = this._timers || []
      const timer = setTimeout(() => {
        callback()
        // 从数组中移除已完成的定时器
        const index = this._timers.indexOf(timer)
        if (index > -1) {
          this._timers.splice(index, 1)
        }
      }, delay)
      this._timers.push(timer)
      return timer
    }

    pageInstance.clearTimeout = function(timer) {
      clearTimeout(timer)
      if (this._timers) {
        const index = this._timers.indexOf(timer)
        if (index > -1) {
          this._timers.splice(index, 1)
        }
      }
    }
  }

  // 网络优化
  optimizeNetwork(pageInstance) {
    // 添加网络状态检查
    pageInstance.checkNetworkAndExecute = async function(callback) {
      try {
        const networkStatus = await errorHandler.checkNetworkStatus()
        
        if (!networkStatus.isConnected) {
          errorHandler.showError('网络连接不可用')
          return false
        }

        if (networkStatus.isSlowNetwork) {
          errorHandler.showError('网络较慢，请耐心等待')
        }

        return callback()
      } catch (error) {
        errorHandler.showError('网络检查失败')
        return false
      }
    }

    // 添加请求去重
    pageInstance._requestCache = new Map()
    
    pageInstance.requestWithCache = function(requestKey, requestFn, cacheTime = 5 * 60 * 1000) {
      // 检查是否有相同请求正在进行
      if (this._requestCache.has(requestKey)) {
        return this._requestCache.get(requestKey)
      }

      // 检查缓存
      const cachedData = this.getCache(requestKey)
      if (cachedData) {
        return Promise.resolve(cachedData)
      }

      // 执行请求
      const requestPromise = requestFn().then(data => {
        // 缓存结果
        this.setCache(requestKey, data, cacheTime)
        return data
      }).finally(() => {
        // 请求完成后从缓存中移除
        this._requestCache.delete(requestKey)
      })

      this._requestCache.set(requestKey, requestPromise)
      return requestPromise
    }
  }
}

module.exports = new PageOptimizer()