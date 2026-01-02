# 智慧共享菜园小程序本地测试指南

## 概述

本指南将帮助您在本地环境中完整测试智慧共享菜园小程序的所有功能，包括后端API服务和微信小程序前端。

## 环境要求

### 系统要求
- **操作系统**: Windows 10/11, macOS 10.14+, Ubuntu 18.04+
- **Node.js**: ≥16.0.0 (推荐使用 LTS 版本)
- **MySQL**: ≥8.0
- **Redis**: ≥6.0
- **微信开发者工具**: 最新稳定版

### 开发工具
- **代码编辑器**: VS Code (推荐)
- **API测试工具**: Postman 或 Insomnia (可选)
- **数据库管理工具**: MySQL Workbench 或 phpMyAdmin (可选)

## 第一步：环境准备

### 1.1 安装 Node.js
```bash
# 检查Node.js版本
node --version
npm --version

# 如果版本不符合要求，请从官网下载安装
# https://nodejs.org/
```

### 1.2 安装 MySQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# macOS (使用Homebrew)
brew install mysql

# Windows
# 从官网下载安装包: https://dev.mysql.com/downloads/mysql/
```

### 1.3 安装 Redis
```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS (使用Homebrew)
brew install redis

# Windows
# 从官网下载或使用WSL: https://redis.io/download
```

### 1.4 下载微信开发者工具
- 访问: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
- 下载对应平台的开发者工具
- 安装并使用微信扫码登录

## 第二步：数据库配置

### 2.1 启动 MySQL 服务
```bash
# Ubuntu/Debian
sudo systemctl start mysql
sudo systemctl enable mysql

# macOS
brew services start mysql

# Windows
# 通过服务管理器启动MySQL服务
```

### 2.2 创建数据库和用户
```sql
-- 登录MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE smart_garden CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建专用用户（可选，推荐）
CREATE USER 'smart_garden'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON smart_garden.* TO 'smart_garden'@'localhost';
FLUSH PRIVILEGES;

-- 退出MySQL
EXIT;
```

### 2.3 启动 Redis 服务
```bash
# Ubuntu/Debian
sudo systemctl start redis-server
sudo systemctl enable redis-server

# macOS
brew services start redis

# Windows
# 启动Redis服务或使用redis-server命令
```

## 第三步：后端服务配置

### 3.1 安装后端依赖
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install
```

### 3.2 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件
# 根据您的实际配置修改以下内容：
```

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_garden
DB_USER=root
DB_PASSWORD=your_mysql_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random
JWT_EXPIRES_IN=7d

# 微信小程序配置（测试环境可以使用占位符）
WECHAT_APP_ID=test_app_id
WECHAT_APP_SECRET=test_app_secret

# 允许的域名（CORS）
ALLOWED_ORIGINS=*

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

### 3.3 初始化数据库
```bash
# 运行数据库初始化脚本
npm run init-data
```

### 3.4 启动后端服务
```bash
# 开发模式启动（自动重载）
npm run dev

# 或者普通启动
npm start
```

成功启动后，您应该看到类似输出：
```
智慧共享菜园API服务启动成功
端口: 3000
环境: development
数据库连接成功
Redis连接成功
```

## 第四步：前端小程序配置

### 4.1 打开微信开发者工具
1. 启动微信开发者工具
2. 选择"小程序"
3. 点击"导入项目"

### 4.2 导入项目
1. **项目目录**: 选择 `miniprogram` 文件夹
2. **AppID**: 选择"测试号"（或使用您的小程序AppID）
3. **项目名称**: 智慧共享菜园
4. 点击"导入"

### 4.3 配置开发环境
确认 `miniprogram/app.js` 中的配置：
```javascript
globalData: {
  baseUrl: 'http://localhost:3000/api', // 确保指向本地后端
  isDev: true, // 开发模式
  // ... 其他配置
}
```

### 4.4 编译项目
1. 在微信开发者工具中点击"编译"
2. 等待编译完成
3. 查看控制台是否有错误信息

## 第五步：功能测试

### 5.1 基础连接测试

#### 测试后端API连接
```bash
# 测试服务器是否正常运行
curl http://localhost:3000/api/health

# 预期返回
{"status":"ok","timestamp":"2024-01-03T..."}
```

#### 测试数据库连接
```bash
# 查看数据库表是否创建成功
mysql -u root -p smart_garden -e "SHOW TABLES;"

