# 📱 启动移动应用的简单方法

## 方法 1：使用 npm 脚本（推荐）

```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npm start
```

这会自动使用离线模式，跳过网络检查。

## 方法 2：直接使用命令

```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --offline --no-web
```

## 等待显示：

启动后等待 10-30 秒，你会看到：
- ✅ QR 码
- ✅ 链接：`exp://192.168.x.x:8081`

## 在手机上：

1. 打开 **Expo Go** app
2. 确保手机和电脑在同一 WiFi
3. 在 "Development servers" 区域下拉刷新
4. 等待几秒，服务器会自动出现
5. 点击连接！

## 如果还是看不到 QR 码：

按 `Ctrl+C` 停止，然后重新运行：
```bash
npm start
```

