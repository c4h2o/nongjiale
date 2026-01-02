// pages/service-book/service-book.js
const orderService = require('../../services/order')
const { getNext7Days, validatePhone } = require('../../utils/util')

Page({
  data: {
    serviceId: '',
    serviceName: '',
    serviceInfo: null,
    formData: {
      appointmentDate: '',
      contactName: '',
      contactPhone: '',
      remarks: ''
    },
    dateOptions: [],
    loading: false,
    submitting: false
  },

  onLoad(options) {
    const { serviceId, serviceName } = options
    
    if (!serviceId) {
      wx.showToast({
        title: '服务ID不能为空',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
      return
    }

    this.setData({
      serviceId,
      serviceName: decodeURIComponent(serviceName || '服务预约')
    })

    wx.setNavigationBarTitle({
      title: decodeURIComponent(serviceName || '服务预约')
    })

    this.initPage()
  },

  // 初始化页面
  async initPage() {
    try {
      this.setData({ loading: true })
      
      // 生成日期选项
      const dateOptions = getNext7Days()
      this.setData({
        dateOptions,
        'formData.appointmentDate': dateOptions[0].value // 默认选择今天
      })
      
      // 加载服务详情
      await this.loadServiceInfo()
      
      this.setData({ loading: false })
      
    } catch (error) {
      console.error('初始化页面失败:', error)
      this.setData({ loading: false })
    }
  },

  // 加载服务详情
  async loadServiceInfo() {
    try {
      const result = await orderService.getServiceList()
      const service = result.services.find(s => s.id === this.data.serviceId)
      
      if (service) {
        this.setData({
          serviceInfo: service
        })
      } else {
        wx.showToast({
          title: '服务不存在',
          icon: 'none'
        })
      }
      
    } catch (error) {
      console.error('加载服务详情失败:', error)
    }
  },

  // 日期选择
  onDateSelect(e) {
    const date = e.currentTarget.dataset.date
    this.setData({
      'formData.appointmentDate': date
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

  // 备注输入
  onRemarksInput(e) {
    this.setData({
      'formData.remarks': e.detail.value
    })
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data
    
    if (!formData.appointmentDate) {
      wx.showToast({
        title: '请选择预约日期',
        icon: 'none'
      })
      return false
    }
    
    if (!formData.contactName.trim()) {
      wx.showToast({
        title: '请输入联系人姓名',
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
    
    return true
  },

  // 提交订单
  async handleSubmitOrder() {
    if (!this.validateForm()) {
      return
    }
    
    if (this.data.submitting) return
    
    this.setData({ submitting: true })
    
    try {
      const orderData = {
        serviceId: this.data.serviceId,
        appointmentDate: this.data.formData.appointmentDate,
        contactName: this.data.formData.contactName.trim(),
        contactPhone: this.data.formData.contactPhone.trim(),
        remarks: this.data.formData.remarks.trim()
      }
      
      console.log('提交订单数据:', orderData)
      
      const result = await orderService.createOrder(orderData)
      
      wx.showToast({
        title: '预约成功',
        icon: 'success'
      })
      
      // 跳转到订单详情页
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order-detail/order-detail?orderId=${result.orderId}`
        })
      }, 1500)
      
    } catch (error) {
      console.error('提交订单失败:', error)
      
      wx.showToast({
        title: error.message || '预约失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 模拟支付
  handlePayment() {
    wx.showModal({
      title: '支付提示',
      content: '原型版暂支持线下支付，订单已提交成功。正式版将支持微信支付。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 获取日期显示文本
  getDateLabel(date) {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    const targetDate = new Date(date)
    
    if (targetDate.toDateString() === today.toDateString()) {
      return '今天'
    } else if (targetDate.toDateString() === tomorrow.toDateString()) {
      return '明天'
    } else {
      return date
    }
  },

  // 格式化价格
  formatPrice(price) {
    return `¥${price.toFixed(2)}`
  }
})