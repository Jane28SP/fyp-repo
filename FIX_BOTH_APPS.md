# 🔧 修复 Web 和 Mobile 应用

## 📊 当前状况：

### ✅ Mobile App：
- Metro Bundler 正在运行（端口 8081）
- ⚠️ 但使用了 `--offline` 模式，可能影响连接

### ❌ Web App：
- **没有启动**（端口 3000 未监听）
- 需要单独启动

---

## ✅ 已执行的修复：

1. ✅ 正在启动 Web App（`npm run dev:web`）
2. ✅ 正在重新启动 Mobile App（移除 `--offline` 模式）

---

## 🎯 等待启动：

### Web App：
- 等待 30-60 秒
- 会自动打开浏览器：`http://localhost:3000`
- 或者手动打开：`http://localhost:3000`

### Mobile App：
- 等待 30-40 秒
- 终端会显示 QR 码
- 在 Expo Go 中扫描连接

---

## 📱 如何访问：

### Web App：
1. 打开浏览器
2. 访问：`http://localhost:3000`
3. 应该能看到你的 Web 应用

### Mobile App：
1. 打开 Expo Go
2. 等待 QR 码出现
3. 扫描 QR 码或等待自动检测
4. 点击连接

---

## ⚠️ 如果还是不行：

### Web App 无法打开：
- 检查终端是否有错误
- 确保端口 3000 没有被占用
- 尝试：`cd apps/web && npm start`

### Mobile App 无法连接：
- 在 Expo Go 中点击 "RELOAD"
- 确保手机和电脑在同一 WiFi
- 或使用 tunnel 模式：`npx expo start --tunnel`

---

等待 30-60 秒，两个应用应该都能启动了！

