// API接口联调测试工具
const request = require('./request')
const errorHandler = require('./errorHandler')

class ApiTest {
  constructor() {
    this.testResults = []
    this.baseUrl = 'http://localhost:3000/api'
  }

  // 执行完整的API联调测试
  async runApiTests() {
    console.log('开始执行API接口联调测试...')
    
    const testSuites = [
      { name: '认证接口测试', test: this.testAuthApis.bind(this) },
      { name: '用户接口测试', test: this.testUserApis.bind(this) },
      { name: '菜园接口测试', test: this.testGardenApis.bind(this) },
      { name: '设备接口测试', test: this.testDeviceApis.bind(this) },
      { name: '服务接口测试', test: this.testServiceApis.bind(this) },
      { name: '订单接口测试', test: this.testOrderApis.bind(this) },
      { name: '推广接口测试', test: this.testPromotionApis.bind(this) },
      { name: '申请接口测试', test: this.testApplicationApis.bind(this) }
    ]

    const results = []
    let totalPassed = 0
    let totalFailed = 0

    for (const suite of testSuites) {
      try {
        console.log(`执行测试套件: ${suite.name}`)
        const result = await suite.test()
        
        const passed = result.tests.filter(t => t.status === 'passed').length
        const failed = result.tests.filter(t => t.status === 'failed').length
        
        totalPassed += passed
        totalFailed += failed
        
        results.push({
          name: suite.name,
          status: failed === 0 ? 'passed' : 'failed',
          passed,
          failed,
          tests: result.tests,
          timestamp: new Date().toISOString()
        })
        
        console.log(`${suite.name}: ${passed} 通过, ${failed} 失败`)
      } catch (error) {
        results.push({
          name: suite.name,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        })
        totalFailed++
        console.error(`${suite.name} 执行失败:`, error.message)
      }
    }

    this.testResults = results
    return this.generateTestReport(totalPassed, totalFailed)
  }

  // 测试认证接口
  async testAuthApis() {
    const tests = []
    
    // 测试微信登录接口
    try {
      const loginData = {
        code: 'test_wx_code_' + Date.now(),
        userInfo: {
          nickName: '测试用户',
          avatarUrl: '/images/default-avatar.png'
        }
      }
      
      const response = await request.post('/auth/wx-login', loginData, { useCache: false })
      
      if (response.success && response.token) {
        tests.push({
          api: 'POST /auth/wx-login',
          status: 'passed',
          message: '微信登录接口正常'
        })
        
        // 保存token用于后续测试
        this.testToken = response.token
      } else {
        tests.push({
          api: 'POST /auth/wx-login',
          status: 'failed',
          message: '微信登录接口返回数据异常'
        })
      }
    } catch (error) {
      tests.push({
        api: 'POST /auth/wx-login',
        status: 'failed',
        message: `微信登录接口失败: ${error.message}`
      })
    }

    // 测试token验证接口
    if (this.testToken) {
      try {
        const response = await request.get('/auth/verify', {}, { 
          useCache: false,
          header: { Authorization: `Bearer ${this.testToken}` }
        })
        
        tests.push({
          api: 'GET /auth/verify',
          status: response.success ? 'passed' : 'failed',
          message: response.success ? 'Token验证接口正常' : 'Token验证失败'
        })
      } catch (error) {
        tests.push({
          api: 'GET /auth/verify',
          status: 'failed',
          message: `Token验证接口失败: ${error.message}`
        })
      }
    }

    return { tests }
  }

  // 测试用户接口
  async testUserApis() {
    const tests = []
    
    if (!this.testToken) {
      tests.push({
        api: 'User APIs',
        status: 'skipped',
        message: '跳过用户接口测试（无有效token）'
      })
      return { tests }
    }

    // 测试获取用户信息
    try {
      const response = await request.get('/users/profile', {}, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'GET /users/profile',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '获取用户信息接口正常' : '获取用户信息失败'
      })
    } catch (error) {
      tests.push({
        api: 'GET /users/profile',
        status: 'failed',
        message: `获取用户信息接口失败: ${error.message}`
      })
    }

