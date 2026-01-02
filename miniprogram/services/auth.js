// 用户认证服务
const request = require('../utils/request')
const storage = require('../utils/storage')
const { generatePromotionCode } = require('../utils/util')

class AuthService {
  // 微信登录
  async wechatLogin(code, userInfo = null) {
    try {
      if (!code) {
        throw new Error('缺少微信授权码')
      }

      // 发送到后端验证
      const loginData = {
        code: code,
        userInfo: userInfo
      }
      
      console.log('发送登录请求:', loginData)
      
      const response = await request.post('/auth/wechat-login', loginData)
      
      if (response.success) {
        // 保存token和用户信息
        const app = getApp()
        app.globalData.token = response.data.token
        app.globalData.userInfo = response.data.userInfo
        
        storage.set('token', response.data.token)
        storage.set('userInfo', response.data.userInfo)
        
        console.log('登录成功，用户信息:', response.data.userInfo)
        console.log('是否首次登录:', response.data.isFirstLogin)
        
        return response.data
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      console.error('微信登录失败:', error)
      
      // 处理网络错误
      if (error.message && error.message.includes('request:fail')) {
        throw new Error('网络连接失败，请检查网络设置')
      }
      
      throw error
    }
  }

  // 检查登录状态
  checkLoginStatus() {
    const token = storage.get('token')
    const userInfo = storage.get('userInfo')
    
    if (token && userInfo) {
      const app = getApp()
      app.globalData.token = token
      app.globalData.userInfo = userInfo
      
      // 简单验证token格式
      try {
        const tokenParts = token.split('.')
        if (tokenParts.length !== 3) {
          console.log('Token格式无效')
          this.clearLoginData()
          return false
        }
        
        // 检查token是否过期（简单检查）
        const payload = JSON.parse(atob(tokenParts[1]))
        const currentTime = Math.floor(Date.now() / 1000)
        
        if (payload.exp && payload.exp < currentTime) {
          console.log('Token已过期')
          this.clearLoginData()
          return false
        }
        
        return true
      } catch (error) {
        console.error('Token验证失败:', error)
        this.clearLoginData()
        return false
      }
    }
    
    return false
  }

  // 清除登录数据
  clearLoginData() {
    const app = getApp()
    app.globalData.token = null
    app.globalData.userInfo = null
    
    storage.remove('token')
    storage.remove('userInfo')
  }

  // 退出登录
  logout() {
    this.clearLoginData()
    
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.reLaunch({
            url: '/pages/login/login'
          })
        }
      }
    })
  }

  // 获取用户信息
  async getUserInfo() {
    try {
      const response = await request.get('/users/profile')
      
      if (response.success) {
        // 更新本地存储的用户信息
        const app = getApp()
        app.globalData.userInfo = response.data.user
        storage.set('userInfo', response.data.user)
        
        return response.data
      } else {
        throw new Error(response.message || '获取用户信息失败')
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      
      // 如果是401错误，说明token无效，需要重新登录
      if (error.statusCode === 401) {
        this.clearLoginData()
        wx.reLaunch({
          url: '/pages/login/login'
        })
      }
      
      throw error
    }
  }

  // 刷新token（如果后端支持）
  async refreshToken() {
    try {
      const response = await request.post('/auth/refresh-token')
      
      if (response.success) {
        const app = getApp()
        app.globalData.token = response.data.token
        storage.set('token', response.data.token)
        
        return response.data.token
      } else {
        throw new Error('刷新token失败')
      }
    } catch (error) {
      console.error('刷新token失败:', error)
      this.clearLoginData()
      throw error
    }
  }
}

module.exports = new AuthService()