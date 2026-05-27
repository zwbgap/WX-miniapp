# 健康小助手 - 微信小程序

## 项目简介

健康小助手是一款功能丰富的微信小程序，提供健康档案管理、AI健康咨询、健康资讯浏览、疫苗提醒、用药提醒、睡眠记录、数据统计等全方位的健康管理服务。采用云开发架构，无需自建后端服务器。

## 技术栈

- **框架**: 微信小程序原生开发
- **UI 组件库**: [Vant Weapp](https://vant-ui.github.io/vant-weapp/)
- **后端**: 微信云开发（云函数、云数据库）
- **AI 服务**: DeepSeek API 智能问诊

## 项目统计

- **代码行数**: 约 19,500 行
- **主要模块**: 12 个功能模块
- **云函数**: 15+ 个

## 项目结构

```
├── app.js                      # 小程序入口，全局逻辑
├── app.json                    # 小程序配置（页面路由、窗口样式、tabBar等）
├── app.wxss                    # 全局样式
├── project.config.json         # 项目配置文件
├── sitemap.json                # 站点地图
├── cloudfunctions/             # 云函数目录
│   ├── accountLogin/          # 账号登录
│   ├── register/             # 用户注册
│   ├── addHealthRecord/      # 添加健康档案
│   ├── getHealthRecords/     # 获取健康档案
│   ├── updateHealthRecord/   # 更新健康档案
│   ├── deleteHealthRecord/   # 删除健康档案
│   ├── getVaccines/          # 获取疫苗提醒
│   ├── addVaccine/           # 添加疫苗提醒
│   ├── updateVaccine/        # 更新疫苗提醒
│   ├── deleteVaccine/        # 删除疫苗提醒
│   ├── getMedicationReminders/ # 获取用药提醒
│   ├── addMedicationReminder/ # 添加用药提醒
│   ├── aiConsultation/       # AI健康咨询（DeepSeek）
│   ├── generateHealthNews/   # 生成健康资讯
│   ├── newsFavorite/         # 资讯收藏
│   └── updateUser/           # 更新用户信息
├── pages/
│   ├── index/                 # 首页 - 功能导航与健康概览
│   ├── login/                 # 登录页 - 账号登录
│   ├── health-record/         # 健康档案 - 档案列表管理
│   │   ├── index/             # 档案列表
│   │   ├── detail/            # 档案详情
│   │   └── edit/              # 编辑档案
│   ├── vaccine-reminder/      # 疫苗提醒
│   │   ├── index/             # 疫苗列表
│   │   ├── add/               # 添加疫苗
│   │   └── list/              # 提醒列表
│   ├── sleep-record/          # 睡眠记录
│   │   └── index/             # 睡眠记录管理
│   ├── health-news/           # 健康资讯
│   │   ├── index/             # 资讯首页
│   │   ├── list/              # 资讯列表
│   │   ├── detail/            # 资讯详情
│   │   └── favorites/         # 我的收藏
│   ├── ai-consult/            # AI健康咨询
│   ├── medication-reminder/    # 用药提醒
│   │   ├── index/             # 提醒首页
│   │   └── setting/           # 设置提醒
│   ├── statistics/            # 数据统计
│   ├── physical-exam/         # 体检报告
│   └── profile/               # 个人中心
│       ├── index/             # 个人信息
│       ├── edit-profile/      # 快速编辑
│       ├── settings/          # 设置
│       └── about/             # 关于我们
├── components/                 # 自定义组件目录
└── images/                     # 图片资源目录
```

## 功能模块

### 1. 用户模块
- 账号注册与登录
- 个人信息管理
- 头像自动生成（多种风格）
- 快速编辑常用信息

### 2. 健康档案
- 个人信息：姓名、年龄、血型、身高、体重
- 生活方式：吸烟、饮酒、运动、睡眠、饮食习惯
- 家族病史：高血压、糖尿病、心脏病等
- 应急信息：紧急联系人、医保类型、植入器械
- 用药信息：用药类型、药物名称、过敏史
- 支持新增、编辑、详情查看

### 3. AI健康咨询
- 接入 DeepSeek API 智能问诊
- 可爱的迷你机器人医生形象
- 支持多轮对话上下文记忆
- 退出咨询自动清空历史记录
- 消息排版美化，无星号

### 4. 健康资讯
- DeepSeek AI 每日自动生成5篇健康热点
- 精美配图自动匹配
- 收藏功能（云端保存，跨设备同步）
- 阅读量统计
- 分享功能

### 5. 疫苗提醒
- 疫苗接种记录管理
- 接种状态跟踪（待接种/已接种/已过期）
- 长按删除记录
- 弹窗提醒功能

### 6. 用药提醒
- 多个用药时间设置
- 时间选择器
- 弹窗提醒
- 支持修改已有提醒

### 7. 睡眠记录
- 睡眠时长记录
- 睡眠质量追踪
- 数据可视化展示

### 8. 数据统计
- 健康数据图表展示
- 睡眠趋势分析
- 体重变化记录
- 档案数量统计

## 云数据库集合

| 集合名称 | 说明 |
|---------|------|
| `users` | 用户信息 |
| `health_records` | 健康档案 |
| `vaccine_reminders` | 疫苗提醒 |
| `medication_reminders` | 用药提醒 |
| `sleep_records` | 睡眠记录 |
| `health_news` | 健康资讯 |
| `news_favorites` | 资讯收藏 |
| `ai_conversations` | AI对话记录 |

## 快速开始

### 环境要求

- 微信开发者工具（最新版）
- 已开通云开发能力
- Node.js >= 12

### 安装步骤

1. **克隆项目**

```bash
git clone <repository-url>
cd WX
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

5. **开通云开发**

- 登录微信公众平台
- 进入「开发」→「开发管理」→「开发设置」
- 找到「云开发」选项，开通云开发能力

6. **创建数据库集合**

在云开发控制台中创建以下集合：
- `users`
- `health_records`
- `vaccine_reminders`
- `medication_reminders`
- `sleep_records`
- `health_news`
- `news_favorites`
- `ai_conversations`

7. **部署云函数**

在微信开发者工具中，右键点击 `cloudfunctions` 文件夹下的每个云函数，选择「上传并部署：云端安装依赖」。

需要部署的云函数：
- `accountLogin`
- `register`
- `addHealthRecord`
- `getHealthRecords`
- `updateHealthRecord`
- `deleteHealthRecord`
- `getVaccines`
- `addVaccine`
- `updateVaccine`
- `deleteVaccine`
- `getMedicationReminders`
- `addMedicationReminder`
- `updateMedicationReminder`
- `deleteMedicationReminder`
- `aiConsultation`
- `generateHealthNews`
- `newsFavorite`
- `updateUser`
- `updateNewsView`

8. **配置 AI 服务**

在云开发控制台中为 `aiConsultation` 和 `generateHealthNews` 云函数配置环境变量：
- `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key
- `DEEPSEEK_BASE_URL`: DeepSeek API 地址（可选，默认为官方地址）

9. **运行项目**

使用微信开发者工具打开项目根目录，点击编译即可。

## 云函数超时配置

部分云函数（如 AI 咨询、资讯生成）可能需要较长处理时间，建议在云开发控制台中将超时时间设置为 60 秒。

## 主要页面预览

### 首页
- 用户头像与账号信息
- 快捷功能入口（健康档案、疫苗提醒、用药提醒、睡眠记录、数据统计等）
- 健康资讯轮播展示
- AI 健康咨询入口

### 健康档案
- 生活方式记录
- 家族病史登记
- 应急信息管理
- 用药信息登记

### AI 健康咨询
- 可爱机器人医生形象
- 智能对话交互
- 上下文记忆

### 个人中心
- 头像自动生成
- 快速编辑常用信息
- 收藏资讯管理
- 各项健康服务入口

## 更新日志

### v2.0（当前版本）
- 全面迁移至云开发架构
- 新增 AI 健康咨询功能（DeepSeek）
- 新增健康资讯自动生成
- 新增资讯收藏功能（云端同步）
- 重构健康档案模块，扩充信息类别
- 新增快速编辑页面
- 优化数据统计图表展示
- 代码优化与性能提升

### v1.0
- 基础功能实现
- 健康档案管理
- 疫苗提醒
- 用药提醒
- 睡眠记录

## 注意事项

1. 首次部署云函数需要手动上传并安装依赖
2. AI 相关功能需要配置 DeepSeek API Key
3. 部分页面需要用户登录后才能使用
4. Vant Weapp 组件已在 `app.json` 中全局注册
5. 头像使用 DiceBear API 随机生成多种风格
6. 资讯配图使用 Picsum Photos 随机图片服务