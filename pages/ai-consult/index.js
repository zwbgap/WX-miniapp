Page({
  data: {
    messages: [],
    inputText: '',
    sending: false,
    sessionId: '',
    scrollToView: '',
    inputFocus: false,
    userInfo: null
  },

  onLoad: function() {
    var userInfo = wx.getStorageSync('userInfo');
    this.setData({ userInfo: userInfo || {} });
    var sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    this.setData({ sessionId: sessionId });
    this.addWelcomeMessage();
  },

  onUnload: function() {
    this.clearConversation();
  },

  onHide: function() {
    this.clearConversation();
  },

  clearConversation: function() {
    var that = this;
    var userId = this.getUserId();
    if (!userId) return;
    wx.cloud.callFunction({
      name: 'clearAIContext',
      data: {
        userId: userId
      }
    }).catch(function() {});
  },

  getUserId: function() {
    var userInfo = wx.getStorageSync('userInfo');
    return (userInfo && userInfo._id) ? userInfo._id : '';
  },

  addWelcomeMessage: function() {
    var welcomes = [
      '嗨～我是你的AI健康小助手小健 🤖💚\n有什么健康问题想问我呢？我会尽力帮你解答哦～\n\n小健温馨提示 🩺：\n我提供的建议仅供参考，紧急情况请及时就医哦！'
    ];
    var msg = {
      _id: 'welcome_' + Date.now(),
      role: 'assistant',
      content: welcomes[0],
      time: this.formatTime(new Date())
    };
    this.setData({ messages: [msg] });
  },

  onInput: function(e) {
    this.setData({ inputText: e.detail.value });
  },

  onSend: function() {
    var text = this.data.inputText.trim();
    if (!text || this.data.sending) return;

    var userId = this.getUserId();
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    var msgId = 'user_' + Date.now();
    var userMsg = {
      _id: msgId,
      role: 'user',
      content: text,
      time: this.formatTime(new Date())
    };

    var messages = this.data.messages;
    messages.push(userMsg);

    this.setData({
      messages: messages,
      inputText: '',
      sending: true,
      scrollToView: msgId
    });

    this.callAI(text);
  },

  callAI: async function(text) {
    var that = this;
    var userId = this.getUserId();
    var sessionId = this.data.sessionId;

    try {
      var result = await wx.cloud.callFunction({
        name: 'aiConsultation',
        data: {
          userId: userId,
          message: text,
          sessionId: sessionId
        }
      });

      var reply = '小健正在升级大脑呢 🤖✨ 请稍后再来问哦～';
      if (result.result && result.result.code === 0 && result.result.data) {
        reply = result.result.data.reply;
      }

      var aiMsgId = 'ai_' + Date.now();
      var aiMsg = {
        _id: aiMsgId,
        role: 'assistant',
        content: reply,
        time: that.formatTime(new Date())
      };

      var messages = that.data.messages;
      messages.push(aiMsg);
      that.setData({
        messages: messages,
        sending: false,
        scrollToView: aiMsgId
      });
    } catch (err) {
      console.error('[AI咨询] 调用失败:', err);
      var aiMsgId = 'ai_' + Date.now();
      var aiMsg = {
        _id: aiMsgId,
        role: 'assistant',
        content: '哎呀，网络不太好呢 🤖💦 请稍后再试哦～',
        time: that.formatTime(new Date())
      };
      var messages = that.data.messages;
      messages.push(aiMsg);
      that.setData({
        messages: messages,
        sending: false,
        scrollToView: aiMsgId
      });
    }
  },

  onClearChat: function() {
    var that = this;
    wx.showModal({
      title: '清空对话',
      content: '确定要清空当前对话吗？退出时也会自动清空哦～',
      success: function(res) {
        if (res.confirm) {
          that.clearConversation();
          that.setData({ messages: [] });
          that.addWelcomeMessage();
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  formatTime: function(d) {
    var h = String(d.getHours()).padStart(2, '0');
    var m = String(d.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }
});
