# 个人健康档案管理系统 - 微信小程序

## 项目简介

个人健康档案管理系统微信小程序，对接 SpringBoot 后端 RESTful API，为用户提供健康档案管理、疫苗提醒、睡眠记录、用药提醒、体检报告管理和健康资讯浏览等功能。

## 技术栈

- **框架**: 微信小程序原生开发
- **UI 组件库**: [Vant Weapp](https://vant-ui.github.io/vant-weapp/)
- **认证机制**: JWT Token + 微信登录
- **后端**: SpringBoot RESTful API

## 项目结构

```
├── app.js                      # 小程序入口，全局逻辑
├── app.json                    # 小程序配置（页面路由、窗口样式、tabBar等）
├── app.wxss                    # 全局样式
├── project.config.json         # 项目配置文件
├── sitemap.json                # 站点地图
├── utils/
│   ├── auth.js                 # 认证工具类（Token管理、JWT解析）
│   └── request.js              # HTTP请求封装（拦截器、Token自动刷新）
├── pages/
│   ├── index/                  # 首页 - 功能导航与健康概览
│   ├── login/                  # 登录页 - 微信一键登录
│   ├── health-record/          # 健康档案 - 档案列表管理
│   ├── vaccine-reminder/       # 疫苗提醒 - 疫苗接种提醒管理
│   ├── sleep-record/           # 睡眠记录 - 睡眠数据管理
│   ├── health-news/            # 健康资讯 - 资讯浏览
│   ├── medication-reminder/    # 用药提醒 - 用药提醒管理
│   ├── physical-exam/          # 体检报告 - 体检报告管理
│   └── profile/                # 个人中心 - 用户信息与设置
├── components/                 # 自定义组件目录
└── images/                     # 图片资源目录
```

## 快速开始

### 环境要求

- 微信开发者工具（最新版）
- Node.js >= 12
- npm >= 6

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd health-record-miniapp
```

2. **安装 Vant Weapp**

```bash
npm init -y
npm install @vant/weapp -S --production
```

3. **构建 npm 包**

在微信开发者工具中：
- 点击菜单栏 `工具` -> `构建 npm`
- 等待构建完成

4. **配置 AppID**

修改 [project.config.json](project.config.json) 中的 `appid` 字段为你的小程序 AppID。

5. **启动后端服务**

确保 SpringBoot 后端服务已在 `http://localhost:8080` 启动。

6. **运行项目**

使用微信开发者工具打开项目根目录，点击编译即可。

## 后端 API 对接说明

### 基础配置

- **Base URL**: `http://localhost:8080`
- 可在 `utils/request.js` 中修改 `BASE_URL` 变量

### 认证流程

1. 用户点击微信一键登录
2. 调用 `wx.login()` 获取临时 code
3. 将 code 发送到后端 `POST /login` 接口
4. 后端验证后返回 `token`、`refreshToken` 和 `userInfo`
5. 前端将 token 存储在本地 storage 中
6. 后续所有请求自动在 Header 中携带 `Authorization: Bearer {token}`

### Token 自动刷新机制

当请求返回 401 状态码时：

1. 检查是否已有刷新请求在进行中（防止并发刷新）
2. 使用 `refreshToken` 调用 `POST /refresh-token` 刷新 token
3. 刷新成功后重试原请求
4. 其他并发请求等待 token 刷新完成后自动重试
5. 刷新失败则清除登录状态，跳转到登录页

### API 接口约定

| 接口路径 | 方法 | 说明 |
|---------|------|------|
| `/login` | POST | 微信登录 |
| `/register` | POST | 用户注册 |
| `/refresh-token` | POST | 刷新Token |
| `/health-record` | GET/POST | 健康档案列表/新增 |
| `/health-record/:id` | GET/PUT/DELETE | 健康档案详情/更新/删除 |
| `/health-record/overview` | GET | 健康概览 |
| `/vaccine-reminder` | GET/POST | 疫苗提醒列表/新增 |
| `/vaccine-reminder/:id` | GET/PUT/DELETE | 疫苗提醒详情/更新/删除 |
| `/vaccine-reminder/count` | GET | 疫苗提醒数量 |
| `/sleep-record` | GET/POST | 睡眠记录列表/新增 |
| `/sleep-record/:id` | GET/PUT/DELETE | 睡眠记录详情/更新/删除 |
| `/health-news` | GET | 健康资讯列表 |
| `/health-news/:id` | GET | 健康资讯详情 |
| `/medication-reminder` | GET/POST | 用药提醒列表/新增 |
| `/medication-reminder/:id` | GET/PUT/DELETE | 用药提醒详情/更新/删除 |
| `/medication-reminder/count` | GET | 用药提醒数量 |
| `/physical-exam` | GET/POST | 体检报告列表/新增 |
| `/physical-exam/:id` | GET/PUT/DELETE | 体检报告详情/更新/删除 |

### 数据返回格式

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

## utils/request.js 使用示例

```javascript
const http = require('../../utils/request');

// GET 请求
const data = await http.get('/health-record', { page: 1, pageSize: 10 });

// POST 请求
await http.post('/health-record', { title: '血压记录', value: '120/80' });

// PUT 请求
await http.put('/health-record/1', { title: '更新标题' });

// DELETE 请求
await http.delete('/health-record/1');

// 文件上传
await http.upload('/upload', tempFilePath, 'file', { type: 'report' });
```

## utils/auth.js 使用示例

```javascript
const auth = require('../../utils/auth');

// 检查登录状态
if (auth.isLoggedIn()) { /* ... */ }

// 获取Token
const token = auth.getToken();

// 判断Token是否过期
if (auth.isTokenExpired()) { /* ... */ }

// 解析JWT载荷
const payload = auth.parseJwtPayload(token);

// 清除所有认证信息
auth.clearAll();
```

## 注意事项

1. 调试时可在 `project.config.json` 中将 `urlCheck` 设为 `false`，关闭域名校验
2. 正式发布前需要将请求域名添加到微信小程序后台的 request 合法域名中
3. tabBar 的 iconPath 图标需要自行准备放入 `images/` 目录
4. 各列表页面只实现了基础骨架，详情页和编辑页需要根据实际业务扩展
5. Vant Weapp 组件已在 `app.json` 中全局注册，页面中按需在 `usingComponents` 中引用
