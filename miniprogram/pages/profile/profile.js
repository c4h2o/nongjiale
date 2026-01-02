// pages/profile/profile.js
const authService = require('../../services/auth')

Page({
  data: {
    userInfo: null,
    gardenCount: 0,
    orderCount: 0,
    loading: true,
    menuItems: [
      {
        id: 'gardens',
        title: '我的菜园',
        icon: '/images/garden.png',
        desc: '查看和管理菜园',
        url: '/pages/gardens/gardens',
        type: 'switchTab'
      },
      {
        id: 'orders',
        title: '我的订单',
        icon: '/images/order.png',
        desc: '查看订单状态',
        url: '/pages/orders/orders',
        type: 'navigate'
      },
      {
        id: 'promotion',
        title: '我的推广码',
        icon: '/images/promotion.png',
        desc: '邀请好友获奖励',
        url: '/pages/promotion/promotion',
        type: 'navigate'
      }
    ]
  },

  onLoad() {
    this.checkLoginAndLoadData()
  },

  onShow() {
    // 每次显示页面时刷新数据
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
      this.setData({ loading: true })
      
      const userInfo = await authService.getUserInfo()
      
      this.setData({
        userInfo: userInfo.user,
        gardenCount: userInfo.gardens ? userInfo.gardens.length : 0,
        orderCount: userInfo.recentOrders ? userInfo.recentOrders.length : 0,
        loading: false
      })
      
      console.log('用户数据加载成功:', userInfo.user)
      
    } catch (error) {
      console.error('加载用户数据失败:', error)
      this.setData({ loading: false })
      
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    }
  },

  // 菜单项点击
  onMenuItemTap(e) {
    const { item } = e.currentTarget.dataset
    
    if (!item.url) return
    
    if (item.type === 'switchTab') {
      wx.switchTab({
        url: item.url
      })
    } else {
      wx.navigateTo({
        url: item.url
      })
    }
  },

  // 设置按钮点击
  onSettingsTap() {
    wx.showActionSheet({
      itemList: ['关于我们', '意见反馈', '退出登录'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.showAbout()
            break
          case 1:
            this.showFeedback()
            break
          case 2:
            this.handleLogout()
            break
        }
      }
    })
  },

  // 显示关于我们
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '智慧共享菜园 v1.0\n\n一个基于微信生态的IoT农业管理平台，让您足不出户即可管控菜园。\n\n© 2024 Smart Garden Team',
      showCancel: false
    })
  },

  // 显示意见反馈
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '如有问题或建议，请联系客服微信：smartgarden2024',
      showCancel: false,
      confirmText: '复制微信号',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: 'smartgarden2024',
            success: () => {
              wx.showToast({
                title: '微信号已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          authService.logout()
        }
      }
    })
  },

  // 下拉刷新
  async onPullDownRefresh() {
    await this.loadUserData()
    wx.stopPullDownRefresh()
  },

  // 分享功能
  onShareAppMessage() {
    const userInfo = this.data.userInfo
    return {
      title: '智慧共享菜园 - 足不出户管控菜园',
      path: '/pages/index/index',
      imageUrl: '/images/share-cover.png'
    }
  }
})