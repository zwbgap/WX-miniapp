Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    type: {
      type: String,
      value: 'network'
    },
    message: {
      type: String,
      value: ''
    },
    showRetry: {
      type: Boolean,
      value: true
    },
    retryText: {
      type: String,
      value: '重试'
    }
  },

  data: {
    errorConfig: {
      network: {
        title: '网络异常',
        desc: '请检查网络连接后重试',
        icon: 'wifi-o'
      },
      server: {
        title: '服务器繁忙',
        desc: '服务器暂时无法响应，请稍后再试',
        icon: 'warning-o'
      },
      permission: {
        title: '权限不足',
        desc: '您没有访问此功能的权限',
        icon: 'lock'
      },
      empty: {
        title: '暂无内容',
        desc: '这里还没有任何内容',
        icon: 'inbox-o'
      },
      timeout: {
        title: '请求超时',
        desc: '请求响应超时，请重试',
        icon: 'clock-o'
      }
    }
  },

  methods: {
    onRetry() {
      this.triggerEvent('retry');
    },

    onClose() {
      this.triggerEvent('close');
    }
  }
});
