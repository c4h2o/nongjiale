// pages/orders/orders.js
const orderService = require('../../services/order')

Page({
  data: {
    orders: {
      pending: [],
      confirmed: [],
      completed: [],
      cancelled: []
    },
    activeTab: 'pending',
    loading: false,
    refreshing: false,
    isEmpty: false
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '我的订单'
    })
    this.loadOrders()
  },

  onShow() {
    // 从其他页面返回时刷新订单列表
    this.loadOrders()
  },

  onPullDownRefresh() {
    this.refreshOrders()
  },

  // 加载订单列表
  async loadOrders() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const result = await orderService.getOrderList()
      
      const isEmpty = Object.values(result.orders).every(arr => arr.length === 0)
      
      this.setData({
        orders: result.orders,
        isEmpty,
        loading: false
      })
      
    } catch (error) {
      console.error('加载订单列表失败:', error)
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
      
      this.setData({ loading: false })
    }
  },

  // 刷新订单列表
  async refreshOrders() {
    this.setData({ refreshing: true })
    
    try {
      await this.loadOrders()
      
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      })
      
    } catch (error) {
      console.error('刷新订单失败:', error)
    } finally {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    }
  },

  // 切换标签页
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab
    })
  },

  // 查看订单详情
  onOrderDetail(e) {
    const orderId = e.currentTarget.dataset.orderId
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${orderId}`
    })
  },

  // 取消订单
  async onCancelOrder(e) {
    const orderId = e.currentTarget.dataset.orderId
    
    const result = await wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？取消后无法恢复。',
      confirmText: '确认取消',
      cancelText: '我再想想'
    })
    
    if (!result.confirm) return
    
    wx.showLoading({
      title: '取消中...'
    })
    
    try {
      await orderService.cancelOrder(orderId)
      
      wx.hideLoading()
      wx.showToast({
        title: '订单已取消',
        icon: 'success'
      })
      
      // 刷新订单列表
      this.loadOrders()
      
    } catch (error) {
      console.error('取消订单失败:', error)
      
      wx.hideLoading()
      wx.showToast({
        title: error.message || '取消失败',
        icon: 'none'
      })
    }
  },

  // 重新预约（复制订单信息）
  onReorder(e) {
    const order = e.currentTarget.dataset.order
    
    wx.navigateTo({
      url: `/pages/service-book/service-book?serviceId=${order.serviceId}&serviceName=${encodeURIComponent(order.serviceName)}&reorder=1`
    })
  },

  // 联系客服
  onContactService() {
    wx.showModal({
      title: '联系客服',
      content: '客服电话：400-123-4567\n工作时间：9:00-18:00',
      showCancel: false,
      confirmText: '我知道了'
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

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}-${day}`
  },

  // 格式化价格
  formatPrice(price) {
    return `¥${price.toFixed(2)}`
  },

  // 获取当前标签页的订单列表
  getCurrentOrders() {
    return this.data.orders[this.data.activeTab] || []
  }
})