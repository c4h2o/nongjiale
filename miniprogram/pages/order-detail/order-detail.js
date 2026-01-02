// pages/order-detail/order-detail.js
const orderService = require('../../services/order')

Page({
  data: {
    orderId: '',
    orderInfo: null,
    loading: false,
    cancelling: false
  },

  onLoad(options) {
    const { orderId } = options
    
    if (!orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 2000)
      return
    }

    this.setData({ orderId })
    this.loadOrderDetail()
  },

  onShow() {
    // 从其他页面返回时刷新订单详情
    if (this.data.orderId) {
      this.loadOrderDetail()
    }
  },

  onPullDownRefresh() {
    this.loadOrderDetail().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载订单详情
  async loadOrderDetail() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const orderInfo = await orderService.getOrderDetail(this.data.orderId)
      
      this.setData({
        orderInfo,
        loading: false
      })
      
      // 更新导航栏标题
      wx.setNavigationBarTitle({
        title: `订单详情 - ${orderInfo.orderNo.slice(-6)}`
      })
      
    } catch (error) {
      console.error('加载订单详情失败:', error)
      
      this.setData({ loading: false })
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
      
      // 如果订单不存在，返回上一页
      if (error.message && error.message.includes('不存在')) {
        setTimeout(() => {
          wx.navigateBack()
        }, 2000)
      }
    }
  },

  // 取消订单
  async onCancelOrder() {
    const result = await wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？取消后无法恢复。',
      confirmText: '确认取消',
      cancelText: '我再想想'
    })
    
    if (!result.confirm) return
    
    this.setData({ cancelling: true })
    
    try {
      await orderService.cancelOrder(this.data.orderId)
      
      wx.showToast({
        title: '订单已取消',
        icon: 'success'
      })
      
      // 刷新订单详情
      this.loadOrderDetail()
      
    } catch (error) {
      console.error('取消订单失败:', error)
      
      wx.showToast({
        title: error.message || '取消失败',
        icon: 'none'
      })
    } finally {
      this.setData({ cancelling: false })
    }
  },

  // 重新预约
  onReorder() {
    const { orderInfo } = this.data
    
    wx.navigateTo({
      url: `/pages/service-book/service-book?serviceId=${orderInfo.serviceId}&serviceName=${encodeURIComponent(orderInfo.serviceName)}&reorder=1`
    })
  },

  // 联系客服
  onContactService() {
    wx.showActionSheet({
      itemList: ['拨打客服电话', '复制订单号'],
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
          // 复制订单号
          wx.setClipboardData({
            data: this.data.orderInfo.orderNo,
            success: () => {
              wx.showToast({
                title: '订单号已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 查看服务详情
  onServiceDetail() {
    wx.navigateTo({
      url: '/pages/services/services'
    })
  },

  // 获取状态显示文本
  getStatusText(status) {
    const statusMap = {
      pending: '待确认',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消'
    }
    return statusMap[status] || status
  },

  // 获取状态样式类
  getStatusClass(status) {
    const classMap = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    }
    return classMap[status] || ''
  },

  // 格式化日期时间
  formatDateTime(dateStr) {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    
    return `${year}-${month}-${day}`
  },

  // 格式化价格
  formatPrice(price) {
    return `¥${price.toFixed(2)}`
  },

  // 获取状态描述
  getStatusDescription(status) {
    const descriptions = {
      pending: '您的预约申请已提交，客服将在24小时内联系您确认服务时间和具体安排。',
      confirmed: '您的预约已确认，服务人员将按时为您提供服务。如需调整请及时联系客服。',
      completed: '服务已完成，感谢您的使用。如有问题请联系客服或重新预约。',
      cancelled: '订单已取消。如需重新预约，请点击下方"重新预约"按钮。'
    }
    return descriptions[status] || ''
  }
})