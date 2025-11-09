# 🚀 快速启动移动应用

## 方法 1：使用批处理文件（最简单）

直接双击运行：
```
C:\Users\jingy\fyp-repo\apps\mobile\start.bat
```

## 方法 2：使用命令行

```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
start.bat
```

或者：
```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
set EXPO_NO_VERSION_CHECK=1
npx expo start --offline
```

## 等待 30 秒

启动后会显示：
- ✅ QR 码
- ✅ 链接：`exp://192.168.x.x:8081`

## 在手机上：

1. 打开 **Expo Go**
2. 确保同一 WiFi
3. 下拉刷新 "Development servers"
4. 点击你的服务器

