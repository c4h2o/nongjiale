# 智慧共享菜园微信小程序

## 项目概述

智慧共享菜园是一个基于微信生态的IoT农业管理平台，定位为快速落地的工程原型版，聚焦"共享菜园"核心场景。系统面向C端普通用户（想拥有菜园）和B端用地用户（有餐厅/菜园用地），实现菜园远程可视化监控、灌溉设备远程控制、农事服务预约、推广裂变四大核心能力。

## 核心功能

### 用户认证模块
- 微信快捷登录（免注册）
- 自动生成用户ID和推广码
- 个人中心信息展示

### 菜园管理模块
- 菜园绑定/解绑功能
- 菜园列表展示
- 菜园状态监控

### 实时监控与设备控制
- 实时画面查看（≥720P，延迟≤3秒）
- 远程灌溉控制（5/10/15分钟可选）
- 设备状态实时同步
- 摄像头截图功能

### 农事服务预约
- 5类核心服务展示
- 服务下单流程
- 订单管理功能

### 推广裂变模块
- 推广码生成与保存
- 角色选择入口
- 入驻申请表单
- 推广数据展示

## 技术架构

### 前端技术栈
- 微信小程序原生框架 (WXML/WXSS/JavaScript)
- 微信小程序基础组件库
- live-player组件用于视频播放

### 后端技术栈
- Node.js + Express.js
- MySQL 8.0 数据库
- Redis 6.0 缓存
- JWT 用户认证
- Winston 日志管理

### IoT集成
- RTSP到HLS/RTMP转换服务
- HTTP/HTTPS API用于设备控制
- WebSocket用于实时状态同步

## 项目结构

```
smart-shared-garden/
├── miniprogram/                 # 微信小程序前端
│   ├── pages/                   # 页面文件
│   ├── services/                # 服务层
│   ├── utils/                   # 工具类
│   ├── app.js                   # 小程序入口
│   ├── app.json                 # 小程序配置
│   └── app.wxss                 # 全局样式
├── backend/                     # Node.js后端
│   ├── routes/                  # 路由文件
│   ├── middleware/              # 中间件
│   ├── config/                  # 配置文件
│   ├── utils/                   # 工具类
│   ├── scripts/                 # 脚本文件
│   └── app.js                   # 后端入口
├── .kiro/specs/                 # 项目规范文档
└── README.md                    # 项目说明
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0
- 微信开发者工具

### 后端部署

1. 安装依赖
```bash
cd backend
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库和微信小程序信息
```

3. 初始化数据库
```bash
npm run init-data
```

4. 启动服务
```bash
npm run dev
```

### 前端部署

1. 使用微信开发者工具打开 `miniprogram` 目录

2. 配置小程序AppID和后端API地址

3. 编译并预览

## API文档

### 认证接口
- `POST /api/auth/wechat-login` - 微信登录

### 用户接口
- `GET /api/users/profile` - 获取用户信息

### 菜园接口
- `POST /api/gardens/bind` - 绑定菜园
- `DELETE /api/gardens/:id/unbind` - 解绑菜园
- `GET /api/gardens/list` - 获取菜园列表
- `GET /api/gardens/:id/stream` - 获取视频流

### 设备接口
- `GET /api/devices/:gardenId/status` - 获取设备状态
- `POST /api/devices/irrigation/control` - 控制灌溉设备
- `POST /api/devices/camera/snapshot` - 摄像头截图

### 服务接口
- `GET /api/services/list` - 获取服务列表

### 订单接口
- `POST /api/orders/create` - 创建订单
- `GET /api/orders/list` - 获取订单列表
- `GET /api/orders/:id` - 获取订单详情
- `PUT /api/orders/:id/cancel` - 取消订单

### 推广接口
- `GET /api/promotion/code` - 获取推广码
- `POST /api/promotion/role-select` - 角色选择
- `GET /api/promotion/stats` - 获取推广数据

### 申请接口
- `POST /api/applications/submit` - 提交入驻申请

## 数据库设计

### 主要数据表
- `users` - 用户表
- `gardens` - 菜园表
- `user_gardens` - 用户菜园绑定表
- `services` - 服务表
- `orders` - 订单表
- `promotions` - 推广记录表
- `device_logs` - 设备操作日志表
- `applications` - 入驻申请表

## 性能要求

- 页面加载时间：首屏≤3秒，次页面≤1.5秒
- 摄像头画面延迟：≤3秒
- 并发支持：≤100人同时在线
- 操作响应时间：≤1秒

## 兼容性

- 微信小程序基础库版本：≥2.30.0
- 设备适配：支持主流手机尺寸
- 系统兼容：iOS/Android
- 网络环境：4G/5G/WiFi

## 开发规范

### 代码规范
- 使用ES6+语法
- 统一的错误处理机制
- 完善的日志记录
- 规范的API响应格式

### 安全规范
- JWT token认证
- 参数验证和过滤
- SQL注入防护
- 限流和防刷机制

## 部署说明

### 生产环境部署
1. 配置HTTPS域名
2. 配置微信小程序域名白名单
3. 设置环境变量
4. 启动PM2进程管理
5. 配置Nginx反向代理

### 监控和日志
- 使用Winston进行日志管理
- 配置日志轮转和清理
- 监控API响应时间和错误率

## 许可证

MIT License

## 联系方式

如有问题请联系开发团队。