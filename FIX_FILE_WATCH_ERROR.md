# 🔧 修复文件监听错误 (ENOENT)

## ❌ 错误原因：
`ENOENT: no such file or directory, watch 'debug_tmp_34220'`

这是 pnpm 临时文件的问题，Metro bundler 试图监听一个不存在的临时文件。

## ✅ 解决方案：

### 方法 1：直接使用 npx expo（推荐）

不使用 pnpm，直接运行：

```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --offline
```

### 方法 2：清理并重新安装

```bash
cd C:\Users\jingy\fyp-repo
pnpm install --force
```

### 方法 3：使用环境变量（PowerShell）

```powershell
cd C:\Users\jingy\fyp-repo\apps\mobile
$env:EXPO_NO_VERSION_CHECK='1'
npx expo start --offline
```

### 方法 4：完全清理 node_modules

```bash
cd C:\Users\jingy\fyp-repo
rmdir /s /q node_modules
pnpm install
```

---

## 🎯 推荐做法：

**直接使用 npx expo，不通过 pnpm：**

```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --offline
```

这样可以避免 pnpm 的文件监听问题。

