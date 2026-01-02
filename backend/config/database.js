// config/database.js - 数据库配置
const mysql = require('mysql2/promise')
const logger = require('../utils/logger')

let connection = null

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_garden',
  charset: 'utf8mb4',
  timezone: '+08:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
}

// 连接数据库
async function connectDB() {
  try {
    connection = await mysql.createConnection(dbConfig)
    logger.info('MySQL数据库连接成功')
    
    // 创建数据库表
    await createTables()
    
    return connection
  } catch (error) {
    logger.error('数据库连接失败:', error)
    throw error
  }
}

// 创建数据库表
async function createTables() {
  try {
    // 用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        wechat_openid VARCHAR(100) UNIQUE NOT NULL,
        nickname VARCHAR(100),
        avatar_url VARCHAR(500),
        promotion_code VARCHAR(20) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_openid (wechat_openid),
        INDEX idx_promotion_code (promotion_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 菜园表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gardens (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(200),
        area DECIMAL(10,2),
        description TEXT,
        camera_rtsp_url VARCHAR(500),
        irrigation_device_id VARCHAR(100),
        status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 用户菜园绑定表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_gardens (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        garden_id VARCHAR(36) NOT NULL,
        bind_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('active', 'inactive') DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_garden (user_id, garden_id),
        INDEX idx_user_id (user_id),
        INDEX idx_garden_id (garden_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 服务表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        service_range VARCHAR(200),
        booking_notice TEXT,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 订单表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(36) PRIMARY KEY,
        order_no VARCHAR(32) UNIQUE NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        service_id VARCHAR(36) NOT NULL,
        appointment_date DATE,
        contact_name VARCHAR(50),
        contact_phone VARCHAR(20),
        remarks TEXT,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_service_id (service_id),
        INDEX idx_status (status),
        INDEX idx_order_no (order_no)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 推广记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS promotions (
        id VARCHAR(36) PRIMARY KEY,
        promoter_id VARCHAR(36) NOT NULL,
        invitee_id VARCHAR(36),
        promotion_code VARCHAR(20),
        order_id VARCHAR(36),
        status ENUM('pending', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (promoter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (invitee_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        INDEX idx_promoter_id (promoter_id),
        INDEX idx_promotion_code (promotion_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 设备操作日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS device_logs (
        id VARCHAR(36) PRIMARY KEY,
        garden_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        device_type ENUM('irrigation', 'camera') NOT NULL,
        operation VARCHAR(50) NOT NULL,
        parameters JSON,
        result VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (garden_id) REFERENCES gardens(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_garden_id (garden_id),
        INDEX idx_user_id (user_id),
        INDEX idx_device_type (device_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 入驻申请表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS applications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        contact_name VARCHAR(50) NOT NULL,
        contact_phone VARCHAR(20) NOT NULL,
        land_area DECIMAL(10,2),
        location VARCHAR(200),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    logger.info('数据库表创建/检查完成')
  } catch (error) {
    logger.error('创建数据库表失败:', error)
    throw error
  }
}

// 获取数据库连接
function getDB() {
  if (!connection) {
    throw new Error('数据库未连接')
  }
  return connection
}

module.exports = {
  connectDB,
  getDB
}