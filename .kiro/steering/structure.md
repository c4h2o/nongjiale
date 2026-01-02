# Project Structure & Organization

## Root Directory Structure
```
smart-shared-garden/
├── miniprogram/           # WeChat Mini Program frontend
├── backend/              # Node.js Express backend
├── .kiro/               # Kiro configuration and specs
├── DEPLOYMENT_GUIDE.md   # Production deployment guide
├── PERFORMANCE_OPTIMIZATION_SUMMARY.md
└── README.md            # Project documentation
```

## Frontend Structure (`miniprogram/`)
```
miniprogram/
├── pages/               # Page components (WXML/WXSS/JS/JSON)
│   ├── login/          # User authentication
│   ├── index/          # Home page
│   ├── gardens/        # Garden management
│   ├── monitor/        # Real-time monitoring
│   ├── services/       # Service booking
│   ├── orders/         # Order management
│   ├── profile/        # User profile
│   └── promotion/      # Referral system
├── services/           # Business logic layer
│   ├── auth.js         # Authentication service
│   ├── garden.js       # Garden management
│   └── order.js        # Order processing
├── utils/              # Utility functions
│   ├── request.js      # HTTP client with caching
│   ├── storage.js      # Local storage wrapper
│   ├── performance.js  # Performance monitoring
│   └── errorHandler.js # Error handling
├── app.js              # Mini Program entry point
├── app.json            # Mini Program configuration
└── app.wxss            # Global styles
```

## Backend Structure (`backend/`)
```
backend/
├── routes/             # API route handlers
│   ├── auth.js         # Authentication endpoints
│   ├── users.js        # User management
│   ├── gardens.js      # Garden operations
│   ├── devices.js      # IoT device control
│   ├── orders.js       # Order processing
│   └── promotion.js    # Referral system
├── middleware/         # Express middleware
│   ├── auth.js         # JWT authentication
│   └── errorHandler.js # Global error handling
├── config/             # Configuration files
│   ├── database.js     # MySQL connection
│   └── redis.js        # Redis connection
├── utils/              # Utility functions
│   ├── logger.js       # Winston logging
│   └── response.js     # Standardized API responses
├── scripts/            # Database and deployment scripts
├── app.js              # Express application entry
└── package.json        # Dependencies and scripts
```

## Architecture Patterns

### Frontend Patterns
- **Page Structure**: Each page has 4 files (.js, .json, .wxml, .wxss)
- **Service Layer**: Business logic separated from UI components
- **Utility Layer**: Reusable functions for common operations
- **Global State**: Managed through `app.globalData`

### Backend Patterns
- **Route-Controller Pattern**: Routes handle HTTP, controllers contain business logic
- **Middleware Chain**: Authentication, validation, error handling
- **Service Layer**: Business logic separated from route handlers
- **Standardized Responses**: Consistent API response format via `Response` utility

### Code Organization Rules
1. **File Naming**: Use kebab-case for directories, camelCase for JS files
2. **Component Structure**: Follow WeChat Mini Program conventions
3. **API Routes**: RESTful design with consistent naming
4. **Error Handling**: Centralized error handling in both frontend and backend
5. **Configuration**: Environment-specific configs in separate files

### Database Schema
- **users**: User accounts and profiles
- **gardens**: Garden information and metadata
- **user_gardens**: User-garden binding relationships
- **services**: Available agricultural services
- **orders**: Service booking and order management
- **promotions**: Referral and promotion tracking
- **device_logs**: IoT device operation history
- **applications**: Business user applications

### Performance Considerations
- **Caching Strategy**: GET requests cached automatically
- **Request Optimization**: Deduplication and batching
- **Resource Management**: Automatic cleanup on page hide
- **Memory Monitoring**: Built-in performance tracking

### Security Patterns
- **JWT Authentication**: Token-based auth with expiration
- **Input Validation**: express-validator for API inputs
- **Rate Limiting**: Per-IP request throttling
- **CORS Configuration**: Restricted origin access