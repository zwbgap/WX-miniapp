var EMPTY_CONFIGS = {
  default: {
    title: '暂无数据',
    description: ''
  },
  record: {
    title: '暂无记录',
    description: '添加您的第一条记录吧'
  },
  reminder: {
    title: '暂无提醒',
    description: '点击下方按钮添加提醒'
  },
  news: {
    title: '暂无资讯',
    description: '敬请期待更多内容'
  },
  network: {
    title: '网络连接失败',
    description: '请检查网络后重试',
    icon: 'wifi-o'
  }
};

Component({
  properties: {
    type: {
      type: String,
      value: 'default'
    },
    title: {
      type: String,
      value: ''
    },
    description: {
      type: String,
      value: ''
    },
    iconName: {
      type: String,
      value: ''
    },
    showBtn: {
      type: Boolean,
      value: false
    },
    btnText: {
      type: String,
      value: '刷新'
    }
  },

  data: {
    finalTitle: '',
    finalDesc: '',
    finalIcon: ''
  },

  observers: {
    'type, title, description': function(t, ti, desc) {
      var config = EMPTY_CONFIGS[t] || EMPTY_CONFIGS.default;
      this.setData({
        finalTitle: ti || config.title,
        finalDesc: desc || config.description,
        finalIcon: this.data.iconName || config.icon || 'inbox-o'
      });
    }
  },

  methods: {
    onAction() {
      this.triggerEvent('action');
    }
  }
});
