// pages/role-select/role-select.js
const promotionService = require('../../services/promotion')

Page({
  data: {
    selectedRole: '',
    submitting: false,
    roles: [
      {
        id: 'provider',
        title: '我有餐厅/菜园用地',
        subtitle: 'B端用户',
        description: '拥有餐厅或菜园用地，希望加入共享菜园平台，盘活闲置资源，获得额外收益。',
        icon: '🏪',
        features: [
          '提供用地资源',
          '获得租金收益',
          '专业运营支持',
          '品牌合作机会'
        ],
        buttonText: '申请入驻',
        color: '#ff6b35'
      },
      {
        id: 'consumer',
        title: '我想拥有菜园',
        subtitle: 'C端用户',
        description: '希望拥有自己的菜园，体验种植乐趣，享受新鲜蔬果，但没有合适的土地资源。',
        icon: '🌱',
        features: [
          '认领专属菜园',
          '远程监控管理',
          '专业服务支持',
          '新鲜蔬果收获'
        ],
        buttonText: '开始体验',
        color: '#4CAF50'
      }
    ]
  },

  onLoad(options) {
    wx.setNavigationBarTitle({
      title: '选择您的角色'
    })

    // 如果从推广链接进入，可以预设角色
    const { role } = options
    if (role && ['provider', 'consumer'].includes(role)) {
      this.setData({
        selectedRole: role
      })
    }
  },

  // 选择角色
  onRoleSelect(e) {
    const roleId = e.currentTarget.dataset.roleId
    this.setData({
      selectedRole: roleId
    })
  },

  // 确认角色选择
  async onConfirmRole() {
    if (!this.data.selectedRole) {
      wx.showToast({
        title: '请选择您的角色',
        icon: 'none'
      })
      return
    }

    if (this.data.submitting) return

    this.setData({ submitting: true })

    try {
      const result = await promotionService.selectRole(this.data.selectedRole)
      
      wx.showToast({
        title: '选择成功',
        icon: 'success'
      })

      // 根据后端返回的重定向URL跳转
      setTimeout(() => {
        if (result.redirectUrl) {
          if (result.redirectUrl.includes('services')) {
            // 跳转到服务页面（tab页面）
            wx.switchTab({
              url: result.redirectUrl
            })
          } else {
            // 跳转到其他页面
            wx.navigateTo({
              url: result.redirectUrl
            })
          }
        } else {
          // 默认跳转
          if (this.data.selectedRole === 'provider') {
            wx.navigateTo({
              url: '/pages/application/application'
            })
          } else {
            wx.switchTab({
              url: '/pages/services/services'
            })
          }
        }
      }, 1500)

    } catch (error) {
      console.error('角色选择失败:', error)
      
      wx.showToast({
        title: error.message || '选择失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 了解更多
  onLearnMore(e) {
    const roleId = e.currentTarget.dataset.roleId
    const role = this.data.roles.find(r => r.id === roleId)
    
    if (!role) return

    let content = `${role.description}\n\n主要特点：\n`
    role.features.forEach((feature, index) => {
      content += `${index + 1}. ${feature}\n`
    })

    wx.showModal({
      title: role.title,
      content: content,
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 联系客服
  onContactService() {
    wx.showActionSheet({
      itemList: ['拨打客服电话', '复制客服微信', '查看常见问题'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 拨打电话
            wx.makePhoneCall({
              phoneNumber: '400-123-4567',
              fail: () => {
                wx.showToast({
                  title: '拨号失败',
                  icon: 'none'
                })
              }
            })
            break
          case 1:
            // 复制微信号
            wx.setClipboardData({
              data: 'smartgarden2024',
              success: () => {
                wx.showToast({
                  title: '客服微信已复制',
                  icon: 'success'
                })
              }
            })
            break
          case 2:
            // 查看常见问题
            this.showFAQ()
            break
        }
      }
    })
  },

  // 显示常见问题
  showFAQ() {
    wx.showModal({
      title: '常见问题',
      content: 'Q: 两种角色有什么区别？\nA: B端用户提供用地资源获得收益，C端用户租用菜园享受种植。\n\nQ: 可以同时选择两种角色吗？\nA: 可以，您可以既提供用地又租用菜园。\n\nQ: 如何修改角色选择？\nA: 请联系客服进行修改。',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  // 跳过选择
  onSkipSelection() {
    wx.showModal({
      title: '跳过选择',
      content: '您可以稍后在个人中心重新选择角色，现在先体验基础功能。',
      confirmText: '确定跳过',
      cancelText: '继续选择',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      }
    })
  },

  // 获取角色样式类
  getRoleClass(roleId) {
    return this.data.selectedRole === roleId ? 'selected' : ''
  },

  // 获取角色颜色
  getRoleColor(roleId) {
    const role = this.data.roles.find(r => r.id === roleId)
    return role ? role.color : '#666'
  }
})