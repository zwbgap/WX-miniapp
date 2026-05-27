# 全局优化报告

## 一、优化概览

本次优化覆盖性能、用户体验、代码质量、安全四大维度，新增 3 个通用组件和 2 个工具模块。

---

## 二、性能优化

### 2.1 数据缓存策略 (`utils/optimize.js` → `cache`)

| 方法 | 功能 | 说明 |
|------|------|------|
| `cache.set(key, data, expireMs)` | 写入缓存 | 默认 5 分钟过期，同时写内存 + storage |
| `cache.get(key)` | 读取缓存 | 优先内存，降级到 storage，自动检查过期 |
| `cache.remove(key)` | 清除单项 | 同时清除内存和 storage |
| `cache.clearAll()` | 清空全部 | 扫描 storage 前缀 `_cache_` 批量删除 |

**使用示例：**
```javascript
var optimize = require('../../utils/optimize');
var cached = optimize.cache.get('news-list');
if (cached) {
  this.setData({ newsList: cached });
  return;
}
var data = await http.get('/api/news/list');
optimize.cache.set('news-list', data, 300000);
```

### 2.2 函数节流与防抖

| 方法 | 用途 |
|------|------|
| `debounce(fn, delay)` | 搜索输入、滚动事件防抖 |
| `throttle(fn, interval)` | 按钮点击、下拉刷新节流 |

### 2.3 页面预加载 (`preloadPage`)

在 `app.js` 的 `onLaunch` 中预加载首页/资讯/个人中心三个 Tab 页面，减少用户切换时的白屏等待。

### 2.4 批量 setData (`batchSetData`)

返回 Promise，避免高频 setData 导致渲染阻塞。

### 2.5 性能测量 (`measurePerformance`)

```javascript
var perf = optimize.measurePerformance('加载健康档案');
perf.start();
await loadRecords();
perf.end(); // 超过 500ms 会 console.warn
```

### 2.6 过期存储 (`setStorageWithExpire` / `getStorageWithExpire`)

支持带过期时间的本地存储，适合缓存临时的会话数据。

---

## 三、用户体验优化

### 3.1 全局加载组件 (`components/loading/`)

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | String | `spinner` | spinner / dots / skeleton |
| `text` | String | `数据加载中...` | 加载提示文字 |
| `fullscreen` | Boolean | `false` | 是否全屏遮罩 |
| `visible` | Boolean | `true` | 是否显示 |

**三种加载样式：**
- `spinner` — 旋转圆环动画
- `dots` — 三点弹跳动画
- `skeleton` — 骨架屏（shimmer 效果）

**使用示例：**
```xml
<loading type="spinner" text="加载中..." visible="{{loading}}" />
<loading type="skeleton" visible="{{loading}}" />
```

### 3.2 空状态组件 (`components/empty-state/`)

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | String | `default` | 预设类型：default/record/reminder/news/network |
| `title` | String | 自动填充 | 自定义标题 |
| `description` | String | 自动填充 | 自定义描述 |
| `showBtn` | Boolean | `false` | 是否显示操作按钮 |
| `btnText` | String | `刷新` | 按钮文字 |

**events:** `bind:action` — 操作按钮点击

**使用示例：**
```xml
<empty-state type="reminder" showBtn bind:action="onAdd" />
<empty-state title="没有找到" description="换个关键词试试" />
```

### 3.3 错误提示组件 (`components/error-handler/`)

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | Boolean | `false` | 是否显示 |
| `type` | String | `network` | network/server/permission/empty/timeout |
| `message` | String | `''` | 自定义错误信息 |
| `showRetry` | Boolean | `true` | 是否显示重试按钮 |
| `retryText` | String | `重试` | 重试按钮文字 |

**events:** `bind:retry` — 重试按钮点击

**使用示例：**
```xml
<error-handler
  visible="{{hasError}}"
  type="network"
  showRetry
  bind:retry="onRetry"
/>
```

### 3.4 网络状态监控

`app.js` 中 `initNetworkMonitor()` 实时监听网络变化，断网时弹 Toast 提示。`app.globalData.networkStatus` 供全局判断。

### 3.5 全局错误捕获

`app.js` → `onError(error)` + `onPageNotFound(res)` 兜底处理。

---

## 四、代码优化

### 4.1 通用组件提取

| 组件 | 路径 | 可替代的页面级代码 |
|------|------|---------------------|
| `loading` | `components/loading/` | 各页面的 `van-loading` + 骨架屏 |
| `empty-state` | `components/empty-state/` | 各页面的 `van-empty` 自定义样式 |
| `error-handler` | `components/error-handler/` | 各页面的错误处理模板 |
| `comment-list` | `components/comment-list/` | 资讯评论嵌套展示 |
| `ec-canvas` | `components/ec-canvas/` | 图表渲染 |

### 4.2 工具函数封装

| 模块 | 文件 | 核心功能 |
|------|------|----------|
| HTTP 请求 | `utils/request.js` | 统一拦截 + Token 刷新 + 错误处理 |
| Token 管理 | `utils/token.js` | Token 读写 + JWT 解析 + 刷新队列 |
| 认证工具 | `utils/auth.js` | 登录状态 + 权限判断 |
| 性能优化 | `utils/optimize.js` | 缓存 + 防抖节流 + 预加载 + 批次 setData |
| 安全工具 | `utils/security.js` | 脱敏 + 加密 + 权限 + XSS 过滤 |

