const { ensureAdmin } = require('../../../utils/security');

function formatDate(dateObj) {
  if (!dateObj) return '未知时间';
  
  if (typeof dateObj === 'string') {
    const date = new Date(dateObj);
    if (!isNaN(date.getTime())) {
      return formatDate(date);
    }
    return dateObj;
  }
  
  if (dateObj.$date) {
    return formatDate(dateObj.$date);
  }
  
  if (dateObj instanceof Date) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  
  return String(dateObj);
}

Page({
  data: {
    loading: false,
    doctor: null,
    doctorId: '',
    formattedCreatedAt: '',
    inviteCode: ''
  },

  onLoad(options) {
    if (!ensureAdmin()) return;
    
    if (options.doctorId) {
      this.setData({ doctorId: options.doctorId });
      this.loadDoctorInfo();
    }
  },

  onShow() {
    ensureAdmin();
  },

  async loadDoctorInfo() {
    if (!this.data.doctorId) return;
    
    this.setData({ loading: true });
    try {
      const db = wx.cloud.database();
      const result = await db.collection('users').doc(this.data.doctorId).get();
      
      if (result.data) {
        const doctor = result.data;
        let inviteCode = doctor.inviteCode || '';
        
        // 如果没有邀请码，从doctor_invites集合查询
        if (!inviteCode && doctor.account) {
          const inviteResult = await db.collection('doctor_invites')
            .where({ usedBy: doctor.account })
            .get();
          
          if (inviteResult.data.length > 0) {
            inviteCode = inviteResult.data[0].code;
          }
        }
        
        this.setData({
          doctor: doctor,
          formattedCreatedAt: formatDate(doctor.createdAt),
          inviteCode: inviteCode
        });
      } else {
        wx.showToast({ title: '医生不存在', icon: 'none' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      }
    } catch (err) {
      console.error('加载医生信息失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onEditDoctor() {
    wx.navigateTo({
      url: `/pages/doctor/profile/profile?doctorId=${this.data.doctorId}&mode=admin`
    });
  }
});