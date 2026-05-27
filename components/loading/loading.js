Component({
  properties: {
    text: {
      type: String,
      value: '数据加载中...'
    },
    type: {
      type: String,
      value: 'spinner'
    },
    fullscreen: {
      type: Boolean,
      value: false
    },
    visible: {
      type: Boolean,
      value: true
    }
  }
});
