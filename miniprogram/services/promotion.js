// 推广服务
const request = require('../utils/request')

class PromotionService {
  // 获取推广码
  async getPromotionCode() {
    try {
      const response = await request.get('/promotion/code')
      return response.data
    } catch (error) {
      console.error('获取推广码失败:', error)
      throw error
    }
  }

  // 角色选择
  async selectRole(role) {
    try {
      const response = await request.post('/promotion/role-select', { role })
      return response.data
    } catch (error) {
      console.error('角色选择失败:', error)
      throw error
    }
  }

  // 提交入驻申请
  async submitApplication(applicationData) {
    try {
      const response = await request.post('/applications/submit', applicationData)
      return response.data
    } catch (error) {
      console.error('提交入驻申请失败:', error)
      throw error
    }
  }

  // 获取推广数据
  async getPromotionStats() {
    try {
      const response = await request.get('/promotion/stats')
      return response.data
    } catch (error) {
      console.error('获取推广数据失败:', error)
      throw error
    }
  }

  // 保存推广码到相册
  async savePromotionCodeToAlbum(qrCodeUrl) {
    try {
      // 下载二维码图片
      const downloadRes = await this.downloadImage(qrCodeUrl)
      
      // 保存到相册
      await this.saveImageToAlbum(downloadRes.tempFilePath)
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      return true
    } catch (error) {
      console.error('保存推广码失败:', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
      throw error
    }
  }

  // 下载图片
  downloadImage(url) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url,
        success: resolve,
        fail: reject
      })
    })
  }

  // 保存图片到相册
  saveImageToAlbum(filePath) {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: resolve,
        fail: reject
      })
    })
  }
}

module.exports = new PromotionService()