# 📱 如何启动 Mobile App

## 🚀 方法 1：使用批处理脚本（最简单）

### 步骤：
1. 打开文件夹：`C:\Users\jingy\fyp-repo\apps\mobile`
2. 双击运行：`start-mobile.bat`
3. 等待 30-60 秒，会显示 QR 码
4. 用 Expo Go 扫描 QR 码

---

## 🚀 方法 2：使用 PowerShell

### 打开新的 PowerShell 窗口，运行：
```powershell
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --tunnel
```

### 等待显示：
- QR 码（大图）
- 链接：`exp://xxx.tunnel.exp.direct:80`

---

## 🚀 方法 3：从根目录启动

### 打开新的 PowerShell 窗口，运行：
```powershell
cd C:\Users\jingy\fyp-repo
npm run dev:mobile
```

---

## ⚠️ 如果还是看不到 QR 码

### 1. 确保之前的进程已停止
```powershell
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force
```

### 2. 重新启动
```powershell
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --tunnel
```

### 3. 等待 30-60 秒
- 会显示很多日志
- 最后会显示 QR 码和链接

---

## 📱 在手机上连接

### 方法 A：扫描 QR 码
1. 打开 Expo Go
2. 点击 "Scan QR code"
3. 扫描终端中的 QR 码

### 方法 B：自动检测
1. 打开 Expo Go
2. 在 "Development servers" 下拉刷新
3. 点击你的服务器

### 方法 C：手动输入
1. 在终端找到链接：`exp://xxx.tunnel.exp.direct:80`
2. 在 Expo Go 中手动输入

---

## 🎯 总结

- Web App：`http://localhost:3000`（已运行）
- Mobile App：需要在**新的 PowerShell 窗口**中启动
- 确保使用 `--tunnel` 模式，这样可以跨网络连接

