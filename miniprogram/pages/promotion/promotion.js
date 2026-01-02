// pages/promotion/promotion.js
const promotionService = require('../../services/promotion')

Page({
  data: {
    userInfo: null,
    promotionCode: '',
    qrCodeUrl: '',
    promotionRules: '',
    promotionStats: {
      inviteCount: 0,
      orderCount: 0
    },
    loading: false,
    saving: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '我的推广码'
    })
    this.loadPromotionData()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadPromotionData()
  },

  onPullDownRefresh() {
    this.loadPromotionData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载推广数据
  async loadPromotionData() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      // 并行加载推广码和统计数据
      const [promotionData, statsData] = await Promise.all([
        promotionService.getPromotionCode(),
        promotionService.getPromotionStats()
      ])
      
      this.setData({
        promotionCode: promotionData.promotionCode,
        qrCodeUrl: promotionData.qrCodeUrl,
        promotionRules: promotionData.promotionRules,
        promotionStats: statsData,
        loading: false
      })
      
      console.log('推广数据加载成功:', promotionData)
      
    } catch (error) {
      console.error('加载推广数据失败:', error)
      
      this.setData({ loading: false })
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  // 保存推广码到相册
  async onSaveQRCode() {
    if (!this.data.qrCodeUrl) {
      wx.showToast({
        title: '推广码还未生成',
        icon: 'none'
      })
      return
    }

    if (this.data.saving) return
    
    this.setData({ saving: true })
    
    try {
      // 先下载图片到本地
      const downloadResult = await wx.downloadFile({
        url: this.data.qrCodeUrl
      })
      
      if (downloadResult.statusCode !== 200) {
        throw new Error('下载推广码失败')
      }
      
      // 保存到相册
      await wx.saveImageToPhotosAlbum({
        filePath: downloadResult.tempFilePath
      })
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('保存推广码失败:', error)
      
      if (error.errMsg && error.errMsg.includes('auth deny')) {
        // 权限被拒绝，引导用户开启权限
        wx.showModal({
          title: '需要相册权限',
          content: '保存推广码需要访问您的相册，请在设置中开启相册权限',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
      } else {
        wx.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        })
      }
    } finally {
      this.setData({ saving: false })
    }
  },

  // 复制推广码
  onCopyCode() {
    if (!this.data.promotionCode) {
      wx.showToast({
        title: '推广码还未生成',
        icon: 'none'
      })
      return
    }
    
    wx.setClipboardData({
      data: this.data.promotionCode,
      success: () => {
        wx.showToast({
          title: '推广码已复制',
          icon: 'success'
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        })
      }
    })
  },

  // 分享推广码
  onSharePromotion() {
    // 微信小程序分享功能
    return {
      title: '智慧共享菜园 - 邀请您一起体验',
      path: `/pages/index/index?promotionCode=${this.data.promotionCode}`,
      imageUrl: this.data.qrCodeUrl || '/images/share-cover.png'
    }
  },

  // 查看推广规则
  onViewRules() {
    wx.showModal({
      title: '推广规则',
      content: this.data.promotionRules || '邀请好友注册并下单，您可获得积分奖励。具体规则请咨询客服。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 角色选择入口
  onRoleSelect() {
    wx.navigateTo({
      url: '/pages/role-select/role-select'
    })
  },

  // 联系客服
  onContactService() {
    wx.showActionSheet({
      itemList: ['拨打客服电话', '复制客服微信'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 拨打电话
          wx.makePhoneCall({
            phoneNumber: '400-123-4567',
            fail: () => {
              wx.showToast({
                title: '拨号失败',
                icon: 'none'
              })
            }
          })
        } else if (res.tapIndex === 1) {
          // 复制微信号
          wx.setClipboardData({
            data: 'smartgarden2024',
            success: () => {
              wx.showToast({
                title: '客服微信已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 查看邀请记录
  onViewInviteHistory() {
    wx.showModal({
      title: '邀请记录',
      content: '原型版暂不支持查看详细邀请记录，正式版将提供完整的邀请历史和奖励明细。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 生成推广海报
  async onGeneratePoster() {
    wx.showLoading({
      title: '生成中...'
    })
    
    try {
      // 这里可以调用后端API生成个性化推广海报
      // 原型版使用简单的提示
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      wx.hideLoading()
      
      wx.showModal({
        title: '推广海报',
        content: '原型版暂不支持生成个性化推广海报，正式版将提供多种精美海报模板。',
        showCancel: false,
        confirmText: '我知道了'
      })
      
    } catch (error) {
      wx.hideLoading()
      
      wx.showToast({
        title: '生成失败',
        icon: 'none'
      })
    }
  },

  // 页面分享
  onShareAppMessage() {
    return this.onSharePromotion()
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '智慧共享菜园 - 足不出户管控菜园',
      query: `promotionCode=${this.data.promotionCode}`,
      imageUrl: this.data.qrCodeUrl || '/images/share-cover.png'
    }
  }
})