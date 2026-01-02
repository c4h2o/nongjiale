// pages/services/services.js
const orderService = require('../../services/order')
const authService = require('../../services/auth')

Page({
  data: {
    services: [],
    loading: true,
    refreshing: false
  },

  onLoad() {
    this.checkLoginAndLoadData()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadServiceList()
  },

  // 检查登录状态并加载数据
  async checkLoginAndLoadData() {
    if (!authService.checkLoginStatus()) {
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    await this.loadServiceList()
  },

  // 加载服务列表
  async loadServiceList() {
    try {
      this.setData({ loading: true })
      
      const result = await orderService.getServiceList()
      
      this.setData({
        services: result.services || [],
        loading: false
      })
      
      console.log('服务列表加载成功:', result.services)
      
    } catch (error) {
      console.error('加载服务列表失败:', error)
      this.setData({ loading: false })
      
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    }
  },

  // 服务项点击
  onServiceItemTap(e) {
    const service = e.currentTarget.dataset.service
    
    wx.navigateTo({
      url: `/pages/service-book/service-book?serviceId=${service.id}&serviceName=${encodeURIComponent(service.name)}`
    })
  },

  // 获取服务图标
  getServiceIcon(serviceName) {
    const iconMap = {
      '菜园认领': '/images/service-claim.png',
      '果蔬采摘': '/images/service-pick.png',
      '施肥养护': '/images/service-care.png',
      '定制种植': '/images/service-custom.png',
      '农具租赁': '/images/service-tools.png'
    }
    return iconMap[serviceName] || '/images/service-default.png'
  },

  // 格式化价格
  formatPrice(price) {
    return `¥${price.toFixed(2)}`
  },

  // 下拉刷新
  async onPullDownRefresh() {
    this.setData({ refreshing: true })
    await this.loadServiceList()
    this.setData({ refreshing: false })
    wx.stopPullDownRefresh()
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '智慧共享菜园 - 农事服务',
      path: '/pages/services/services',
      imageUrl: '/images/share-services.png'
    }
  }
})