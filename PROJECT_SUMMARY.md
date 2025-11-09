# 🎓 FYP 项目总结

## 📋 项目名称
Event Booking System - Web + Mobile

---

## 🏗️ 技术架构

### Frontend
- **Web**: React + TypeScript (Create React App)
- **Mobile**: React Native + Expo
- **共享**: Supabase Backend

### Backend
- **数据库**: Supabase PostgreSQL
- **认证**: Supabase Auth
- **实时API**: Supabase Realtime

### 工具
- **包管理**: pnpm (monorepo)
- **版本控制**: Git + GitHub
- **部署**: 
  - Web: 可部署到 Vercel/Netlify
  - Mobile: 可通过 EAS Build 生成 APK/IPA

---

## 📁 项目结构

```
fyp-repo/
├── apps/
│   ├── web/                # Web 应用 (React + TypeScript)
│   │   ├── src/
│   │   │   ├── components/ # 所有 React 组件
│   │   │   ├── lib/        # Supabase 客户端
│   │   │   ├── utils/      # 工具函数
│   │   │   └── App.tsx     # 主应用
│   │   └── package.json
│   │
│   └── mobile/             # Mobile 应用 (React Native + Expo)
│       ├── src/
│       │   ├── screens/    # 所有页面
│       │   ├── types/      # TypeScript 类型
│       │   └── supabaseClient.ts
│       ├── App.tsx
│       └── package.json
│
├── packages/               # 共享包（目前未使用）
│   ├── api-client/         # Supabase API 客户端
│   └── shared/             # 共享类型和模式
│
├── .env                    # 环境变量（Supabase 配置）
├── package.json            # 根配置
├── pnpm-workspace.yaml     # pnpm workspace 配置
└── .npmrc                  # npm 配置
```

---

## 🚀 启动指南

### 1. 安装依赖
```powershell
cd C:\Users\jingy\fyp-repo
pnpm install
```

### 2. 启动 Web App
```powershell
cd C:\Users\jingy\fyp-repo
npm run dev:web
```
- 浏览器自动打开：`http://localhost:3000`

### 3. 启动 Mobile App
```powershell
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --tunnel
```
- 用 Expo Go 扫描 QR 码

---

## ✨ 主要功能

### 用户功能
- ✅ 用户注册和登录
- ✅ 浏览活动列表
- ✅ 搜索和筛选活动
- ✅ 查看活动详情
- ✅ 添加活动到购物车
- ✅ 预订活动
- ✅ 查看预订历史
- ✅ 用户仪表板

### 组织者功能
- ✅ 创建和管理活动
- ✅ 查看预订统计
- ✅ 活动分析（图表）
- ✅ 参与者管理
- ✅ 签到扫描（QR 码）
- ✅ 促销代码管理
- ✅ 收入追踪

### Web 和 Mobile 共享
- ✅ 使用同一个 Supabase 后端
- ✅ 数据实时同步
- ✅ 相同的用户账号
- ✅ 相同的活动数据

---

## 🎯 项目特点

1. **跨平台支持**
   - Web 浏览器访问
   - Mobile 原生体验（iOS/Android）

2. **实时数据同步**
   - Web 和 Mobile 数据实时同步
   - 使用 Supabase Realtime

3. **现代技术栈**
   - React 19
   - TypeScript
   - React Native
   - Expo

4. **易于部署**
   - Web: 一键部署到 Vercel
   - Mobile: EAS Build 生成 APK/IPA

---

## 📊 数据库表

- **users**: 用户信息
- **events**: 活动信息
- **bookings**: 预订记录
- **promo_codes**: 促销代码
- **attendance**: 签到记录
- **activity_log**: 活动日志

---

## 🔐 环境变量

### Web App (`.env` in `apps/web/`)
```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Mobile App (`.env` in `apps/mobile/`)
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📝 演示给老师

### 准备：
1. 启动 Web App
2. 启动 Mobile App（Expo Go）
3. 准备测试数据

### 演示流程：
1. **展示 Web 版本**
   - 用户注册/登录
   - 浏览活动
   - 预订流程
   - 组织者功能（如果有权限）

2. **展示 Mobile 版本**
   - 相同的登录账号
   - 相同的活动列表
   - 相同的预订历史

3. **展示同步功能**
   - 在 Web 上操作
   - 在 Mobile 上查看更新
   - 证明数据同步

---

## 🌐 GitHub 仓库
- 仓库地址：`https://github.com/your-username/fyp-repo`
- 包含完整代码和文档
- 老师可以克隆并测试

---

## 🎓 学习成果

通过这个项目，你学会了：
1. ✅ React + TypeScript 开发
2. ✅ React Native + Expo 移动开发
3. ✅ Supabase 后端服务
4. ✅ Monorepo 项目管理（pnpm）
5. ✅ Git 版本控制
6. ✅ 跨平台开发（Web + Mobile）
7. ✅ 实时数据同步
8. ✅ 响应式设计

---

## 🎉 项目完成

- ✅ Web App 运行正常
- ✅ Mobile App 运行正常
- ✅ 数据同步正常
- ✅ 代码已提交到 GitHub
- ✅ 准备好演示

祝你演示顺利！🚀

