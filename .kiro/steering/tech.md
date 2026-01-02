# Technology Stack & Build System

## Frontend Technology Stack
- **Framework**: WeChat Mini Program native framework (WXML/WXSS/JavaScript)
- **Components**: WeChat Mini Program base component library
- **Video**: live-player component for video streaming
- **Base Library**: ≥2.30.0 required

## Backend Technology Stack
- **Runtime**: Node.js ≥16.0.0
- **Framework**: Express.js
- **Database**: MySQL 8.0
- **Cache**: Redis 6.0
- **Authentication**: JWT (jsonwebtoken)
- **Logging**: Winston
- **Security**: bcryptjs, helmet, express-rate-limit, cors

## IoT Integration
- **Video Streaming**: RTSP to HLS/RTMP conversion
- **Device Control**: HTTP/HTTPS API
- **Real-time Sync**: WebSocket for device status

## Common Commands

### Backend Development
```bash
# Install dependencies
cd backend && npm install

# Development mode with auto-reload
npm run dev

# Production start
npm start

# Initialize database
npm run init-data

# Run tests
npm test
npm run test:watch
```

### Frontend Development
- Use WeChat Developer Tools to open `miniprogram` directory
- Configure Mini Program AppID and backend API address
- Compile and preview in simulator

### Environment Setup
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Required environment variables
NODE_ENV=development|production
PORT=3000
DB_HOST=localhost
DB_NAME=smart_garden
REDIS_HOST=localhost
JWT_SECRET=your-secret-key
```

### Production Deployment
```bash
# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start backend/app.js --name smart-garden-api
pm2 save
pm2 startup
```

## Code Quality Tools
- **Testing**: Jest with supertest for API testing
- **Development**: nodemon for auto-reload
- **Process Management**: PM2 for production

## Performance Monitoring
- Built-in performance monitoring utilities
- API response time tracking
- Memory usage monitoring
- Cache management system