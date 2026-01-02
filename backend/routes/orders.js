// routes/orders.js - 订单路由
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { getDB } = require('../config/database')
const Response = require('../utils/response')
const logger = require('../utils/logger')

const router = express.Router()

// 生成订单编号
function generateOrderNo() {
  const timestamp = Date.now().toString()
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `SG${timestamp}${random}`
}

// 创建订单
router.post('/create', async (req, res) => {
  try {
    const userId = req.user.userId
    const { serviceId, appointmentDate, contactName, contactPhone, remarks } = req.body

    // 参数验证
    if (!serviceId || !appointmentDate || !contactName || !contactPhone) {
      return Response.error(res, '请填写完整的订单信息')
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
      return Response.error(res, '请输入正确的手机号格式')
    }

    // 验证预约日期（近7天内）
    const appointmentDateTime = new Date(appointmentDate)
    const today = new Date()
    const maxDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    if (appointmentDateTime < today || appointmentDateTime > maxDate) {
      return Response.error(res, '预约日期必须在近7天内')
    }

    const db = getDB()

    // 检查服务是否存在
    const [services] = await db.execute(
      'SELECT * FROM services WHERE id = ? AND status = "active"',
      [serviceId]
    )

    if (services.length === 0) {
      return Response.error(res, '服务不存在或已下架')
    }

    // 创建订单
    const orderId = uuidv4()
    const orderNo = generateOrderNo()

    await db.execute(`
      INSERT INTO orders (id, order_no, user_id, service_id, appointment_date, contact_name, contact_phone, remarks, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [orderId, orderNo, userId, serviceId, appointmentDate, contactName, contactPhone, remarks || ''])

    // 获取订单详情
    const [orders] = await db.execute(`
      SELECT o.*, s.name as service_name, s.price
      FROM orders o
      JOIN services s ON o.service_id = s.id
      WHERE o.id = ?
    `, [orderId])

    const order = orders[0]

    const responseData = {
      orderId: order.id,
      orderNo: order.order_no,
      order: {
        id: order.id,
        orderNo: order.order_no,
        serviceName: order.service_name,
        price: order.price,
        appointmentDate: order.appointment_date,
        contactName: order.contact_name,
        contactPhone: order.contact_phone,
        remarks: order.remarks,
        status: order.status,
        createdAt: order.created_at
      },
      paymentStatus: 'pending'
    }

    Response.success(res, responseData, '订单创建成功')
    
  } catch (error) {
    logger.error('创建订单错误:', error)
    Response.serverError(res, '创建订单失败')
  }
})

// 获取订单列表
router.get('/list', async (req, res) => {
  try {
    const userId = req.user.userId
    const db = getDB()

    const [orders] = await db.execute(`
      SELECT o.*, s.name as service_name, s.price
      FROM orders o
      JOIN services s ON o.service_id = s.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `, [userId])

    // 按状态分类订单
    const ordersByStatus = {
      pending: [],
      confirmed: [],
      completed: [],
      cancelled: []
    }

    orders.forEach(order => {
      const orderData = {
        id: order.id,
        orderNo: order.order_no,
        serviceName: order.service_name,
        price: order.price,
        appointmentDate: order.appointment_date,
        contactName: order.contact_name,
        contactPhone: order.contact_phone,
        remarks: order.remarks,
        status: order.status,
        createdAt: order.created_at
      }

      if (ordersByStatus[order.status]) {
        ordersByStatus[order.status].push(orderData)
      }
    })

    Response.success(res, { orders: ordersByStatus }, '获取订单列表成功')
    
  } catch (error) {
    logger.error('获取订单列表错误:', error)
    Response.serverError(res, '获取订单列表失败')
  }
})

// 获取订单详情
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.userId
    const orderId = req.params.id
    const db = getDB()

    const [orders] = await db.execute(`
      SELECT o.*, s.name as service_name, s.price, s.description, s.service_range
      FROM orders o
      JOIN services s ON o.service_id = s.id
      WHERE o.id = ? AND o.user_id = ?
    `, [orderId, userId])

    if (orders.length === 0) {
      return Response.notFound(res, '订单不存在')
    }

    const order = orders[0]

    const responseData = {
      id: order.id,
      orderNo: order.order_no,
      serviceName: order.service_name,
      serviceDescription: order.description,
      serviceRange: order.service_range,
      price: order.price,
      appointmentDate: order.appointment_date,
      contactName: order.contact_name,
      contactPhone: order.contact_phone,
      remarks: order.remarks,
      status: order.status,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }

    Response.success(res, responseData, '获取订单详情成功')
    
  } catch (error) {
    logger.error('获取订单详情错误:', error)
    Response.serverError(res, '获取订单详情失败')
  }
})

// 取消订单
router.put('/:id/cancel', async (req, res) => {
  try {
    const userId = req.user.userId
    const orderId = req.params.id
    const db = getDB()

    // 检查订单是否存在且属于当前用户
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    )

    if (orders.length === 0) {
      return Response.notFound(res, '订单不存在')
    }

    const order = orders[0]

    // 只有待确认状态的订单可以取消
    if (order.status !== 'pending') {
      return Response.error(res, '该订单状态不允许取消')
    }

    // 更新订单状态
    await db.execute(
      'UPDATE orders SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [orderId]
    )

    // 获取更新后的订单信息
    const [updatedOrders] = await db.execute(`
      SELECT o.*, s.name as service_name
      FROM orders o
      JOIN services s ON o.service_id = s.id
      WHERE o.id = ?
    `, [orderId])

    const updatedOrder = updatedOrders[0]

    const responseData = {
      id: updatedOrder.id,
      orderNo: updatedOrder.order_no,
      serviceName: updatedOrder.service_name,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updated_at
    }

    Response.success(res, responseData, '订单取消成功')
    
  } catch (error) {
    logger.error('取消订单错误:', error)
    Response.serverError(res, '取消订单失败')
  }
})

module.exports = router