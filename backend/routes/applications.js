// routes/applications.js - 入驻申请路由
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { getDB } = require('../config/database')
const Response = require('../utils/response')
const logger = require('../utils/logger')

const router = express.Router()

// 提交入驻申请
router.post('/submit', async (req, res) => {
  try {
    const userId = req.user.userId
    const { contactName, contactPhone, landArea, location } = req.body

    // 参数验证
    if (!contactName || !contactPhone || !landArea || !location) {
      return Response.error(res, '请填写完整的申请信息')
    }

    // 验证联系人姓名
    if (contactName.trim().length < 2) {
      return Response.error(res, '联系人姓名至少2个字符')
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
      return Response.error(res, '请输入正确的手机号格式')
    }

    // 验证用地面积
    const area = parseFloat(landArea)
    if (isNaN(area) || area <= 0) {
      return Response.error(res, '请输入有效的用地面积')
    }

    if (area > 10000) {
      return Response.error(res, '用地面积不能超过10000平方米')
    }

    const db = getDB()

    // 检查是否已有待处理的申请
    const [existingApplications] = await db.execute(
      'SELECT * FROM applications WHERE user_id = ? AND status = "pending"',
      [userId]
    )

    if (existingApplications.length > 0) {
      return Response.error(res, '您已有待处理的申请，请耐心等待客服联系')
    }

    // 创建申请记录
    const applicationId = uuidv4()

    await db.execute(`
      INSERT INTO applications (id, user_id, contact_name, contact_phone, land_area, location, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [applicationId, userId, contactName.trim(), contactPhone.trim(), area, location.trim()])

    const responseData = {
      applicationId,
      message: '提交成功，3个工作日内联系'
    }

    Response.success(res, responseData, '申请提交成功')
    
  } catch (error) {
    logger.error('提交入驻申请错误:', error)
    Response.serverError(res, '提交申请失败')
  }
})

// 获取用户申请列表
router.get('/list', async (req, res) => {
  try {
    const userId = req.user.userId
    const db = getDB()

    const [applications] = await db.execute(`
      SELECT id, contact_name, contact_phone, land_area, location, status, created_at, updated_at
      FROM applications 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [userId])

    const responseData = {
      applications: applications.map(app => ({
        id: app.id,
        contactName: app.contact_name,
        contactPhone: app.contact_phone,
        landArea: app.land_area,
        location: app.location,
        status: app.status,
        createdAt: app.created_at,
        updatedAt: app.updated_at
      }))
    }

    Response.success(res, responseData, '获取申请列表成功')
    
  } catch (error) {
    logger.error('获取申请列表错误:', error)
    Response.serverError(res, '获取申请列表失败')
  }
})

// 获取申请详情
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.userId
    const applicationId = req.params.id
    const db = getDB()

    const [applications] = await db.execute(`
      SELECT id, contact_name, contact_phone, land_area, location, status, created_at, updated_at
      FROM applications 
      WHERE id = ? AND user_id = ?
    `, [applicationId, userId])

    if (applications.length === 0) {
      return Response.notFound(res, '申请不存在')
    }

    const application = applications[0]

    const responseData = {
      id: application.id,
      contactName: application.contact_name,
      contactPhone: application.contact_phone,
      landArea: application.land_area,
      location: application.location,
      status: application.status,
      createdAt: application.created_at,
      updatedAt: application.updated_at
    }

    Response.success(res, responseData, '获取申请详情成功')
    
  } catch (error) {
    logger.error('获取申请详情错误:', error)
    Response.serverError(res, '获取申请详情失败')
  }
})

// 取消申请（仅待处理状态）
router.put('/:id/cancel', async (req, res) => {
  try {
    const userId = req.user.userId
    const applicationId = req.params.id
    const db = getDB()

    // 检查申请是否存在且属于当前用户
    const [applications] = await db.execute(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [applicationId, userId]
    )

    if (applications.length === 0) {
      return Response.notFound(res, '申请不存在')
    }

    const application = applications[0]

    // 只有待处理状态的申请可以取消
    if (application.status !== 'pending') {
      return Response.error(res, '该申请状态不允许取消')
    }

    // 更新申请状态
    await db.execute(
      'UPDATE applications SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [applicationId]
    )

    Response.success(res, { success: true }, '申请取消成功')
    
  } catch (error) {
    logger.error('取消申请错误:', error)
    Response.serverError(res, '取消申请失败')
  }
})

module.exports = router