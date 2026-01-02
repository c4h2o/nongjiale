// scripts/init-data.js - 初始化基础数据
const { v4: uuidv4 } = require('uuid')
const { connectDB, getDB } = require('../config/database')
const logger = require('../utils/logger')

async function initData() {
  try {
    await connectDB()
    const db = getDB()

    logger.info('开始初始化基础数据...')

    // 初始化服务数据
    const services = [
      {
        id: uuidv4(),
        name: '菜园认领',
        description: '认领专属菜园地块，享受种植乐趣。包含土地使用权、基础农具、种子提供等服务。',
        price: 299.00,
        service_range: '全市范围',
        booking_notice: '认领后可享受1年使用权，包含基础种植指导服务。需提前3天预约实地查看。'
      },
      {
        id: uuidv4(),
        name: '果蔬采摘',
        description: '体验亲手采摘新鲜果蔬的乐趣，适合家庭亲子活动。提供采摘工具和包装袋。',
        price: 68.00,
        service_range: '市区及周边',
        booking_notice: '采摘季节为4-10月，需提前1天预约。雨天暂停服务，可免费改期。'
      },
      {
        id: uuidv4(),
        name: '施肥养护',
        description: '专业农技师提供施肥、除草、病虫害防治等全方位养护服务。',
        price: 128.00,
        service_range: '全市范围',
        booking_notice: '服务时长约2-3小时，包含有机肥料。建议每月进行1-2次养护。'
      },
      {
        id: uuidv4(),
        name: '定制种植',
        description: '根据您的需求定制种植方案，从选种到收获全程专业指导。',
        price: 188.00,
        service_range: '全市范围',
        booking_notice: '需提前7天沟通种植需求，制定个性化方案。包含种子、肥料等材料费。'
      },
      {
        id: uuidv4(),
        name: '农具租赁',
        description: '提供锄头、铲子、水桶等各类农具租赁服务，按天计费。',
        price: 25.00,
        service_range: '全市范围',
        booking_notice: '租赁期限1-7天，超期按天加收费用。损坏或丢失需按原价赔偿。'
      }
    ]

    // 检查服务是否已存在
    const [existingServices] = await db.execute('SELECT COUNT(*) as count FROM services')
    
    if (existingServices[0].count === 0) {
      for (const service of services) {
        await db.execute(`
          INSERT INTO services (id, name, description, price, service_range, booking_notice, status)
          VALUES (?, ?, ?, ?, ?, ?, 'active')
        `, [service.id, service.name, service.description, service.price, service.service_range, service.booking_notice])
      }
      logger.info('服务数据初始化完成')
    } else {
      logger.info('服务数据已存在，跳过初始化')
    }

    // 初始化示例菜园数据
    const gardens = [
      {
        id: 'GD00000001',
        name: '阳光菜园A区',
        location: '北京市朝阳区农业园区A1',
        area: 50.00,
        description: '朝南向阳，土壤肥沃，适合种植各类蔬菜',
        camera_rtsp_url: 'rtsp://demo.example.com/garden/GD00000001',
        irrigation_device_id: 'IRR_001',
        status: 'active'
      },
      {
        id: 'GD00000002',
        name: '绿野菜园B区',
        location: '北京市海淀区生态农场B2',
        area: 75.00,
        description: '有机种植基地，无污染环境，水源充足',
        camera_rtsp_url: 'rtsp://demo.example.com/garden/GD00000002',
        irrigation_device_id: 'IRR_002',
        status: 'active'
      },
      {
        id: 'GD00000003',
        name: '田园菜园C区',
        location: '北京市昌平区现代农业示范园C3',
        area: 100.00,
        description: '现代化设施齐全，智能化管理，产量稳定',
        camera_rtsp_url: 'rtsp://demo.example.com/garden/GD00000003',
        irrigation_device_id: 'IRR_003',
        status: 'active'
      }
    ]

    // 检查菜园是否已存在
    const [existingGardens] = await db.execute('SELECT COUNT(*) as count FROM gardens')
    
    if (existingGardens[0].count === 0) {
      for (const garden of gardens) {
        await db.execute(`
          INSERT INTO gardens (id, name, location, area, description, camera_rtsp_url, irrigation_device_id, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [garden.id, garden.name, garden.location, garden.area, garden.description, garden.camera_rtsp_url, garden.irrigation_device_id, garden.status])
      }
      logger.info('菜园数据初始化完成')
    } else {
      logger.info('菜园数据已存在，跳过初始化')
    }

    logger.info('基础数据初始化完成')
    process.exit(0)
    
  } catch (error) {
    logger.error('初始化数据失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initData()
}

module.exports = { initData }