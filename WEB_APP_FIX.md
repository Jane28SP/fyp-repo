# 🔧 Web App 安装和启动指南

## ❌ 问题：
`npm install` 报错：`Unsupported URL Type "workspace:": workspace:*`

## ✅ 原因：
- Web 应用在 monorepo 中
- 根目录有 `pnpm-lock.yaml`
- npm 不支持 `workspace:*` 协议

## ✅ 解决方案：

### 方法 1：使用 pnpm 安装（推荐）

```powershell
cd C:\Users\jingy\fyp-repo
pnpm install
```

这会安装所有 workspace 的依赖（包括 web 和 mobile）。

然后启动 Web App：
```powershell
cd C:\Users\jingy\fyp-repo\apps\web
$env:DISABLE_ESLINT_PLUGIN='true'
npm start
```

### 方法 2：使用根目录脚本

```powershell
cd C:\Users\jingy\fyp-repo
npm run dev:web
```

这会自动处理依赖和启动。

---

## 🎯 重要提示：

**Web 应用使用 npm 启动，但依赖需要用 pnpm 安装**（因为它在 monorepo 中）。

---

## 📝 完整流程：

1. **安装依赖**：
   ```powershell
   cd C:\Users\jingy\fyp-repo
   pnpm install
   ```

2. **启动 Web App**：
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

---

## ⚠️ 如果还有 ESLint 错误：

确保 `.env` 文件存在：
```
DISABLE_ESLINT_PLUGIN=true
```

或使用 PowerShell 脚本：
```powershell
cd C:\Users\jingy\fyp-repo\apps\web
.\start-web.ps1
```

