// routes/gardens.js - 菜园路由
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { getDB } = require('../config/database')
const Response = require('../utils/response')
const logger = require('../utils/logger')

const router = express.Router()

// 绑定菜园
router.post('/bind', async (req, res) => {
  try {
    const userId = req.user.userId
    const { gardenId } = req.body

    if (!gardenId) {
      return Response.error(res, '请输入菜园ID')
    }

    // 验证菜园ID格式 (GD + 8位数字)
    if (!/^GD\d{8}$/.test(gardenId)) {
      return Response.error(res, '菜园ID格式不正确')
    }

    const db = getDB()

    // 检查菜园是否存在
    const [gardens] = await db.execute(
      'SELECT * FROM gardens WHERE id = ?',
      [gardenId]
    )

    if (gardens.length === 0) {
      return Response.error(res, '菜园不存在')
    }

    const garden = gardens[0]

    // 检查是否已经绑定
    const [existingBinds] = await db.execute(
      'SELECT * FROM user_gardens WHERE user_id = ? AND garden_id = ? AND status = "active"',
      [userId, gardenId]
    )

    if (existingBinds.length > 0) {
      return Response.error(res, '该菜园已绑定，无需重复操作')
    }

    // 创建绑定记录
    const bindId = uuidv4()
    await db.execute(
      'INSERT INTO user_gardens (id, user_id, garden_id, status) VALUES (?, ?, ?, "active")',
      [bindId, userId, gardenId]
    )

    const responseData = {
      id: garden.id,
      name: garden.name,
      location: garden.location,
      area: garden.area,
      bindTime: new Date().toISOString(),
      status: garden.status
    }

    Response.success(res, responseData, '菜园绑定成功')
    
  } catch (error) {
    logger.error('绑定菜园错误:', error)
    Response.serverError(res, '绑定菜园失败')
  }
})

// 解绑菜园
router.delete('/:id/unbind', async (req, res) => {
  try {
    const userId = req.user.userId
    const gardenId = req.params.id
    const db = getDB()

    // 检查绑定关系是否存在
    const [binds] = await db.execute(
      'SELECT * FROM user_gardens WHERE user_id = ? AND garden_id = ? AND status = "active"',
      [userId, gardenId]
    )

    if (binds.length === 0) {
      return Response.error(res, '未找到绑定关系')
    }

    // 更新绑定状态为inactive
    await db.execute(
      'UPDATE user_gardens SET status = "inactive" WHERE user_id = ? AND garden_id = ?',
      [userId, gardenId]
    )

    Response.success(res, null, '菜园解绑成功')
    
  } catch (error) {
    logger.error('解绑菜园错误:', error)
    Response.serverError(res, '解绑菜园失败')
  }
})

// 获取菜园列表
router.get('/list', async (req, res) => {
  try {
    const userId = req.user.userId
    const db = getDB()

    const [gardens] = await db.execute(`
      SELECT g.id, g.name, g.location, g.area, g.description, g.status, ug.bind_time
      FROM user_gardens ug
      JOIN gardens g ON ug.garden_id = g.id
      WHERE ug.user_id = ? AND ug.status = 'active'
      ORDER BY ug.bind_time DESC
    `, [userId])

    const responseData = {
      gardens: gardens.map(garden => ({
        id: garden.id,
        name: garden.name,
        location: garden.location,
        area: garden.area,
        description: garden.description,
        status: garden.status,
        bindTime: garden.bind_time
      })),
      totalCount: gardens.length
    }

    Response.success(res, responseData, '获取菜园列表成功')
    
  } catch (error) {
    logger.error('获取菜园列表错误:', error)
    Response.serverError(res, '获取菜园列表失败')
  }
})

// 获取实时视频流
router.get('/:id/stream', async (req, res) => {
  try {
    const userId = req.user.userId
    const gardenId = req.params.id
    const db = getDB()

    // 检查用户是否有权限访问该菜园
    const [binds] = await db.execute(
      'SELECT * FROM user_gardens WHERE user_id = ? AND garden_id = ? AND status = "active"',
      [userId, gardenId]
    )

    if (binds.length === 0) {
      return Response.forbidden(res, '无权限访问该菜园')
    }

    // 获取菜园摄像头信息
    const [gardens] = await db.execute(
      'SELECT camera_rtsp_url FROM gardens WHERE id = ?',
      [gardenId]
    )

    if (gardens.length === 0) {
      return Response.notFound(res, '菜园不存在')
    }

    const garden = gardens[0]

    // 原型版：返回模拟的视频流地址
    const responseData = {
      streamUrl: garden.camera_rtsp_url || 'https://demo-stream.example.com/garden/' + gardenId,
      protocol: 'HLS',
      resolution: '720P',
      maxDelay: 3
    }

    Response.success(res, responseData, '获取视频流成功')
    
  } catch (error) {
    logger.error('获取视频流错误:', error)
    Response.serverError(res, '获取视频流失败')
  }
})

module.exports = router