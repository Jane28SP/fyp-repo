# 🔧 修复 "Failed to download remote update" 错误

## ❌ 问题：
- QR码显示了：`exp://10.30.0.26:8082`
- 但手机扫描后显示 "Something went wrong"
- 错误：`Failed to download remote update`

## ✅ 原因：
手机无法连接到开发服务器，通常是：
1. 手机和电脑不在同一WiFi
2. 防火墙阻止了连接
3. 网络配置问题

## 🎯 解决方案：

### 方法 1：使用 Tunnel 模式（推荐，已执行）

```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --tunnel --clear
```

等待新的QR码出现（会显示 `exp://xxx.tunnel.exp.direct:80`）

### 方法 2：确保同一WiFi

1. 检查电脑WiFi：`ipconfig` 查看IP地址
2. 检查手机WiFi：确保连接到同一个网络
3. 重新连接

### 方法 3：检查防火墙

1. Windows防火墙可能阻止了端口8082
2. 临时关闭防火墙测试
3. 或添加端口例外

### 方法 4：在Expo Go中手动输入链接

1. 打开Expo Go
2. 点击"Enter URL manually"
3. 输入：`exp://10.30.0.26:8082`
4. 或等待tunnel模式的链接

---

## 📱 在手机上操作：

1. **完全关闭Expo Go**（不要只是最小化）
2. **重新打开Expo Go**
3. **等待tunnel模式的QR码**（会显示新的链接）
4. **扫描新的QR码**或手动输入链接

---

## ⚠️ 关于调试器：

"No compatible apps connected" 是正常的，因为：
- 需要Hermes引擎
- 或者需要development build
- 普通Expo Go可能不支持

**可以忽略这个警告**，不影响应用运行。

---

## 🎯 现在等待：

Tunnel模式正在启动，等待30-60秒，会显示新的QR码。

然后：
1. 在手机上完全关闭并重新打开Expo Go
2. 扫描新的QR码
3. 应该就能连接了！

