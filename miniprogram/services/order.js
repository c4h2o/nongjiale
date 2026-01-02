// 订单服务
const request = require('../utils/request')

class OrderService {
  // 获取服务列表
  async getServiceList() {
    try {
      const response = await request.get('/services/list')
      return response.data
    } catch (error) {
      console.error('获取服务列表失败:', error)
      throw error
    }
  }

  // 创建订单
  async createOrder(orderData) {
    try {
      const response = await request.post('/orders/create', orderData)
      return response.data
    } catch (error) {
      console.error('创建订单失败:', error)
      throw error
    }
  }

  // 获取订单列表
  async getOrderList() {
    try {
      const response = await request.get('/orders/list')
      return response.data
    } catch (error) {
      console.error('获取订单列表失败:', error)
      throw error
    }
  }

  // 获取订单详情
  async getOrderDetail(orderId) {
    try {
      const response = await request.get(`/orders/${orderId}`)
      return response.data
    } catch (error) {
      console.error('获取订单详情失败:', error)
      throw error
    }
  }

  // 取消订单
  async cancelOrder(orderId) {
    try {
      const response = await request.put(`/orders/${orderId}/cancel`)
      return response.data
    } catch (error) {
      console.error('取消订单失败:', error)
      throw error
    }
  }
}

module.exports = new OrderService()