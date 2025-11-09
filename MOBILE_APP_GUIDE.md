# 📱 Mobile App 启动指南

## ✅ 正确的启动方式：

### 方法 1：从根目录启动（推荐）

```powershell
cd C:\Users\jingy\fyp-repo
npm run dev:mobile
```

这会：
- 通过 pnpm workspace 启动 mobile 应用
- 显示 QR 码
- 等待连接

### 方法 2：直接进入 mobile 目录启动

```powershell
cd C:\Users\jingy\fyp-repo\apps\mobile
npm start
```

或：

```powershell
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --offline
```

---

## 📱 在手机上连接：

### 步骤 1：等待 QR 码出现
- 等待 30-40 秒
- 终端会显示 QR 码
- 链接：`exp://192.168.x.x:8081` 或类似

### 步骤 2：使用 Expo Go 扫描

**方法 A：自动检测（推荐）**
1. 打开 **Expo Go** app
2. 确保手机和电脑在同一 WiFi
3. 在 "Development servers" 区域**下拉刷新**
4. 等待几秒，服务器会自动出现
5. 点击连接！

**方法 B：扫描 QR 码**
1. 打开 **Expo Go** app
2. 点击 "Scan QR code"
3. 扫描终端中的 QR 码

**方法 C：手动输入链接**
1. 在终端找到链接：`exp://192.168.x.x:8081`
2. 在 Expo Go 中手动输入

---

## ⚠️ 如果连接不上：

### 问题 1：连接超时
**解决**：使用 tunnel 模式
```powershell
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --tunnel
```

### 问题 2：看不到服务器
**解决**：
- 确保使用 **Expo Go**（不是 Safari）
- 确保同一 WiFi
- 在 Expo Go 中下拉刷新

### 问题 3：网络错误
**解决**：使用 `--offline` 模式
```powershell
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --offline
```

---

## 🎯 推荐流程：

1. **启动服务器**：
   ```powershell
   cd C:\Users\jingy\fyp-repo
   npm run dev:mobile
   ```

2. **等待 QR 码**（30-40 秒）

3. **在手机上**：
   - 打开 Expo Go
   - 下拉刷新 "Development servers"
   - 点击你的服务器

---

## ✅ 总结：

- ✅ Web App：`npm run dev:web` → 浏览器自动打开
- ✅ Mobile App：`npm run dev:mobile` → Expo Go 扫描 QR 码

两个应用都使用同一个 Supabase 后端，数据会同步！

