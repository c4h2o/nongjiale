// routes/users.js - 用户路由
const express = require('express')
const { getDB } = require('../config/database')
const Response = require('../utils/response')
const logger = require('../utils/logger')

const router = express.Router()

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId
    const db = getDB()

    // 获取用户基本信息
    const [users] = await db.execute(
      'SELECT id, nickname, avatar_url, promotion_code, created_at FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return Response.notFound(res, '用户不存在')
    }

    const user = users[0]

    // 获取绑定的菜园
    const [gardens] = await db.execute(`
      SELECT g.id, g.name, g.location, g.area, g.status, ug.bind_time
      FROM user_gardens ug
      JOIN gardens g ON ug.garden_id = g.id
      WHERE ug.user_id = ? AND ug.status = 'active'
      ORDER BY ug.bind_time DESC
    `, [userId])

    // 获取最近订单
    const [recentOrders] = await db.execute(`
      SELECT o.id, o.order_no, s.name as service_name, o.appointment_date, o.status, o.created_at
      FROM orders o
      JOIN services s ON o.service_id = s.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
      LIMIT 5
    `, [userId])

    const responseData = {
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        promotionCode: user.promotion_code,
        gardenCount: gardens.length,
        orderCount: recentOrders.length,
        createdAt: user.created_at
      },
      gardens: gardens.map(garden => ({
        id: garden.id,
        name: garden.name,
        location: garden.location,
        area: garden.area,
        status: garden.status,
        bindTime: garden.bind_time
      })),
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNo: order.order_no,
        serviceName: order.service_name,
        appointmentDate: order.appointment_date,
        status: order.status,
        createdAt: order.created_at
      }))
    }

    Response.success(res, responseData, '获取用户信息成功')
    
  } catch (error) {
    logger.error('获取用户信息错误:', error)
    Response.serverError(res, '获取用户信息失败')
  }
})

module.exports = router