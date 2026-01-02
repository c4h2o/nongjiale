// pages/application/application.js
const promotionService = require('../../services/promotion')
const { validatePhone } = require('../../utils/util')

Page({
  data: {
    formData: {
      contactName: '',
      contactPhone: '',
      landArea: '',
      location: ''
    },
    submitting: false,
    regions: [
      '北京市',
      '上海市',
      '广州市',
      '深圳市',
      '杭州市',
      '南京市',
      '成都市',
      '武汉市',
      '西安市',
      '其他地区'
    ],
    showRegionPicker: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '入驻申请'
    })
  },

  // 联系人输入
  onContactNameInput(e) {
    this.setData({
      'formData.contactName': e.detail.value
    })
  },

  // 电话输入
  onContactPhoneInput(e) {
    this.setData({
      'formData.contactPhone': e.detail.value
    })
  },

  // 用地面积输入
  onLandAreaInput(e) {
    this.setData({
      'formData.landArea': e.detail.value
    })
  },

  // 地区选择
  onLocationTap() {
    this.setData({
      showRegionPicker: true
    })
  },

  // 地区选择确认
  onRegionChange(e) {
    const index = e.detail.value
    this.setData({
      'formData.location': this.data.regions[index],
      showRegionPicker: false
    })
  },

  // 地区选择取消
  onRegionCancel() {
    this.setData({
      showRegionPicker: false
    })
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data
    
    if (!formData.contactName.trim()) {
      wx.showToast({
        title: '请输入联系人姓名',
        icon: 'none'
      })
      return false
    }
    
    if (formData.contactName.trim().length < 2) {
      wx.showToast({
        title: '联系人姓名至少2个字符',
        icon: 'none'
      })
      return false
    }
    
    if (!formData.contactPhone.trim()) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      })
      return false
    }
    
    if (!validatePhone(formData.contactPhone)) {
      wx.showToast({
        title: '请输入正确的手机号格式',
        icon: 'none'
      })
      return false
    }
    
    if (!formData.landArea.trim()) {
      wx.showToast({
        title: '请输入用地面积',
        icon: 'none'
      })
      return false
    }
    
    const area = parseFloat(formData.landArea)
    if (isNaN(area) || area <= 0) {
      wx.showToast({
        title: '请输入有效的用地面积',
        icon: 'none'
      })
      return false
    }
    
    if (area > 10000) {
      wx.showToast({
        title: '用地面积不能超过10000平方米',
        icon: 'none'
      })
      return false
    }
    
    if (!formData.location.trim()) {
      wx.showToast({
        title: '请选择所在地区',
        icon: 'none'
      })
      return false
    }
    
    return true
  },

  // 提交申请
  async onSubmitApplication() {
    if (!this.validateForm()) {
      return
    }
    
    if (this.data.submitting) return
    
    this.setData({ submitting: true })
    
    try {
      const applicationData = {
        contactName: this.data.formData.contactName.trim(),
        contactPhone: this.data.formData.contactPhone.trim(),
        landArea: parseFloat(this.data.formData.landArea),
        location: this.data.formData.location.trim()
      }
      
      console.log('提交入驻申请:', applicationData)
      
      const result = await promotionService.submitApplication(applicationData)
      
      // 显示成功提示
      wx.showModal({
        title: '申请提交成功',
        content: result.message || '提交成功，3个工作日内联系',
        showCancel: false,
        confirmText: '我知道了',
        success: () => {
          // 清空表单
          this.setData({
            formData: {
              contactName: '',
              contactPhone: '',
              landArea: '',
              location: ''
            }
          })
          
          // 返回上一页或跳转到首页
          setTimeout(() => {
            const pages = getCurrentPages()
            if (pages.length > 1) {
              wx.navigateBack()
            } else {
              wx.switchTab({
                url: '/pages/index/index'
              })
            }
          }, 1000)
        }
      })
      
    } catch (error) {
      console.error('提交入驻申请失败:', error)
      
      wx.showToast({
        title: error.message || '提交失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 联系客服
  onContactService() {
    wx.showActionSheet({
      itemList: ['拨打客服电话', '复制客服微信', '查看入驻指南'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
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
            break
          case 1:
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
            break
          case 2:
            // 查看入驻指南
            this.showGuide()
            break
        }
      }
    })
  },

  // 显示入驻指南
  showGuide() {
    wx.showModal({
      title: '入驻指南',
      content: '1. 填写完整的申请信息\n2. 客服3个工作日内联系\n3. 实地考察评估\n4. 签署合作协议\n5. 开始运营合作\n\n如有疑问请联系客服详细咨询。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 查看合作案例
  onViewCases() {
    wx.showModal({
      title: '合作案例',
      content: '原型版暂不提供详细案例展示，正式版将提供丰富的合作案例和成功故事供您参考。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 重置表单
  onResetForm() {
    wx.showModal({
      title: '重置表单',
      content: '确定要清空所有已填写的信息吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            formData: {
              contactName: '',
              contactPhone: '',
              landArea: '',
              location: ''
            }
          })
          
          wx.showToast({
            title: '表单已重置',
            icon: 'success'
          })
        }
      }
    })
  },

  // 格式化面积显示
  formatArea(area) {
    if (!area) return ''
    const num = parseFloat(area)
    if (isNaN(num)) return area
    return num.toFixed(1)
  }
})