# 预期输出应包含：
# users, gardens, user_gardens, services, orders, promotions, applications, device_logs
```

### 5.2 用户认证模块测试

#### 5.2.1 微信登录测试
1. 在小程序中点击"微信登录"
2. 观察控制台日志
3. 检查是否成功获取用户信息

**预期结果**:
- 控制台显示"登录成功"
- 用户信息正确显示
- 自动跳转到首页

#### 5.2.2 个人中心测试
1. 进入个人中心页面
2. 检查用户信息显示
3. 测试各个菜单项跳转

**测试要点**:
- [ ] 用户头像和昵称正确显示
- [ ] 绑定菜园数量显示正确
- [ ] "我的菜园"、"我的订单"、"我的推广码"链接正常

### 5.3 菜园管理模块测试

#### 5.3.1 菜园绑定测试
1. 进入"菜园绑定"页面
2. 输入测试菜园ID: `GARDEN001`
3. 点击"绑定菜园"

**测试要点**:
- [ ] 输入验证正常工作
- [ ] 绑定成功后显示菜园信息
- [ ] 绑定记录保存到数据库

#### 5.3.2 菜园列表测试
1. 进入"我的菜园"页面
2. 查看已绑定菜园列表
3. 测试菜园状态显示

**测试要点**:
- [ ] 菜园列表正确显示
- [ ] 菜园状态（在线/离线）正确
- [ ] 点击菜园可进入监控页面

### 5.4 实时监控和设备控制测试

#### 5.4.1 监控页面测试
1. 进入监控页面
2. 检查视频流显示
3. 测试各项功能

**测试要点**:
- [ ] 页面正常加载
- [ ] 视频播放器显示（可能显示占位图）
- [ ] 环境数据显示正常
- [ ] 截图功能可用

#### 5.4.2 灌溉控制测试
1. 点击"手动浇水"按钮
2. 选择浇水时长（5/10/15分钟）
3. 观察倒计时和状态变化

**测试要点**:
- [ ] 浇水操作正常启动
- [ ] 倒计时显示正确
- [ ] 冷却机制正常工作
- [ ] 设备状态同步正确

### 5.5 农事服务预约测试

#### 5.5.1 服务列表测试
1. 进入"服务预约"页面
2. 查看服务列表
3. 测试下拉刷新

**测试要点**:
- [ ] 5类服务正确显示
- [ ] 服务信息完整（名称、价格、描述）
- [ ] 下拉刷新功能正常

#### 5.5.2 服务预约测试
1. 选择一个服务
2. 填写预约信息
3. 提交订单

**测试要点**:
- [ ] 日期选择器正常工作
- [ ] 表单验证正确
- [ ] 订单提交成功
- [ ] 跳转到订单详情页

#### 5.5.3 订单管理测试
1. 进入"我的订单"页面
2. 查看订单列表
3. 测试订单状态筛选

**测试要点**:
- [ ] 订单列表正确显示
- [ ] 状态筛选功能正常
- [ ] 订单详情页面正确
- [ ] 取消订单功能正常

### 5.6 推广裂变模块测试

#### 5.6.1 推广码测试
1. 进入"我的推广码"页面
2. 查看推广码和二维码
3. 测试保存功能

**测试要点**:
- [ ] 推广码正确生成
- [ ] 二维码正确显示
- [ ] 保存到相册功能正常

#### 5.6.2 角色选择测试
1. 进入角色选择页面
2. 测试B端和C端选择
3. 验证跳转逻辑

**测试要点**:
- [ ] 角色选择界面正常
- [ ] B端跳转到申请表单
- [ ] C端跳转到服务页面

#### 5.6.3 入驻申请测试
1. 选择B端角色
2. 填写入驻申请表单
3. 提交申请

**测试要点**:
- [ ] 表单验证正确
- [ ] 手机号格式验证正常
- [ ] 提交成功显示确认信息

## 第六步：性能和错误处理测试

### 6.1 性能测试

#### 6.1.1 页面加载时间测试
1. 打开微信开发者工具控制台
2. 切换不同页面
3. 观察加载时间日志

**检查要点**:
- [ ] 首屏加载时间 ≤ 3秒
- [ ] 其他页面加载时间 ≤ 1.5秒
- [ ] 性能警告信息

#### 6.1.2 API响应时间测试
1. 执行各种API操作
2. 观察控制台中的响应时间日志
3. 检查是否有超时警告

**检查要点**:
- [ ] API响应时间 ≤ 2秒
- [ ] 无超时错误
- [ ] 响应时间记录正常

### 6.2 错误处理测试

#### 6.2.1 网络错误测试
1. 关闭后端服务
2. 尝试执行需要网络的操作
3. 观察错误提示

**检查要点**:
- [ ] 显示友好的错误提示
- [ ] 不会导致小程序崩溃
- [ ] 错误日志记录正确

#### 6.2.2 表单验证测试
1. 在各个表单中输入无效数据
2. 尝试提交
3. 检查验证提示

**检查要点**:
- [ ] 表单验证正确工作
- [ ] 错误提示清晰明确
- [ ] 不允许提交无效数据

## 第七步：集成测试

### 7.1 完整用户流程测试

#### 7.1.1 新用户注册流程
1. 清除小程序数据
2. 重新打开小程序
3. 完成整个注册和绑定流程

**测试步骤**:
1. 微信登录 → 获取用户信息
2. 绑定菜园 → 输入菜园ID
3. 查看监控 → 进入实时监控
4. 预约服务 → 完成一个订单
5. 查看推广码 → 生成推广信息

#### 7.1.2 设备控制完整流程
1. 进入监控页面
2. 执行灌溉操作
3. 等待操作完成
4. 检查状态同步

**检查要点**:
- [ ] 操作流程顺畅
- [ ] 状态同步及时
- [ ] 无异常错误

### 7.2 数据一致性测试

#### 7.2.1 数据库数据检查
```sql
-- 检查用户数据
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;

