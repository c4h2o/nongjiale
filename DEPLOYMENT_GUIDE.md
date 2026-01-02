# 智慧共享菜园小程序部署指南

## 部署前准备

### 1. 环境配置检查

#### 开发环境切换到生产环境
```javascript
// miniprogram/app.js
globalData: {
  isDev: false, // 关闭开发模式
  baseUrl: 'https://your-api-domain.com/api', // 生产API地址
  // ... 其他配置
}
```

#### 后端环境配置
```bash
# backend/.env
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_NAME=smart_garden_prod
REDIS_HOST=your-production-redis-host
JWT_SECRET=your-production-jwt-secret
```

### 2. 微信小程序配置

#### 2.1 服务器域名配置
在微信公众平台配置以下域名：

**request合法域名：**
- https://your-api-domain.com

**uploadFile合法域名：**
- https://your-api-domain.com

**downloadFile合法域名：**
- https://your-api-domain.com

#### 2.2 业务域名配置
如需要webview功能，配置：
- https://your-web-domain.com

### 3. 兼容性要求

#### 微信版本要求
- 微信版本：≥ 8.0.0
- 基础库版本：≥ 2.30.0

#### 设备兼容性
- iOS：≥ 12.0
- Android：≥ 7.0
- 屏幕分辨率：≥ 320x480

#### 网络环境
- 支持：WiFi、4G、5G、3G
- 弱网优化：2G网络下启用优化模式

## 部署步骤

### 第一步：代码准备

1. **更新配置文件**
```bash
# 更新生产环境配置
cp .env.production .env
```

2. **构建检查**
```bash
# 运行部署检查
node scripts/deployment-check.js
```

3. **代码压缩优化**
```bash
# 压缩图片资源
npm run optimize-images

# 压缩代码
npm run build
```

### 第二步：后端部署

1. **服务器环境准备**
```bash
# 安装Node.js (≥16.0.0)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
npm install -g pm2
```

2. **数据库准备**
```bash
# MySQL数据库创建
mysql -u root -p
CREATE DATABASE smart_garden_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 导入数据结构
mysql -u root -p smart_garden_prod < database/schema.sql
```

3. **Redis配置**
```bash
# 安装Redis
sudo apt-get install redis-server

# 配置Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

4. **部署后端服务**
```bash
# 上传代码到服务器
scp -r backend/ user@your-server:/path/to/app/

# 安装依赖
cd /path/to/app/backend
npm install --production

# 启动服务
pm2 start app.js --name smart-garden-api
pm2 save
pm2 startup
```

### 第三步：小程序发布

1. **使用微信开发者工具**
   - 打开项目
   - 点击"上传"
   - 填写版本号和项目备注
   - 上传代码

2. **提交审核**
   - 登录微信公众平台
   - 进入"版本管理"
   - 提交审核并填写审核信息

3. **发布上线**
   - 审核通过后点击"发布"
   - 设置发布时间（可选）

## 性能优化配置

### 1. 缓存策略
```javascript
// 生产环境缓存配置
globalData: {
  cacheTime: 10 * 60 * 1000, // 10分钟
  maxCacheSize: 20, // 20MB
  pollInterval: 30000 // 30秒轮询
}
```

### 2. 图片优化
```javascript
// 根据网络状况调整图片质量
globalData: {
  imageQuality: 'auto', // auto/high/low
  lazyLoadEnabled: true
}
```

### 3. 网络优化
```javascript
// 请求超时配置
request: {
  timeout: 10000, // 10秒
  retryCount: 2,
  retryDelay: 1000
}
```

## 监控和维护

### 1. 性能监控
```javascript
// 启用生产环境监控
app.js:
onLaunch() {
  // 性能数据上报
  this.reportPerformanceData()
  
  // 错误日志上报
  this.reportErrorLogs()
}
```

### 2. 日志管理
```bash
# 后端日志管理
pm2 logs smart-garden-api

# 日志轮转配置
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. 数据库维护
```sql
-- 定期清理过期数据
DELETE FROM logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 优化数据库
OPTIMIZE TABLE users, gardens, orders, devices;
```

## 安全配置

### 1. HTTPS配置
```nginx
# Nginx配置示例
server {
    listen 443 ssl;
    server_name your-api-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 防火墙配置
```bash
# 开放必要端口
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. 数据库安全
```sql
-- 创建专用数据库用户
CREATE USER 'smart_garden'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON smart_garden_prod.* TO 'smart_garden'@'localhost';
FLUSH PRIVILEGES;
```

## 备份策略

### 1. 数据库备份
```bash
# 每日自动备份
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p smart_garden_prod > /backup/db_$DATE.sql
find /backup -name "db_*.sql" -mtime +7 -delete
```

### 2. 代码备份
```bash
# Git标签管理
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

### 3. 配置文件备份
```bash
# 备份重要配置
cp /path/to/app/.env /backup/env_$DATE.backup
cp /etc/nginx/sites-available/smart-garden /backup/nginx_$DATE.backup
```

## 故障排查

### 1. 常见问题

#### 小程序无法连接服务器
- 检查域名配置是否正确
- 确认HTTPS证书有效
- 验证网络连接

#### 页面加载缓慢
- 检查服务器性能
- 优化数据库查询
- 启用CDN加速

#### 设备控制失败
- 检查设备网络连接
- 验证设备状态同步
- 查看错误日志

### 2. 日志分析
```bash
# 查看应用日志
pm2 logs smart-garden-api --lines 100

# 查看系统日志
tail -f /var/log/nginx/error.log

# 查看数据库日志
tail -f /var/log/mysql/error.log
```

### 3. 性能分析
```bash
# 服务器性能监控
top
htop
iotop

# 数据库性能分析
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Slow_queries';
```

## 版本更新流程

### 1. 小版本更新（Bug修复）
1. 修复代码
2. 测试验证
3. 更新版本号
4. 重新上传审核

### 2. 大版本更新（功能更新）
1. 功能开发和测试
2. 兼容性测试
3. 性能测试
4. 用户接受度测试
5. 正式发布

### 3. 紧急修复
1. 快速修复关键问题
2. 最小化测试
3. 紧急发布流程
4. 后续完整测试

## 联系支持

如在部署过程中遇到问题，请联系技术支持：

- 技术文档：[项目Wiki]
- 问题反馈：[GitHub Issues]
- 技术支持：support@yourdomain.com

---

**注意事项：**
1. 部署前务必完成所有测试
2. 生产环境配置与开发环境严格分离
3. 定期备份重要数据
4. 监控系统运行状态
5. 及时更新安全补丁