    // 测试更新用户信息
    try {
      const updateData = {
        nickName: '测试用户更新',
        phone: '13800138000'
      }
      
      const response = await request.put('/users/profile', updateData, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'PUT /users/profile',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '更新用户信息接口正常' : '更新用户信息失败'
      })
    } catch (error) {
      tests.push({
        api: 'PUT /users/profile',
        status: 'failed',
        message: `更新用户信息接口失败: ${error.message}`
      })
    }

    return { tests }
  }

  // 测试菜园接口
  async testGardenApis() {
    const tests = []
    
    if (!this.testToken) {
      tests.push({
        api: 'Garden APIs',
        status: 'skipped',
        message: '跳过菜园接口测试（无有效token）'
      })
      return { tests }
    }

    // 测试获取菜园列表
    try {
      const response = await request.get('/gardens', {}, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'GET /gardens',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '获取菜园列表接口正常' : '获取菜园列表失败'
      })
    } catch (error) {
      tests.push({
        api: 'GET /gardens',
        status: 'failed',
        message: `获取菜园列表接口失败: ${error.message}`
      })
    }

    // 测试菜园绑定
    try {
      const bindData = {
        gardenId: 'test-garden-' + Date.now()
      }
      
      const response = await request.post('/gardens/bind', bindData, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'POST /gardens/bind',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '菜园绑定接口正常' : '菜园绑定失败'
      })
      
      // 保存绑定的菜园ID用于后续测试
      if (response.success) {
        this.testGardenId = bindData.gardenId
      }
    } catch (error) {
      tests.push({
        api: 'POST /gardens/bind',
        status: 'failed',
        message: `菜园绑定接口失败: ${error.message}`
      })
    }

    return { tests }
  }

  // 测试设备接口
  async testDeviceApis() {
    const tests = []
    
    if (!this.testToken || !this.testGardenId) {
      tests.push({
        api: 'Device APIs',
        status: 'skipped',
        message: '跳过设备接口测试（无有效token或菜园ID）'
      })
      return { tests }
    }

    // 测试获取设备状态
    try {
      const response = await request.get(`/devices/status/${this.testGardenId}`, {}, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'GET /devices/status/:gardenId',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '获取设备状态接口正常' : '获取设备状态失败'
      })
    } catch (error) {
      tests.push({
        api: 'GET /devices/status/:gardenId',
        status: 'failed',
        message: `获取设备状态接口失败: ${error.message}`
      })
    }

    // 测试获取视频流
    try {
      const response = await request.get(`/devices/video-stream/${this.testGardenId}`, {}, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'GET /devices/video-stream/:gardenId',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '获取视频流接口正常' : '获取视频流失败'
      })
    } catch (error) {
      tests.push({
        api: 'GET /devices/video-stream/:gardenId',
        status: 'failed',
        message: `获取视频流接口失败: ${error.message}`
      })
    }

    // 测试设备控制
    try {
      const controlData = {
        action: 'start',
        duration: 5
      }
      
      const response = await request.post(`/devices/irrigation/${this.testGardenId}`, controlData, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'POST /devices/irrigation/:gardenId',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '设备控制接口正常' : '设备控制失败'
      })
    } catch (error) {
      tests.push({
        api: 'POST /devices/irrigation/:gardenId',
        status: 'failed',
        message: `设备控制接口失败: ${error.message}`
      })
    }

    return { tests }
  }

  // 测试服务接口
  async testServiceApis() {
    const tests = []
    
    if (!this.testToken) {
      tests.push({
        api: 'Service APIs',
        status: 'skipped',
        message: '跳过服务接口测试（无有效token）'
      })
      return { tests }
    }

    // 测试获取服务列表
    try {
      const response = await request.get('/services', {}, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'GET /services',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '获取服务列表接口正常' : '获取服务列表失败'
      })
    } catch (error) {
      tests.push({
        api: 'GET /services',
        status: 'failed',
        message: `获取服务列表接口失败: ${error.message}`
      })
    }

    return { tests }
  }

  // 测试订单接口
  async testOrderApis() {
    const tests = []
    
    if (!this.testToken) {
      tests.push({
        api: 'Order APIs',
        status: 'skipped',
        message: '跳过订单接口测试（无有效token）'
      })
      return { tests }
    }

    // 测试创建订单
    try {
      const orderData = {
        serviceId: 'service-001',
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        contactName: '测试联系人',
        contactPhone: '13800138000',
        remarks: '测试订单'
      }
      
      const response = await request.post('/orders', orderData, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'POST /orders',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '创建订单接口正常' : '创建订单失败'
      })
      
      if (response.success) {
        this.testOrderId = response.orderId
      }
    } catch (error) {
      tests.push({
        api: 'POST /orders',
        status: 'failed',
        message: `创建订单接口失败: ${error.message}`
      })
    }

    // 测试获取订单列表
    try {
      const response = await request.get('/orders', {}, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'GET /orders',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '获取订单列表接口正常' : '获取订单列表失败'
      })
    } catch (error) {
      tests.push({
        api: 'GET /orders',
        status: 'failed',
        message: `获取订单列表接口失败: ${error.message}`
      })
    }

    return { tests }
  }

  // 测试推广接口
  async testPromotionApis() {
    const tests = []
    
    if (!this.testToken) {
      tests.push({
        api: 'Promotion APIs',
        status: 'skipped',
        message: '跳过推广接口测试（无有效token）'
      })
      return { tests }
    }

    // 测试获取推广码
    try {
      const response = await request.get('/promotion/code', {}, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'GET /promotion/code',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '获取推广码接口正常' : '获取推广码失败'
      })
    } catch (error) {
      tests.push({
        api: 'GET /promotion/code',
        status: 'failed',
        message: `获取推广码接口失败: ${error.message}`
      })
    }

    // 测试获取推广统计
    try {
      const response = await request.get('/promotion/stats', {}, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'GET /promotion/stats',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '获取推广统计接口正常' : '获取推广统计失败'
      })
    } catch (error) {
      tests.push({
        api: 'GET /promotion/stats',
        status: 'failed',
        message: `获取推广统计接口失败: ${error.message}`
      })
    }

    return { tests }
  }

  // 测试申请接口
  async testApplicationApis() {
    const tests = []
    
    if (!this.testToken) {
      tests.push({
        api: 'Application APIs',
        status: 'skipped',
        message: '跳过申请接口测试（无有效token）'
      })
      return { tests }
    }

    // 测试提交入驻申请
    try {
      const applicationData = {
        contactName: '测试联系人',
        contactPhone: '13800138000',
        landArea: '100',
        location: '测试地区'
      }
      
      const response = await request.post('/applications', applicationData, { 
        useCache: false,
        header: { Authorization: `Bearer ${this.testToken}` }
      })
      
      tests.push({
        api: 'POST /applications',
        status: response.success ? 'passed' : 'failed',
        message: response.success ? '提交入驻申请接口正常' : '提交入驻申请失败'
      })
    } catch (error) {
      tests.push({
        api: 'POST /applications',
        status: 'failed',
        message: `提交入驻申请接口失败: ${error.message}`
      })
    }

    return { tests }
  }

  // 生成测试报告
  generateTestReport(totalPassed, totalFailed) {
    const totalTests = totalPassed + totalFailed
    const passRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0

    const report = {
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        passRate: passRate + '%',
        timestamp: new Date().toISOString()
      },
      suites: this.testResults,
      recommendations: this.generateRecommendations()
    }

    console.log('API接口联调测试报告:', report)
    return report
  }

  // 生成优化建议
  generateRecommendations() {
    const recommendations = []
    
    const failedSuites = this.testResults.filter(s => s.status === 'failed' || s.status === 'error')
    
    if (failedSuites.length > 0) {
      recommendations.push({
        type: 'error',
        message: `有 ${failedSuites.length} 个接口测试套件失败`,
        actions: failedSuites.map(s => `修复 ${s.name}`)
      })
    }

    // 检查关键接口
    const criticalApis = ['认证接口测试', '用户接口测试', '菜园接口测试']
    const failedCriticalApis = failedSuites.filter(s => criticalApis.includes(s.name))
    
    if (failedCriticalApis.length > 0) {
      recommendations.push({
        type: 'critical',
        message: '关键接口测试失败，需要优先修复',
        actions: ['检查后端服务是否正常启动', '验证数据库连接', '检查接口路由配置']
      })
    }

    if (failedSuites.length === 0) {
      recommendations.push({
        type: 'success',
        message: '所有API接口测试通过，前后端联调正常',
        actions: ['可以进行功能测试', '准备集成测试']
      })
    }

    return recommendations
  }

  // 清理测试数据
  clearTestData() {
    this.testResults = []
    this.testToken = null
    this.testGardenId = null
    this.testOrderId = null
    console.log('API测试数据已清理')
  }
}

module.exports = new ApiTest()