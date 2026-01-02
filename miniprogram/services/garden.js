// 菜园管理服务
const request = require('../utils/request')

class GardenService {
  // 绑定菜园
  async bindGarden(gardenId) {
    try {
      const response = await request.post('/gardens/bind', { gardenId })
      return response.data
    } catch (error) {
      console.error('绑定菜园失败:', error)
      throw error
    }
  }

  // 解绑菜园
  async unbindGarden(gardenId) {
    try {
      const response = await request.delete(`/gardens/${gardenId}/unbind`)
      return response.data
    } catch (error) {
      console.error('解绑菜园失败:', error)
      throw error
    }
  }

  // 获取菜园列表
  async getGardenList() {
    try {
      const response = await request.get('/gardens/list')
      return response.data
    } catch (error) {
      console.error('获取菜园列表失败:', error)
      throw error
    }
  }

  // 获取菜园详情
  async getGardenDetail(gardenId) {
    try {
      const response = await request.get(`/gardens/${gardenId}`)
      return response.data
    } catch (error) {
      console.error('获取菜园详情失败:', error)
      throw error
    }
  }

  // 获取实时视频流
  async getVideoStream(gardenId) {
    try {
      const response = await request.get(`/gardens/${gardenId}/stream`)
      return response.data
    } catch (error) {
      console.error('获取视频流失败:', error)
      throw error
    }
  }

  // 获取设备状态
  async getDeviceStatus(gardenId) {
    try {
      const response = await request.get(`/devices/${gardenId}/status`)
      return response.data
    } catch (error) {
      console.error('获取设备状态失败:', error)
      throw error
    }
  }

  // 控制灌溉设备
  async controlIrrigation(gardenId, action, duration = 10) {
    try {
      const response = await request.post('/devices/irrigation/control', {
        gardenId,
        action,
        duration
      })
      return response.data
    } catch (error) {
      console.error('控制灌溉设备失败:', error)
      throw error
    }
  }

  // 摄像头截图
  async takeSnapshot(gardenId) {
    try {
      const response = await request.post('/devices/camera/snapshot', { gardenId })
      
      // 如果返回了截图URL，尝试保存到相册
      if (response.data && response.data.snapshotUrl) {
        await this.saveImageToAlbum(response.data.snapshotUrl)
      }
      
      return response.data
    } catch (error) {
      console.error('截图失败:', error)
      throw error
    }
  }

  // 保存图片到相册
  async saveImageToAlbum(imageUrl) {
    try {
      // 下载图片
      const downloadRes = await this.downloadImage(imageUrl)
      
      // 保存到相册
      await this.saveToPhotosAlbum(downloadRes.tempFilePath)
      
      return true
    } catch (error) {
      console.error('保存图片到相册失败:', error)
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

  // 保存到相册
  saveToPhotosAlbum(filePath) {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: resolve,
        fail: (error) => {
          // 如果是权限问题，引导用户授权
          if (error.errMsg.includes('auth deny')) {
            wx.showModal({
              title: '需要相册权限',
              content: '保存截图需要访问您的相册，请在设置中开启权限',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) {
                  wx.openSetting()
                }
              }
            })
          }
          reject(error)
        }
      })
    })
  }

  // 获取环境数据（模拟数据）
  async getEnvironmentData(gardenId) {
    try {
      // 原型版返回模拟数据
      const mockData = {
        temperature: Math.floor(Math.random() * 10) + 20, // 20-30度
        humidity: Math.floor(Math.random() * 20) + 60,    // 60-80%
        light: ['良好', '一般', '较弱'][Math.floor(Math.random() * 3)],
        soil: ['湿润', '适中', '干燥'][Math.floor(Math.random() * 3)],
        lastUpdate: new Date().toISOString()
      }
      
      return mockData
    } catch (error) {
      console.error('获取环境数据失败:', error)
      throw error
    }
  }

  // 获取历史数据
  async getHistoryData(gardenId, type = 'irrigation', days = 7) {
    try {
      const response = await request.get(`/gardens/${gardenId}/history`, {
        type,
        days
      })
      return response.data
    } catch (error) {
      console.error('获取历史数据失败:', error)
      throw error
    }
  }
}

module.exports = new GardenService()