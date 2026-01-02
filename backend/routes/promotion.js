// routes/promotion.js - 推广路由
const express = require('express')
const { getDB } = require('../config/database')
const Response = require('../utils/response')
const logger = require('../utils/logger')

const router = express.Router()

// 获取推广码
router.get('/code', async (req, res) => {
  try {
    const userId = req.user.userId
    const db = getDB()

    const [users] = await db.execute(
      'SELECT promotion_code FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return Response.notFound(res, '用户不存在')
    }

    const user = users[0]

    // 生成二维码URL（原型版使用模拟地址）
    const qrCodeUrl = `https://demo-qr.example.com/promotion/${user.promotion_code}.png`

    const responseData = {
      promotionCode: user.promotion_code,
      qrCodeUrl,
      promotionRules: '邀请好友注册并下单，您可获得积分奖励。每成功邀请1人可获得10积分，被邀请人首单可享受9折优惠。'
    }

    Response.success(res, responseData, '获取推广码成功')
    
  } catch (error) {
    logger.error('获取推广码错误:', error)
    Response.serverError(res, '获取推广码失败')
  }
})

// 角色选择
router.post('/role-select', async (req, res) => {
  try {
    const { role } = req.body

    if (!role || !['provider', 'consumer'].includes(role)) {
      return Response.error(res, '无效的角色类型')
    }

    let redirectUrl = ''

    if (role === 'provider') {
      // B端用户跳转到入驻申请表单
      redirectUrl = '/pages/application/application'
    } else {
      // C端用户跳转到服务下单页面
      redirectUrl = '/pages/services/services'
    }

    Response.success(res, { redirectUrl }, '角色选择成功')
    
  } catch (error) {
    logger.error('角色选择错误:', error)
    Response.serverError(res, '角色选择失败')
  }
})

// 获取推广数据
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.userId
    const db = getDB()

    // 获取邀请人数
    const [inviteCount] = await db.execute(
      'SELECT COUNT(*) as count FROM promotions WHERE promoter_id = ?',
      [userId]
    )

    // 获取推广订单数
    const [orderCount] = await db.execute(
      'SELECT COUNT(*) as count FROM promotions WHERE promoter_id = ? AND status = "completed"',
      [userId]
    )

    // 原型版使用静态占位数据
    const responseData = {
      inviteCount: inviteCount[0]?.count || 0,
      orderCount: orderCount[0]?.count || 0
    }

    Response.success(res, responseData, '获取推广数据成功')
    
  } catch (error) {
    logger.error('获取推广数据错误:', error)
    Response.serverError(res, '获取推广数据失败')
  }
})

module.exports = router