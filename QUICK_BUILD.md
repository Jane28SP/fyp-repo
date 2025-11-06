# 🚀 快速生成APK指南

## 最简单的方法（3步）：

### 1️⃣ 登录 Expo
```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx eas login
```

### 2️⃣ 生成APK
```bash
npx eas build --platform android --profile preview
```

### 3️⃣ 下载并安装
- 等待构建完成（10-20分钟）
- 点击下载链接获取APK
- 传输到手机并安装

---

## 📱 安装到手机后：

你就可以：
- ✅ 直接打开app，不需要Expo Go
- ✅ 随时测试，就像普通app一样
- ✅ 分享给老师测试

---

## ⚠️ 注意事项：

1. **需要Expo账号**（免费注册）
2. **需要网络**（云端构建）
3. **第一次构建较慢**（后续会快一些）

---

## 🔄 更新app：

如果修改了代码，重新运行：
```bash
npx eas build --platform android --profile preview
```

会生成新的APK，安装后覆盖旧版本。

