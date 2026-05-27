Component({
  properties: {
    list: {
      type: Array,
      value: []
    }
  },

  data: {
    commentTree: []
  },

  observers: {
    'list': function(list) {
      this.buildTree(list);
    }
  },

  methods: {
    buildTree(list) {
      if (!list || list.length === 0) {
        this.setData({ commentTree: [] });
        return;
      }

      var topLevel = [];
      var childrenMap = {};

      list.forEach(function(item) {
        if (item.parentId) {
          if (!childrenMap[item.parentId]) {
            childrenMap[item.parentId] = [];
          }
          childrenMap[item.parentId].push(item);
        } else {
          topLevel.push(item);
        }
      });

      var buildChildren = function(items) {
        return items.map(function(item) {
          return {
            id: item.id,
            userid: item.userid,
            nickname: item.nickname || item.avatarUrl || '用户',
            avatarUrl: item.avatarUrl || '',
            content: item.content,
            addtime: item.addtime,
            parentId: item.parentId,
            children: buildChildren(childrenMap[item.id] || [])
          };
        });
      };

      this.setData({
        commentTree: buildChildren(topLevel)
      });
    },

    onReply(e) {
      var item = e.currentTarget.dataset.item;
      this.triggerEvent('reply', item);
    },

    formatTime(dateStr) {
      if (!dateStr) return '';
      return dateStr.substring(0, 16);
    }
  }
});
