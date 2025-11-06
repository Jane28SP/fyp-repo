# 📱 如何生成可直接安装的APK文件

## 方法一：使用 EAS Build（推荐，最简单）

### 步骤 1: 登录 Expo 账号
```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx eas login
```
如果没有账号，会提示你注册（免费）

### 步骤 2: 配置项目
```bash
npx eas build:configure
```

### 步骤 3: 生成 APK（Android）
```bash
npx eas build --platform android --profile preview
```

这会：
- 在云端构建APK（需要10-20分钟）
- 完成后会给你下载链接
- 下载APK后直接安装到手机即可！

---

## 方法二：本地构建（需要 Android Studio）

### 前置要求：
1. 安装 [Android Studio](https://developer.android.com/studio)
2. 安装 Android SDK
3. 配置环境变量

### 步骤：
```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo prebuild
npx expo run:android
```

这会在 `android/app/build/outputs/apk/` 生成APK文件

---

## ⚡ 快速测试版本（Development Build）

如果你想快速测试，可以生成开发版本：

```bash
npx eas build --platform android --profile development
```

这个版本可以：
- 直接安装到手机
- 通过 `expo start --dev-client` 连接开发服务器
- 实时更新代码（热重载）

---

## 📥 安装APK到手机

### 方法A：通过USB连接
1. 用USB连接手机到电脑
2. 在手机上启用"USB调试"
3. 运行：`adb install path/to/app.apk`

### 方法B：直接传输
1. 将APK文件复制到手机
2. 在手机上打开文件管理器
3. 点击APK文件安装
4. 允许"安装未知来源应用"

---

## 🎯 推荐流程

对于FYP项目，我推荐：

1. **第一次**：使用 EAS Build 生成 preview APK
   ```bash
   npx eas build --platform android --profile preview
   ```

2. **日常测试**：继续使用 Expo Go（最快）
   ```bash
   npm run dev:mobile
   ```

3. **最终演示**：生成 production APK
   ```bash
   npx eas build --platform android --profile production
   ```

---

## 💡 提示

- EAS Build 免费账号每月有构建次数限制
- Preview APK 可以直接安装，不需要签名
- Production APK 需要签名，适合发布到应用商店

