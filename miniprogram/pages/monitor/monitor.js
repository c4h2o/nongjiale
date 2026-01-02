// pages/monitor/monitor.js
const gardenService = require('../../services/garden')
const { formatCountdown } = require('../../utils/util')
const pageOptimizer = require('../../utils/pageOptimizer')
const performanceMonitor = require('../../utils/performance')

Page({
  data: {
    gardenId: '',
    gardenName: '',
    streamUrl: '',
    deviceStatus: {
      irrigation: {
        status: 'idle',
        remainingTime: 0,
        cooldownRemaining: 0
      },
      camera: {
        status: 'online',
        streamUrl: '',
        delay: 0
      }
    },
    loading: true,
    videoError: false,
    fullscreen: false,
    irrigationDurations: [
      { value: 5, label: '5分钟' },
      { value: 10, label: '10分钟' },
      { value: 15, label: '15分钟' }
    ],
    selectedDuration: 10,
    countdownTimer: null,
    cooldownTimer: null,
    pollTimer: null,
    lastUpdateTime: 0
  },

  onLoad(options) {
    // 启用页面性能优化
    pageOptimizer.optimizePage(this, {
      enableSetDataOptimization: true,
      enableScrollOptimization: false, // 监控页面不需要滚动优化
      enablePullRefreshOptimization: true,
      enableCacheOptimization: true
    })

    // 启用内存优化
    pageOptimizer.optimizeMemory(this)
    
    // 启用网络优化
    pageOptimizer.optimizeNetwork(this)

    const { gardenId, gardenName } = options
    
    if (!gardenId) {
      wx.showToast({
        title: '菜园ID不能为空',
        icon: 'none'
      })
      this.setTimeout(() => {
        wx.navigateBack()
      }, 2000)
      return
    }

    this.setData({
      gardenId,
      gardenName: gardenName || '菜园监控'
    })

    wx.setNavigationBarTitle({
      title: gardenName || '菜园监控'
    })

    this.initMonitor()
  },

  onShow() {
    // 页面显示时刷新设备状态（使用缓存优化）
    if (this.data.gardenId) {
      this.loadDeviceStatusWithCache()
    }
  },

  onHide() {
    // 页面隐藏时清除定时器和暂停视频
    this.clearTimers()
    this.pauseVideo()
  },

  onUnload() {
    // 页面卸载时清除定时器和资源
    this.clearTimers()
    this.clearPageCache()
  },

  // 暂停视频播放
  pauseVideo() {
    try {
      const videoContext = wx.createLivePlayerContext('gardenVideo', this)
      if (videoContext) {
        videoContext.pause()
      }
    } catch (error) {
      console.error('暂停视频失败:', error)
    }
  },

  // 恢复视频播放
  resumeVideo() {
    try {
      const videoContext = wx.createLivePlayerContext('gardenVideo', this)
      if (videoContext && this.data.streamUrl) {
        videoContext.play()
      }
    } catch (error) {
      console.error('恢复视频失败:', error)
    }
  },

  // 初始化监控
  async initMonitor() {
    try {
      this.setData({ loading: true })
      
      // 并行加载视频流和设备状态
      await Promise.all([
        this.loadVideoStream(),
        this.loadDeviceStatus()
      ])
      
      this.setData({ loading: false })
      
      // 开始定时刷新设备状态
      this.startStatusPolling()
      
    } catch (error) {
      console.error('初始化监控失败:', error)
      this.setData({ loading: false })
      
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    }
  },

  // 加载视频流
  async loadVideoStream() {
    try {
      const result = await gardenService.getVideoStream(this.data.gardenId)
      
      this.setData({
        streamUrl: result.streamUrl,
        'deviceStatus.camera': {
          status: 'online',
          streamUrl: result.streamUrl,
          delay: result.maxDelay || 3
        }
      })
      
      console.log('视频流加载成功:', result.streamUrl)
      
    } catch (error) {
      console.error('加载视频流失败:', error)
      this.setData({
        videoError: true,
        'deviceStatus.camera.status': 'offline'
      })
    }
  },

  // 带缓存的加载设备状态
  async loadDeviceStatusWithCache() {
    const cacheKey = `device_status_${this.data.gardenId}`
    return this.requestWithCache(cacheKey, () => this.loadDeviceStatus(), 30 * 1000) // 缓存30秒
  },

  // 加载设备状态
  async loadDeviceStatus() {
    try {
      const now = Date.now()
      
      // 防止频繁请求
      if (now - this.data.lastUpdateTime < 5000) {
        console.log('设备状态更新过于频繁，跳过本次请求')
        return
      }

      const result = await gardenService.getDeviceStatus(this.data.gardenId)
      
      // 优化setData，只更新变化的数据
      const updates = {
        lastUpdateTime: now
      }

      if (JSON.stringify(this.data.deviceStatus) !== JSON.stringify(result)) {
        updates.deviceStatus = result
      }

      this.setData(updates)
      
      // 如果灌溉设备正在运行，启动倒计时
      if (result.irrigation.status === 'running' && result.irrigation.remainingTime > 0) {
        this.startCountdown(result.irrigation.remainingTime)
      }
      
      // 如果有冷却时间，启动冷却倒计时
      if (result.irrigation.cooldownRemaining > 0) {
        this.startCooldownTimer(result.irrigation.cooldownRemaining)
      }
      
      console.log('设备状态加载成功:', result)
      
    } catch (error) {
      console.error('加载设备状态失败:', error)
    }
  },

  // 开始状态轮询（优化版）
  startStatusPolling() {
    // 根据网络状态调整轮询间隔
    const app = getApp()
    const pollInterval = app.globalData.pollInterval || 30000
    
    // 清除之前的轮询
    if (this.pollTimer) {
      this.clearTimeout(this.pollTimer)
    }
    
    // 使用页面级定时器管理
    this.pollTimer = this.setTimeout(() => {
      this.loadDeviceStatusWithCache().finally(() => {
        // 递归调用以保持轮询
        this.startStatusPolling()
      })
    }, pollInterval)
  },

  // 视频播放状态变化
  onVideoStateChange(e) {
    const state = e.detail.code
    console.log('视频状态变化:', state)
    
    switch (state) {
      case 2001: // 开始连接
        console.log('开始连接视频流')
        break
      case 2004: // 视频播放开始
        console.log('视频播放开始')
        this.setData({ videoError: false })
        break
      case -2301: // 网络连接断开
      case -2302: // 网络连接失败
        console.log('视频连接失败')
        this.setData({ videoError: true })
        break
    }
  },

  // 视频错误处理
  onVideoError(e) {
    console.error('视频播放错误:', e.detail)
    this.setData({ videoError: true })
    
    wx.showToast({
      title: '视频加载失败',
      icon: 'none'
    })
  },

  // 全屏切换
  onFullscreenChange(e) {
    this.setData({
      fullscreen: e.detail.fullScreen
    })
  },

  // 进入全屏
  enterFullscreen() {
    const videoContext = wx.createLivePlayerContext('gardenVideo', this)
    videoContext.requestFullScreen({
      direction: 90 // 横屏
    })
  },

  // 退出全屏
  exitFullscreen() {
    const videoContext = wx.createLivePlayerContext('gardenVideo', this)
    videoContext.exitFullScreen()
  },

  // 截图
  async takeSnapshot() {
    try {
      wx.showLoading({
        title: '截图中...'
      })
      
      const result = await gardenService.takeSnapshot(this.data.gardenId)
      
      wx.hideLoading()
      
      if (result.success) {
        wx.showModal({
          title: '截图成功',
          content: '截图已保存到本地相册',
          showCancel: false
        })
      }
      
    } catch (error) {
      wx.hideLoading()
      console.error('截图失败:', error)
      
      wx.showToast({
        title: error.message || '截图失败',
        icon: 'none'
      })
    }
  },

  // 选择浇水时长
  onDurationSelect(e) {
    const duration = e.currentTarget.dataset.duration
    this.setData({
      selectedDuration: duration
    })
  },

  // 开始浇水
  async startIrrigation() {
    const { selectedDuration, deviceStatus } = this.data
    
    // 检查设备状态
    if (deviceStatus.irrigation.status === 'running') {
      wx.showToast({
        title: '设备正在运行中',
        icon: 'none'
      })
      return
    }
    
    if (deviceStatus.irrigation.cooldownRemaining > 0) {
      wx.showToast({
        title: `操作冷却中，请等待${deviceStatus.irrigation.cooldownRemaining}秒`,
        icon: 'none'
      })
      return
    }

    // 确认对话框
    wx.showModal({
      title: '确认浇水',
      content: `确定要开始浇水${selectedDuration}分钟吗？`,
      success: async (res) => {
        if (res.confirm) {
          await this.controlIrrigation('start', selectedDuration)
        }
      }
    })
  },

  // 停止浇水
  async stopIrrigation() {
    wx.showModal({
      title: '确认停止',
      content: '确定要停止浇水吗？',
      success: async (res) => {
        if (res.confirm) {
          await this.controlIrrigation('stop')
        }
      }
    })
  },

  // 控制灌溉设备
  async controlIrrigation(action, duration) {
    try {
      wx.showLoading({
        title: action === 'start' ? '启动中...' : '停止中...'
      })
      
      const result = await gardenService.controlIrrigation(
        this.data.gardenId, 
        action, 
        duration
      )
      
      wx.hideLoading()
      
      if (result.success) {
        wx.showToast({
          title: action === 'start' ? '浇水启动成功' : '浇水停止成功',
          icon: 'success'
        })
        
        // 更新设备状态
        this.setData({
          'deviceStatus.irrigation.status': result.status,
          'deviceStatus.irrigation.remainingTime': result.remainingTime || 0
        })
        
        // 启动相应的计时器
        if (action === 'start' && result.remainingTime > 0) {
          this.startCountdown(result.remainingTime)
        } else if (action === 'stop') {
          this.clearTimers()
          // 启动冷却计时器
          if (result.cooldownTime > 0) {
            this.startCooldownTimer(result.cooldownTime)
          }
        }
      }
      
    } catch (error) {
      wx.hideLoading()
      console.error('控制灌溉设备失败:', error)
      
      wx.showToast({
        title: error.message || '操作失败，请重试',
        icon: 'none'
      })
    }
  },

  // 开始倒计时（优化版）
  startCountdown(seconds) {
    this.clearTimers()
    
    let remainingTime = seconds
    this.setData({
      'deviceStatus.irrigation.remainingTime': remainingTime
    })
    
    // 使用页面级定时器管理
    const updateCountdown = () => {
      remainingTime--
      
      if (remainingTime <= 0) {
        // 倒计时结束
        this.setData({
          'deviceStatus.irrigation.status': 'idle',
          'deviceStatus.irrigation.remainingTime': 0
        })
        
        wx.showToast({
          title: '浇水完成',
          icon: 'success'
        })
        
        // 启动冷却计时器
        this.startCooldownTimer(30)
      } else {
        this.setData({
          'deviceStatus.irrigation.remainingTime': remainingTime
        })
        
        // 递归调用
        this.countdownTimer = this.setTimeout(updateCountdown, 1000)
      }
    }
    
    this.countdownTimer = this.setTimeout(updateCountdown, 1000)
  },

  // 开始冷却计时器（优化版）
  startCooldownTimer(seconds) {
    let cooldownTime = seconds
    this.setData({
      'deviceStatus.irrigation.cooldownRemaining': cooldownTime
    })
    
    const updateCooldown = () => {
      cooldownTime--
      
      if (cooldownTime <= 0) {
        this.setData({
          'deviceStatus.irrigation.cooldownRemaining': 0
        })
      } else {
        this.setData({
          'deviceStatus.irrigation.cooldownRemaining': cooldownTime
        })
        
        // 递归调用
        this.cooldownTimer = this.setTimeout(updateCooldown, 1000)
      }
    }
    
    this.cooldownTimer = this.setTimeout(updateCooldown, 1000)
  },

  // 清除定时器（优化版）
  clearTimers() {
    if (this.countdownTimer) {
      this.clearTimeout(this.countdownTimer)
      this.countdownTimer = null
    }
    
    if (this.cooldownTimer) {
      this.clearTimeout(this.cooldownTimer)
      this.cooldownTimer = null
    }
    
    if (this.pollTimer) {
      this.clearTimeout(this.pollTimer)
      this.pollTimer = null
    }
  },

  // 刷新监控（优化版）
  async onRefresh() {
    // 清除缓存以获取最新数据
    this.clearCache(`device_status_${this.data.gardenId}`)
    
    await this.checkNetworkAndExecute(async () => {
      await this.initMonitor()
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      })
    })
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: `${this.data.gardenName} - 实时监控`,
      path: '/pages/index/index',
      imageUrl: '/images/share-monitor.png'
    }
  }
})