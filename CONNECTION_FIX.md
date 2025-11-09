# 🔧 手机连接超时问题解决方案

## ✅ 好消息：QR码已经显示了！

服务器成功启动，显示：`exp://10.30.0.34:8082`

## ❌ 问题：手机连接超时

可能的原因：
1. 手机和电脑不在同一WiFi
2. 防火墙阻止了连接
3. 使用了Safari而不是Expo Go

## ✅ 解决方案：

### 方法 1：使用 Tunnel 模式（推荐）

在终端按 `Ctrl+C` 停止当前服务器，然后运行：

```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --tunnel
```

等待新的QR码出现（会显示 `exp://xxx.tunnel.exp.direct:80`）

### 方法 2：确保使用 Expo Go（不是Safari）

**重要**：不要用Safari扫描QR码！

1. 打开 **Expo Go** app（不是Safari）
2. 在 "Development servers" 区域下拉刷新
3. 等待几秒，服务器应该会自动出现
4. 点击连接

### 方法 3：检查WiFi连接

确保：
- ✅ 手机和电脑在同一WiFi网络
- ✅ 防火墙允许端口 8082
- ✅ 网络连接正常

### 方法 4：手动输入链接

如果自动检测不到：
1. 在终端找到链接：`exp://10.30.0.34:8082`
2. 在 Expo Go 中手动输入这个链接

---

## 🎯 推荐步骤：

1. 停止当前服务器（`Ctrl+C`）
2. 运行：`npx expo start --tunnel`
3. 等待新的QR码
4. 在 **Expo Go**（不是Safari）中连接

