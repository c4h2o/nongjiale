// pages/gardens/gardens.js
const gardenService = require('../../services/garden')
const authService = require('../../services/auth')
const pageOptimizer = require('../../utils/pageOptimizer')
const performanceMonitor = require('../../utils/performance')

Page({
  data: {
    gardens: [],
    loading: true,
    refreshing: false
  },

  onLoad() {
    // 启用页面性能优化
    pageOptimizer.optimizePage(this, {
      enableSetDataOptimization: true,
      enableScrollOptimization: true,
      enablePullRefreshOptimization: true,
      enableCacheOptimization: true
    })

    // 启用内存优化
    pageOptimizer.optimizeMemory(this)
    
    // 启用网络优化
    pageOptimizer.optimizeNetwork(this)

    this.checkLoginAndLoadData()
  },

  onShow() {
    // 每次显示页面时刷新数据（使用缓存优化）
    this.loadGardenListWithCache()
  },

  // 获取下一个可能访问的页面（用于预加载）
  getNextPossiblePages() {
    return [
      '/pages/monitor/monitor',
      '/pages/garden-bind/garden-bind'
    ]
  },

  // 检查登录状态并加载数据
  async checkLoginAndLoadData() {
    if (!authService.checkLoginStatus()) {
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    await this.loadGardenListWithCache()
  },

  // 带缓存的加载菜园列表
  async loadGardenListWithCache() {
    return this.requestWithCache('garden_list', () => this.loadGardenList(), 2 * 60 * 1000) // 缓存2分钟
  },

  // 加载菜园列表
  async loadGardenList() {
    try {
      this.setData({ loading: true })
      
      const result = await gardenService.getGardenList()
      
      // 优化setData，只更新必要的数据
      const newData = {
        loading: false
      }

      // 检查数据是否真的发生了变化
      if (JSON.stringify(this.data.gardens) !== JSON.stringify(result.gardens || [])) {
        newData.gardens = result.gardens || []
      }

      this.setData(newData)
      
      console.log('菜园列表加载成功:', result.gardens)
      
      // 预加载监控页面数据
      this.preloadMonitorData(result.gardens)
      
    } catch (error) {
      console.error('加载菜园列表失败:', error)
      this.setData({ loading: false })
      
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    }
  },

  // 预加载监控页面数据
  preloadMonitorData(gardens) {
    if (!gardens || gardens.length === 0) return

    // 预加载第一个菜园的监控数据
    const firstGarden = gardens[0]
    if (firstGarden && firstGarden.id) {
      this.setTimeout(() => {
        gardenService.getGardenDetail(firstGarden.id).catch(() => {
          // 预加载失败不影响主流程
        })
      }, 1000)
    }
  },

  // 菜园项点击（优化版）
  onGardenItemTap(e) {
    const garden = e.currentTarget.dataset.garden
    
    // 检查网络状态
    this.checkNetworkAndExecute(() => {
      // 预加载目标页面
      performanceMonitor.preloadPage(`/pages/monitor/monitor?gardenId=${garden.id}`)
      
      wx.navigateTo({
        url: `/pages/monitor/monitor?gardenId=${garden.id}&gardenName=${garden.name}`
      })
    })
  },

  // 解绑菜园
  onUnbindGarden(e) {
    const garden = e.currentTarget.dataset.garden
    
    wx.showModal({
      title: '确认解绑',
      content: `确定要解绑菜园"${garden.name}"吗？解绑后将无法远程控制该菜园。`,
      success: async (res) => {
        if (res.confirm) {
          await this.handleUnbindGarden(garden)
        }
      }
    })
  },

  // 处理解绑菜园
  async handleUnbindGarden(garden) {
    try {
      wx.showLoading({
        title: '解绑中...'
      })
      
      await gardenService.unbindGarden(garden.id)
      
      wx.hideLoading()
      wx.showToast({
        title: '解绑成功',
        icon: 'success'
      })
      
      // 清除相关缓存
      this.clearCache('garden_list')
      this.clearCache(`garden_detail_${garden.id}`)
      
      // 刷新列表
      await this.loadGardenList()
      
    } catch (error) {
      wx.hideLoading()
      console.error('解绑菜园失败:', error)
      
      wx.showToast({
        title: error.message || '解绑失败，请重试',
        icon: 'none'
      })
    }
  },

  // 跳转到绑定页面
  goToBindGarden() {
    // 预加载绑定页面
    performanceMonitor.preloadPage('/pages/garden-bind/garden-bind')
    
    wx.navigateTo({
      url: '/pages/garden-bind/garden-bind'
    })
  },

  // 获取状态文本和样式
  getStatusInfo(status) {
    const statusMap = {
      'active': { text: '正常', class: 'active' },
      'inactive': { text: '离线', class: 'inactive' },
      'maintenance': { text: '维护中', class: 'maintenance' }
    }
    return statusMap[status] || { text: status, class: 'unknown' }
  },

  // 下拉刷新（已通过pageOptimizer自动优化防抖）
  async onPullDownRefresh() {
    this.setData({ refreshing: true })
    
    // 清除缓存以获取最新数据
    this.clearCache('garden_list')
    
    await this.loadGardenList()
    this.setData({ refreshing: false })
    wx.stopPullDownRefresh()
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '智慧共享菜园 - 我的菜园管理',
      path: '/pages/index/index',
      imageUrl: '/images/share-garden.png'
    }
  },

  // 页面卸载时清理资源
  onUnload() {
    // 清理页面特定的缓存
    this.clearPageCache()
  }
})