-- 检查菜园绑定数据
SELECT * FROM user_gardens ORDER BY created_at DESC LIMIT 5;

-- 检查订单数据
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

-- 检查推广数据
SELECT * FROM promotions ORDER BY created_at DESC LIMIT 5;
```

#### 7.2.2 缓存数据检查
1. 在小程序中执行一些操作
2. 检查本地存储数据
3. 验证缓存策略

## 第八步：兼容性测试

### 8.1 微信版本兼容性
1. 在开发者工具中切换不同基础库版本
2. 测试关键功能是否正常
3. 检查兼容性警告

**测试版本**:
- [ ] 基础库 2.30.0（最低要求）
- [ ] 基础库 2.35.0（推荐版本）
- [ ] 最新基础库版本

### 8.2 设备适配测试
1. 在开发者工具中切换不同设备型号
2. 检查页面布局和功能
3. 测试不同屏幕尺寸

**测试设备**:
- [ ] iPhone 6/7/8 (375px宽度)
- [ ] iPhone X/11/12 (414px宽度)
- [ ] Android 主流机型

## 第九步：部署前检查

### 9.1 配置检查
```bash
# 运行部署检查脚本
cd miniprogram
node utils/deploymentCheck.js
```

### 9.2 代码质量检查
1. 检查控制台是否有错误或警告
2. 验证所有功能正常工作
3. 确认性能指标达标

### 9.3 安全检查
1. 检查敏感信息是否正确处理
2. 验证输入验证和权限控制
3. 确认HTTPS配置（生产环境）

## 常见问题排查

### 问题1：后端服务启动失败
**可能原因**:
- MySQL或Redis服务未启动
- 端口被占用
- 环境变量配置错误

**解决方案**:
```bash
# 检查服务状态
sudo systemctl status mysql
sudo systemctl status redis

# 检查端口占用
netstat -tlnp | grep :3000

# 检查环境变量
cat backend/.env
```

### 问题2：小程序无法连接后端
**可能原因**:
- 后端服务未启动
- 网络配置问题
- CORS配置错误

**解决方案**:
1. 确认后端服务正常运行
2. 检查 `app.js` 中的 `baseUrl` 配置
3. 验证CORS设置

### 问题3：数据库连接失败
**可能原因**:
- MySQL服务未启动
- 数据库用户权限不足
- 连接参数错误

**解决方案**:
```bash
# 测试数据库连接
mysql -h localhost -u root -p smart_garden

# 检查用户权限
SHOW GRANTS FOR 'smart_garden'@'localhost';
```

### 问题4：页面加载缓慢
**可能原因**:
- 网络连接问题
- 后端性能问题
- 缓存策略不当

**解决方案**:
1. 检查网络连接
2. 查看后端日志
3. 清理缓存重新测试

### 问题5：设备控制无响应
**可能原因**:
- 设备模拟器未正确配置
- WebSocket连接问题
- 权限验证失败

**解决方案**:
1. 检查设备状态模拟
2. 验证用户权限
3. 查看控制台错误日志

## 测试完成检查清单

### 功能测试
- [ ] 用户登录和认证
- [ ] 菜园绑定和管理
- [ ] 实时监控和设备控制
- [ ] 服务预约和订单管理
- [ ] 推广码和角色选择
- [ ] 错误处理和用户提示

### 性能测试
- [ ] 页面加载时间符合要求
- [ ] API响应时间正常
- [ ] 内存使用合理
- [ ] 缓存策略有效

### 兼容性测试
- [ ] 微信基础库版本兼容
- [ ] 不同设备尺寸适配
- [ ] 网络环境适应性

### 安全测试
- [ ] 输入验证正确
- [ ] 权限控制有效
- [ ] 敏感信息保护

## 下一步

完成本地测试后，您可以：

1. **提交代码**: 将代码提交到版本控制系统
2. **部署测试**: 参考 `DEPLOYMENT_GUIDE.md` 进行部署
3. **用户测试**: 邀请用户进行真实环境测试
4. **性能优化**: 根据测试结果进行性能调优
5. **发布上线**: 提交微信小程序审核

## 技术支持

如果在测试过程中遇到问题：

1. **查看日志**: 检查控制台和服务器日志
2. **参考文档**: 查看项目README和相关文档
3. **问题反馈**: 记录问题详情和复现步骤

---

**注意事项**:
- 测试过程中请保持网络连接稳定
- 建议使用独立的测试数据库
- 定期备份测试数据
- 记录测试结果和发现的问题