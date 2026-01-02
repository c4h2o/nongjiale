// pages/garden-bind/garden-bind.js
const gardenService = require('../../services/garden')
const { validateGardenId } = require('../../utils/util')

Page({
  data: {
    gardenId: '',
    loading: false,
    bindHistory: []
  },

  onLoad() {
    this.loadBindHistory()
  },

  // 加载绑定历史
  async loadBindHistory() {
    try {
      const result = await gardenService.getGardenList()
      this.setData({
        bindHistory: result.gardens || []
      })
    } catch (error) {
      console.error('加载绑定历史失败:', error)
    }
  },

  // 菜园ID输入
  onGardenIdInput(e) {
    let value = e.detail.value.toUpperCase()
    
    // 自动添加GD前缀
    if (value && !value.startsWith('GD')) {
      value = 'GD' + value
    }
    
    // 限制长度为10位（GD + 8位数字）
    if (value.length > 10) {
      value = value.substr(0, 10)
    }
    
    this.setData({
      gardenId: value
    })
  },

  // 绑定菜园
  async handleBindGarden() {
    const gardenId = this.data.gardenId.trim()
    
    if (!gardenId) {
      wx.showToast({
        title: '请输入菜园ID',
        icon: 'none'
      })
      return
    }

    if (!validateGardenId(gardenId)) {
      wx.showToast({
        title: '菜园ID格式不正确\n格式：GD + 8位数字',
        icon: 'none',
        duration: 3000
      })
      return
    }

    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const result = await gardenService.bindGarden(gardenId)
      
      wx.showToast({
        title: '绑定成功',
        icon: 'success'
      })

      // 清空输入框
      this.setData({
        gardenId: ''
      })

      // 刷新绑定历史
      await this.loadBindHistory()

      // 延迟跳转到菜园列表
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/gardens/gardens'
        })
      }, 1500)

    } catch (error) {
      console.error('绑定菜园失败:', error)
      
      let errorMessage = '绑定失败，请重试'
      if (error.message) {
        errorMessage = error.message
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

  // 扫码绑定
  handleScanCode() {
    wx.scanCode({
      success: (res) => {
        console.log('扫码结果:', res)
        
        // 提取菜园ID
        let gardenId = res.result
        
        // 如果是URL，尝试提取ID
        if (gardenId.includes('gardenId=')) {
          const match = gardenId.match(/gardenId=([^&]+)/)
          if (match) {
            gardenId = match[1]
          }
        }
        
        // 验证格式
        if (validateGardenId(gardenId)) {
          this.setData({ gardenId })
          this.handleBindGarden()
        } else {
          wx.showToast({
            title: '二维码格式不正确',
            icon: 'none'
          })
        }
      },
      fail: (error) => {
        console.error('扫码失败:', error)
        if (error.errMsg && !error.errMsg.includes('cancel')) {
          wx.showToast({
            title: '扫码失败，请重试',
            icon: 'none'
          })
        }
      }
    })
  },

  // 查看绑定历史详情
  onHistoryItemTap(e) {
    const garden = e.currentTarget.dataset.garden
    
    wx.showModal({
      title: garden.name,
      content: `位置：${garden.location}\n面积：${garden.area}平方米\n绑定时间：${garden.bindTime}\n状态：${this.getStatusText(garden.status)}`,
      showCancel: false
    })
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'active': '正常',
      'inactive': '离线',
      'maintenance': '维护中'
    }
    return statusMap[status] || status
  },

  // 输入框获得焦点
  onInputFocus() {
    // 可以在这里添加一些UI反馈
  },

  // 输入框失去焦点
  onInputBlur() {
    // 可以在这里添加一些UI反馈
  }
})