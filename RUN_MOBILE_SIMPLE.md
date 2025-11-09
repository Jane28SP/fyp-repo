# 📱 运行移动应用的简单步骤

## 🚀 快速启动（3步）

### 步骤 1：打开终端
在项目根目录打开 PowerShell 或 CMD

### 步骤 2：运行命令
```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --offline
```

### 步骤 3：等待 QR 码
等待 30-40 秒，你会看到：
- ✅ QR 码（大图）
- ✅ 链接：`exp://192.168.x.x:8081`

---

## 📱 在手机上连接

### 方法 1：自动检测（推荐）
1. 打开 **Expo Go** app（不是Safari！）
2. 确保手机和电脑在同一 WiFi
3. 在 "Development servers" 区域**下拉刷新**
4. 等待几秒，服务器会自动出现
5. 点击连接！

### 方法 2：手动输入
如果自动检测不到：
1. 在终端找到链接：`exp://192.168.x.x:8081`
2. 在 Expo Go 中手动输入这个链接

---

## ⚠️ 常见问题

### 问题1：连接超时
**解决**：使用 tunnel 模式
```bash
npx expo start --tunnel
```

### 问题2：看不到服务器
**解决**：
- 确保使用 **Expo Go**（不是Safari）
- 确保同一 WiFi
- 在 Expo Go 中下拉刷新

### 问题3：网络错误
**解决**：使用 `--offline` 标志（已经在用了）

---

## 🎯 最简单的命令

```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --offline
```

等待 QR 码出现，然后在 **Expo Go** 中连接！

