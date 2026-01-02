// pages/index/index.js
const authService = require('../../services/auth')
const gardenService = require('../../services/garden')

Page({
  data: {
    userInfo: null,
    gardenCount: 0,
    recentOrders: [],
    loading: true
  },

  onLoad() {
    this.checkLoginAndLoadData()
  },

  onShow() {
    if (this.data.userInfo) {
      this.loadUserData()
    }
  },

  // 检查登录状态并加载数据
  async checkLoginAndLoadData() {
    if (!authService.checkLoginStatus()) {
      wx.reLaunch({
        url: '/pages/login/login'
      })
      return
    }

    await this.loadUserData()
  },

  // 加载用户数据
  async loadUserData() {
    try {
      const userInfo = await authService.getUserInfo()
      this.setData({
        userInfo: userInfo.user,
        gardenCount: userInfo.gardens ? userInfo.gardens.length : 0,
        recentOrders: userInfo.recentOrders || [],
        loading: false
      })
    } catch (error) {
      console.error('加载用户数据失败:', error)
      this.setData({ loading: false })
    }
  },

  // 跳转到菜园绑定
  goToGardenBind() {
    wx.navigateTo({
      url: '/pages/garden-bind/garden-bind'
    })
  },

  // 跳转到服务列表
  goToServices() {
    wx.switchTab({
      url: '/pages/services/services'
    })
  },

  // 跳转到推广中心
  goToPromotion() {
    wx.navigateTo({
      url: '/pages/promotion/promotion'
    })
  },

  // 跳转到我的菜园
  goToGardens() {
    wx.switchTab({
      url: '/pages/gardens/gardens'
    })
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadUserData()
    wx.stopPullDownRefresh()
  }
})