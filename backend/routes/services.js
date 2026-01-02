// routes/services.js - 服务路由
const express = require('express')
const { getDB } = require('../config/database')
const Response = require('../utils/response')
const logger = require('../utils/logger')

const router = express.Router()

// 获取服务列表
router.get('/list', async (req, res) => {
  try {
    const db = getDB()

    const [services] = await db.execute(`
      SELECT id, name, description, price, service_range, booking_notice
      FROM services 
      WHERE status = 'active'
      ORDER BY created_at ASC
    `)

    const responseData = {
      services: services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        serviceRange: service.service_range,
        bookingNotice: service.booking_notice
      }))
    }

    Response.success(res, responseData, '获取服务列表成功')
    
  } catch (error) {
    logger.error('获取服务列表错误:', error)
    Response.serverError(res, '获取服务列表失败')
  }
})

module.exports = router