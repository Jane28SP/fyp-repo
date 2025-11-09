# 🔧 修复 npm install 错误

## ❌ 错误：
```
npm error Unsupported URL Type "workspace:": workspace:*
```

## ✅ 原因：
- Web 应用是 monorepo 的一部分
- npm 不支持 `workspace:*` 协议（只有 pnpm 和 yarn 支持）
- 需要使用 pnpm 来安装依赖

## ✅ 解决方案：

### 方法 1：使用 pnpm（推荐）

```powershell
cd C:\Users\jingy\fyp-repo
pnpm --filter web install
```

然后启动：
```powershell
cd C:\Users\jingy\fyp-repo\apps\web
$env:DISABLE_ESLINT_PLUGIN='true'
npm start
```

### 方法 2：从根目录安装所有依赖

```powershell
cd C:\Users\jingy\fyp-repo
pnpm install
```

这会安装所有 workspace 的依赖。

### 方法 3：如果必须用 npm

需要手动移除所有 `workspace:*` 依赖，但这样会破坏 monorepo 结构。

---

## 🎯 推荐做法：

**始终使用 pnpm 来管理依赖**，因为这是 monorepo 项目。

---

## 📝 启动 Web App：

```powershell
cd C:\Users\jingy\fyp-repo
npm run dev:web
```

或：

```powershell
cd C:\Users\jingy\fyp-repo\apps\web
$env:DISABLE_ESLINT_PLUGIN='true'
npm start
```