### 4.3 目录结构

```
WX/
├── app.js / app.json / app.wxss    # 应用入口
├── utils/
│   ├── request.js                   # HTTP 请求模块
│   ├── token.js                     # Token 管理
│   ├── auth.js                      # 认证工具
│   ├── optimize.js                  # 性能优化 ⭐新增
│   ├── security.js                  # 安全工具 ⭐新增
│   └── chart-helper.js             # 图表工具
├── components/
│   ├── loading/                     # 加载组件 ⭐新增
│   ├── empty-state/                 # 空状态组件 ⭐新增
│   ├── error-handler/               # 错误组件 ⭐新增
│   ├── comment-list/               # 评论组件
│   └── ec-canvas/                  # 图表组件
├── pages/
│   ├── index/                       # 首页
│   ├── login/ / register/           # 登录/注册
│   ├── profile/                     # 个人中心
│   ├── health-record/              # 健康档案
│   ├── vaccine-reminder/           # 疫苗提醒
│   ├── sleep-record/               # 睡眠记录
│   ├── health-news/                 # 健康资讯
│   ├── medication-reminder/        # 用药提醒
│   ├── physical-exam/              # 体检报告
│   └── statistics/                 # 数据统计
└── images/                          # 静态资源
```

---

## 五、安全优化

### 5.1 信息脱敏 (`utils/security.js`)

| 方法 | 输入 | 输出 |
|------|------|------|
| `maskPhone('13812345678')` | 13812345678 | 138****5678 |
| `maskIdCard('320123199001011234')` | 320123199001011234 | 3201**********1234 |
| `maskName('张三丰')` | 张三丰 | 张*丰 |
| `maskEmail('abc@test.com')` | abc@test.com | ab***@test.com |

### 5.2 请求加密 (`simpleEncrypt` / `simpleDecrypt`)

基于 XOR + Base64 的简单加密，适合本地敏感数据存储。

### 5.3 安全存储 (`secureStore` / `secureRead`)

自动加密后存入 storage，读取时自动解密。

### 5.4 权限控制 (`checkPermission`)

```javascript
var security = require('../../utils/security');
if (!security.checkPermission('delete', userInfo)) {
  wx.showToast({ title: '无操作权限', icon: 'none' });
  return;
}
```

角色权限表：
| 角色 | view | edit | delete | export | manage |
|------|------|------|--------|--------|--------|
| admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| doctor | ✓ | ✓ | ✗ | ✓ | ✗ |
| user | ✓ | ✓ | 仅自删 | ✗ | ✗ |

### 5.5 XSS 过滤 (`sanitizeHtml`)

过滤富文本中的 `<script>`、`onerror`、`<iframe>` 等危险标签，适用于资讯详情页的富文本展示。

### 5.6 输入校验 (`validateInput`)

```javascript
security.validateInput('13812345678', 'phone')  // true
security.validateInput('test@qq.com', 'email')   // true
security.validateInput('abc', 'number')           // false
```

---

## 六、测试清单

### 6.1 功能测试

| 测试项 | 测试内容 | 状态 |
|--------|----------|------|
| 加载组件 | spinner / dots / skeleton 三种样式正常渲染 | ✅ |
| 空状态组件 | 5 种预设类型 + 自定义文案 | ✅ |
| 错误组件 | 5 种错误类型 + 重试回调 | ✅ |
| 缓存机制 | 写入 → 命中 → 过期 → 清除链路 | ✅ |
| 防抖节流 | 连续触发只执行一次 | ✅ |
| 脱敏 | 手机/身份证/姓名/邮箱脱敏输出 | ✅ |
| 加密 | 加密 → 解密 可逆 | ✅ |
| 权限检查 | admin/doctor/user 三级权限 | ✅ |

### 6.2 接口测试

| 接口 | 场景 | 预期 |
|------|------|------|
| 所有 GET 接口 | 首次请求 | 正常加载 + loading 显示 |
| 所有 GET 接口 | 缓存命中 | 秒加载，无 loading |
| 所有 GET 接口 | 网络断开 | 显示 error-handler(network) |
| 所有 POST 接口 | 权限不足 | toast "无操作权限" |
| 登录接口 | 网络异常 | toast + error 回调 |

### 6.3 兼容性测试

| 机型 | 屏幕尺寸 | 测试点 |
|------|----------|--------|
| iPhone 15 Pro | 393×852 | 刘海屏安全区适配 |
| iPhone SE | 375×667 | 小屏布局完整性 |
| Android 主流 | 1080×2400 | DPR 适配 + 加载性能 |
| iPad | 1024×1366 | 卡片整版布局 |

### 6.4 性能测试

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 首页加载 | < 1.5s | `measurePerformance` |
| 缓存命中 | < 100ms | 二次进入同页面 |
| setData 耗时 | < 50ms/次 | 开发者工具 Performance |
| 内存占用 | < 200MB | 真机调试 Memory |
| 包体积 | < 2MB | 开发者工具 代码包分析 |

---

## 七、迁移建议

1. 在各页面的 `.json` 中添加组件引用
2. 将页面中的 `van-loading` 替换为 `<loading type="skeleton">`
3. 将 `van-empty` 替换为 `<empty-state>` 获取统一样式
4. 添加 `error-handler` 处理网络异常状态
5. 在列表页请求前添加 `optimize.cache.get()` 检查
6. 敏感字段展示时使用 `security.maskXxx()` 脱敏
