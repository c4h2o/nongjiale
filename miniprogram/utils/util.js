// 通用工具函数
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 生成唯一ID
const generateId = () => {
  return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

// 生成推广码
const generatePromotionCode = (userId) => {
  const prefix = 'SG' // Smart Garden
  const timestamp = Date.now().toString(36).toUpperCase()
  const userHash = userId.substr(-4).toUpperCase()
  return `${prefix}${timestamp}${userHash}`
}

// 验证手机号
const validatePhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 验证菜园ID格式
const validateGardenId = (gardenId) => {
  // 菜园ID格式：GD + 8位数字
  const gardenIdRegex = /^GD\d{8}$/
  return gardenIdRegex.test(gardenId)
}

// 格式化日期为YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取近7天的日期选项
const getNext7Days = () => {
  const dates = []
  const today = new Date()
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push({
      value: formatDate(date),
      label: i === 0 ? '今天' : i === 1 ? '明天' : formatDate(date)
    })
  }
  
  return dates
}

// 计算时间差（秒）
const getTimeDiff = (startTime, endTime = new Date()) => {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000)
}

// 格式化倒计时显示
const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// 防抖函数
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

module.exports = {
  formatTime,
  generateId,
  generatePromotionCode,
  validatePhone,
  validateGardenId,
  formatDate,
  getNext7Days,
  getTimeDiff,
  formatCountdown,
  debounce,
  throttle
}