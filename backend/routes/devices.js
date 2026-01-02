// routes/devices.js - 设备控制路由
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const { getDB } = require('../config/database')
const { redisUtils } = require('../config/redis')
const Response = require('../utils/response')
const logger = require('../utils/logger')

const router = express.Router()

// 获取设备状态
router.get('/:gardenId/status', async (req, res) => {
  try {
    const userId = req.user.userId
    const gardenId = req.params.gardenId
    const db = getDB()

    // 检查用户权限
    const [binds] = await db.execute(
      'SELECT * FROM user_gardens WHERE user_id = ? AND garden_id = ? AND status = "active"',
      [userId, gardenId]
    )

    if (binds.length === 0) {
      return Response.forbidden(res, '无权限访问该菜园设备')
    }

    // 从Redis获取设备状态（原型版使用模拟数据）
    const irrigationKey = `irrigation:${gardenId}`
    const cameraKey = `camera:${gardenId}`

    let irrigationStatus = await redisUtils.get(irrigationKey)
    let cameraStatus = await redisUtils.get(cameraKey)

    // 如果Redis中没有数据，使用默认状态
    if (!irrigationStatus) {
      irrigationStatus = {
        status: 'idle',
        remainingTime: 0,
        lastOperation: null,
        cooldownRemaining: 0
      }
    }

    if (!cameraStatus) {
      cameraStatus = {
        status: 'online',
        streamUrl: `https://demo-stream.example.com/garden/${gardenId}`,
        resolution: '720P',
        delay: 2
      }
    }

    const responseData = {
      irrigation: irrigationStatus,
      camera: cameraStatus
    }

    Response.success(res, responseData, '获取设备状态成功')
    
  } catch (error) {
    logger.error('获取设备状态错误:', error)
    Response.serverError(res, '获取设备状态失败')
  }
})

// 控制灌溉设备
router.post('/irrigation/control', async (req, res) => {
  try {
    const userId = req.user.userId
    const { gardenId, action, duration = 10 } = req.body

    if (!gardenId || !action) {
      return Response.error(res, '缺少必要参数')
    }

    if (!['start', 'stop'].includes(action)) {
      return Response.error(res, '无效的操作类型')
    }

    if (![5, 10, 15].includes(duration)) {
      return Response.error(res, '无效的浇水时长')
    }

    const db = getDB()

    // 检查用户权限
    const [binds] = await db.execute(
      'SELECT * FROM user_gardens WHERE user_id = ? AND garden_id = ? AND status = "active"',
      [userId, gardenId]
    )

    if (binds.length === 0) {
      return Response.forbidden(res, '无权限控制该菜园设备')
    }

    const irrigationKey = `irrigation:${gardenId}`
    const cooldownKey = `irrigation:cooldown:${gardenId}`

    // 检查冷却时间
    const cooldownRemaining = await redisUtils.ttl(cooldownKey)
    if (cooldownRemaining > 0) {
      return Response.error(res, `浇水操作冷却中，请等待${cooldownRemaining}秒`, 429)
    }

    // 获取当前状态
    let currentStatus = await redisUtils.get(irrigationKey) || {
      status: 'idle',
      remainingTime: 0,
      lastOperation: null
    }

    let newStatus = { ...currentStatus }

    if (action === 'start') {
      if (currentStatus.status === 'running') {
        return Response.error(res, '设备正在运行中')
      }

      // 启动浇水
      newStatus = {
        status: 'running',
        remainingTime: duration * 60, // 转换为秒
        lastOperation: new Date().toISOString(),
        startTime: Date.now()
      }

      // 设置自动停止定时器（通过Redis过期时间模拟）
      await redisUtils.set(irrigationKey, newStatus, duration * 60)

      // 记录操作日志
      await db.execute(
        'INSERT INTO device_logs (id, garden_id, user_id, device_type, operation, parameters, result) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          gardenId,
          userId,
          'irrigation',
          'start',
          JSON.stringify({ duration }),
          'success'
        ]
      )

      logger.info(`用户 ${userId} 启动菜园 ${gardenId} 的灌溉设备，时长 ${duration} 分钟`)

    } else if (action === 'stop') {
      if (currentStatus.status !== 'running') {
        return Response.error(res, '设备未在运行中')
      }

      // 停止浇水
      newStatus = {
        status: 'idle',
        remainingTime: 0,
        lastOperation: new Date().toISOString()
      }

      await redisUtils.set(irrigationKey, newStatus, 3600) // 保存1小时

      // 设置冷却时间（30秒）
      await redisUtils.set(cooldownKey, 'cooling', 30)

      // 记录操作日志
      await db.execute(
        'INSERT INTO device_logs (id, garden_id, user_id, device_type, operation, parameters, result) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          uuidv4(),
          gardenId,
          userId,
          'irrigation',
          'stop',
          JSON.stringify({}),
          'success'
        ]
      )

      logger.info(`用户 ${userId} 停止菜园 ${gardenId} 的灌溉设备`)
    }

    // 获取冷却剩余时间
    const cooldownTime = action === 'stop' ? 30 : 0

    const responseData = {
      success: true,
      status: newStatus.status,
      remainingTime: newStatus.remainingTime,
      cooldownTime
    }

    Response.success(res, responseData, `灌溉设备${action === 'start' ? '启动' : '停止'}成功`)
    
  } catch (error) {
    logger.error('控制灌溉设备错误:', error)
    Response.serverError(res, '控制灌溉设备失败')
  }
})

// 摄像头截图
router.post('/camera/snapshot', async (req, res) => {
  try {
    const userId = req.user.userId
    const { gardenId } = req.body

    if (!gardenId) {
      return Response.error(res, '缺少菜园ID')
    }

    const db = getDB()

    // 检查用户权限
    const [binds] = await db.execute(
      'SELECT * FROM user_gardens WHERE user_id = ? AND garden_id = ? AND status = "active"',
      [userId, gardenId]
    )

    if (binds.length === 0) {
      return Response.forbidden(res, '无权限访问该菜园摄像头')
    }

    // 原型版：返回模拟的截图URL
    const snapshotUrl = `https://demo-snapshots.example.com/garden/${gardenId}/${Date.now()}.jpg`

    // 记录操作日志
    await db.execute(
      'INSERT INTO device_logs (id, garden_id, user_id, device_type, operation, parameters, result) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        uuidv4(),
        gardenId,
        userId,
        'camera',
        'snapshot',
        JSON.stringify({ timestamp: new Date().toISOString() }),
        'success'
      ]
    )

    const responseData = {
      success: true,
      snapshotUrl,
      savedLocal: true
    }

    Response.success(res, responseData, '截图成功')
    
  } catch (error) {
    logger.error('摄像头截图错误:', error)
    Response.serverError(res, '截图失败')
  }
})

module.exports = router