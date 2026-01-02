// routes/auth.js - 认证路由
const express = require('express')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid')
const { getDB } = require('../config/database')
const Response = require('../utils/response')
const logger = require('../utils/logger')

const router = express.Router()

// 生成推广码
function generatePromotionCode(userId) {
  const prefix = 'SG'
  const timestamp = Date.now().toString(36).toUpperCase()
  const userHash = userId.substr(-4).toUpperCase()
  return `${prefix}${timestamp}${userHash}`
}

// 微信登录
router.post('/wechat-login', async (req, res) => {
  try {
    const { code, userInfo } = req.body

    if (!code) {
      return Response.error(res, '缺少微信授权码')
    }

    logger.info('微信登录请求:', { code: code.substr(0, 10) + '...', hasUserInfo: !!userInfo })

    let openid, session_key

    // 调用微信API获取openid
    try {
      const wechatResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
        params: {
          appid: process.env.WECHAT_APP_ID,
          secret: process.env.WECHAT_APP_SECRET,
          js_code: code,
          grant_type: 'authorization_code'
        },
        timeout: 10000
      })

      const wechatData = wechatResponse.data
      logger.info('微信API响应:', wechatData)

      if (wechatData.errcode) {
        logger.error('微信API错误:', wechatData)
        return Response.error(res, `微信登录失败: ${wechatData.errmsg}`)
      }

      openid = wechatData.openid
      session_key = wechatData.session_key

      if (!openid) {
        logger.error('微信API未返回openid:', wechatData)
        return Response.error(res, '微信登录失败，请重试')
      }
    } catch (wechatError) {
      logger.error('调用微信API失败:', wechatError)
      return Response.error(res, '微信服务暂时不可用，请稍后重试')
    }

    const db = getDB()
    
    // 查找或创建用户
    let [users] = await db.execute(
      'SELECT * FROM users WHERE wechat_openid = ?',
      [openid]
    )

    let user
    let isFirstLogin = false

    if (users.length === 0) {
      // 创建新用户
      const userId = uuidv4()
      const promotionCode = generatePromotionCode(userId)
      
      const nickname = userInfo?.nickName || '微信用户'
      const avatarUrl = userInfo?.avatarUrl || ''
      
      await db.execute(
        `INSERT INTO users (id, wechat_openid, nickname, avatar_url, promotion_code) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, openid, nickname, avatarUrl, promotionCode]
      )

      user = {
        id: userId,
        wechat_openid: openid,
        nickname: nickname,
        avatar_url: avatarUrl,
        promotion_code: promotionCode,
        created_at: new Date()
      }
      
      isFirstLogin = true
      logger.info(`新用户注册成功: ${userId}, nickname: ${nickname}`)
    } else {
      user = users[0]
      
      // 更新用户信息（如果有新的头像或昵称）
      if (userInfo && (userInfo.nickName || userInfo.avatarUrl)) {
        const newNickname = userInfo.nickName || user.nickname
        const newAvatarUrl = userInfo.avatarUrl || user.avatar_url
        
        await db.execute(
          'UPDATE users SET nickname = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newNickname, newAvatarUrl, user.id]
        )
        
        user.nickname = newNickname
        user.avatar_url = newAvatarUrl
        
        logger.info(`用户信息更新: ${user.id}, nickname: ${newNickname}`)
      }
      
      logger.info(`用户登录: ${user.id}, nickname: ${user.nickname}`)
    }

    // 生成JWT token
    const tokenPayload = { 
      userId: user.id,
      openid: user.wechat_openid,
      iat: Math.floor(Date.now() / 1000)
    }
    
    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    // 返回用户信息
    const responseData = {
      token,
      userInfo: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        promotionCode: user.promotion_code
      },
      isFirstLogin
    }

    logger.info(`登录成功: ${user.id}, isFirstLogin: ${isFirstLogin}`)
    Response.success(res, responseData, '登录成功')
    
  } catch (error) {
    logger.error('微信登录错误:', error)
    
    // 数据库错误
    if (error.code && error.code.startsWith('ER_')) {
      return Response.serverError(res, '数据库错误，请稍后重试')
    }
    
    // JWT错误
    if (error.name === 'JsonWebTokenError') {
      return Response.serverError(res, 'Token生成失败')
    }
    
    Response.serverError(res, '登录失败，请重试')
  }
})

// 刷新token（可选功能）
router.post('/refresh-token', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return Response.unauthorized(res, '缺少访问令牌')
    }

    // 验证旧token（允许过期）
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true })
    } catch (error) {
      return Response.unauthorized(res, 'Token无效')
    }

    // 检查用户是否存在
    const db = getDB()
    const [users] = await db.execute(
      'SELECT id, wechat_openid FROM users WHERE id = ?',
      [decoded.userId]
    )

    if (users.length === 0) {
      return Response.unauthorized(res, '用户不存在')
    }

    // 生成新token
    const newToken = jwt.sign(
      { 
        userId: decoded.userId,
        openid: decoded.openid,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    Response.success(res, { token: newToken }, 'Token刷新成功')
    
  } catch (error) {
    logger.error('刷新Token错误:', error)
    Response.serverError(res, 'Token刷新失败')
  }
})

module.exports = router