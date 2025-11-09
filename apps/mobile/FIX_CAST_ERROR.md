# 🔧 修复 "String cannot be cast to Boolean" 错误

## ❌ 错误信息
```
java.lang.String cannot be cast to java.lang.Boolean
```

## ✅ 已修复

### 修复 1：移除 StatusBar style
- 移除了 `<StatusBar style="dark" />`
- StatusBar 在某些 Android 版本上有类型问题

### 修复 2：更新 app.json
- 将 `edgeToEdgeEnabled` 从 `true` 改为 `false`
- 避免边缘到边缘模式的兼容性问题

---

## 🔄 如何重新加载

### 在手机上（Expo Go）：
1. **摇动手机**
2. 点击 **"Reload"**

或

### 在 PowerShell 中：
- 按 **`r`** 键

---

## ⚠️ 如果还有错误

### 清除缓存并重启：
```powershell
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --tunnel --clear
```

然后在手机上重新扫描 QR 码。

---

## 📝 常见原因

这个错误通常由以下原因引起：
1. StatusBar 的 style 属性类型不匹配
2. app.json 中的布尔值被当作字符串
3. React Native 版本兼容性问题
4. Expo SDK 版本不匹配

---

现在应该可以正常显示了！🎉

