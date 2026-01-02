// pages/login/login.js
const authService = require('../../services/auth')

Page({
  data: {
    loading: false,
    canIUseGetUserProfile: false
  },

  onLoad() {
    // 检查是否已登录
    if (authService.checkLoginStatus()) {
      wx.switchTab({
        url: '/pages/index/index'
      })
      return
    }

    // 检查微信版本是否支持getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },

  // 微信登录
  async handleWechatLogin() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      // 先获取微信授权码
      const loginRes = await this.getWechatCode()
      console.log('获取微信code成功:', loginRes.code)
      
      // 获取用户信息授权
      let userInfo = null
      if (this.data.canIUseGetUserProfile) {
        try {
          const userProfile = await this.getUserProfile()
          userInfo = userProfile.userInfo
          console.log('获取用户信息成功:', userInfo)
        } catch (profileError) {
          console.log('用户取消授权或获取用户信息失败:', profileError)
          // 即使没有用户信息也可以登录，使用默认信息
        }
      }
      
      // 调用登录服务
      const result = await authService.wechatLogin(loginRes.code, userInfo)
      
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })
      
      // 跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
      
    } catch (error) {
      console.error('登录失败:', error)
      let errorMessage = '登录失败，请重试'
      
      if (error.message) {
        errorMessage = error.message
      } else if (error.errMsg) {
        if (error.errMsg.includes('auth deny')) {
          errorMessage = '登录授权被拒绝'
        } else if (error.errMsg.includes('network')) {
          errorMessage = '网络连接失败，请检查网络'
        }
      }
      
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 获取微信登录code
  getWechatCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      })
    })
  },

  // 获取用户信息
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: resolve,
        fail: reject
      })
    })
  }
})