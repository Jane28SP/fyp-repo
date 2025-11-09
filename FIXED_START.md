# ✅ 修复后的启动方法

## 问题原因：
1. ❌ 使用了旧的全局 `expo-cli`（已弃用，不支持 Node 17+）
2. ❌ JSON 解析错误

## ✅ 解决方案：

### 方法 1：使用修复后的批处理文件（推荐）

双击运行：
```
C:\Users\jingy\fyp-repo\apps\mobile\start-fixed.bat
```

### 方法 2：在终端运行

```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx --yes expo@latest start --offline
```

### 方法 3：先卸载旧版本

```bash
npm uninstall -g expo-cli
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --offline
```

---

## ⚠️ 重要提示：

**不要使用** `expo` 命令（这是旧的全局版本）

**要使用** `npx expo` 或 `npx expo@latest`（这是新的本地版本）

---

## 等待 30-40 秒

启动后会显示：
- ✅ QR 码
- ✅ 链接：`exp://192.168.x.x:8081`

