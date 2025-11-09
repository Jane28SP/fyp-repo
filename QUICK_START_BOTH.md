# 🚀 快速启动 Web + Mobile App

## ✅ 启动 Web App

### PowerShell 窗口 #1：
```powershell
cd C:\Users\jingy\fyp-repo
npm run dev:web
```

- 浏览器会自动打开：`http://localhost:3000`
- 保持这个窗口打开

---

## ✅ 启动 Mobile App

### PowerShell 窗口 #2（新窗口）：
```powershell
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --tunnel
```

### 等待 30-60 秒会显示：
```
┌─────────────────────────────────────┐
│  QR 码（大图）                        │
└─────────────────────────────────────┘

› Metro waiting on exp://xxx.tunnel.exp.direct:80
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

---

## 📱 在手机上连接

### 步骤：
1. 打开 **Expo Go** app
2. 点击 **"Scan QR code"**
3. 扫描 PowerShell 窗口中的 QR 码
4. 等待 10-20 秒加载

---

## ⚠️ 如果看不到 QR 码

### 原因：
- 服务器在后台运行（看不见）
- 需要在**新的、可见的** PowerShell 窗口中启动

### 解决方案：

#### 方法 1：使用批处理脚本
1. 打开文件夹：`C:\Users\jingy\fyp-repo\apps\mobile`
2. 双击运行：**`start-mobile.bat`**
3. 新窗口会打开并显示 QR 码

#### 方法 2：手动打开新 PowerShell
1. 按 `Win + X`，选择 "Windows PowerShell"
2. 运行：
   ```powershell
   cd C:\Users\jingy\fyp-repo\apps\mobile
   npx expo start --tunnel
   ```
3. 等待 QR 码出现

---

## 🎯 完整流程

1. **启动 Web App**（PowerShell 窗口 #1）
   ```powershell
   cd C:\Users\jingy\fyp-repo
   npm run dev:web
   ```

2. **启动 Mobile App**（PowerShell 窗口 #2 - 新窗口）
   ```powershell
   cd C:\Users\jingy\fyp-repo\apps\mobile
   npx expo start --tunnel
   ```

3. **在手机上**：
   - 打开 Expo Go
   - 扫描 QR 码

4. **测试**：
   - Web：`http://localhost:3000`
   - Mobile：Expo Go app

---

## 📝 注意事项

- **必须使用两个独立的 PowerShell 窗口**
- Web 和 Mobile 使用同一个 Supabase 后端
- 数据会在 Web 和 Mobile 之间同步
- 保持两个窗口都打开，直到测试完成

