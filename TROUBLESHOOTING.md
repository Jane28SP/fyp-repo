# 🔧 移动应用连接问题排查

## ❌ 错误："Error while reading multipart response"

这个错误通常是网络或缓存问题。

## ✅ 解决方案（按顺序尝试）：

### 方案 1：清除缓存并重启（已执行）

```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --clear --offline
```

等待新的QR码出现。

---

### 方案 2：在手机上重新加载

在 Expo Go 中：
1. 点击 **"RELOAD"** 按钮
2. 或者摇动手机，选择 "Reload"

---

### 方案 3：使用本地模式（不用tunnel）

如果之前用了 `--tunnel`，试试不用：

```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --offline
```

确保手机和电脑在同一WiFi。

---

### 方案 4：重启所有服务

1. **停止服务器**：在终端按 `Ctrl+C`
2. **关闭 Expo Go**：完全关闭app
3. **重新启动**：
   ```bash
   cd C:\Users\jingy\fyp-repo\apps\mobile
   npx expo start --clear --offline
   ```
4. **重新打开 Expo Go** 并连接

---

### 方案 5：检查网络连接

确保：
- ✅ 手机和电脑在同一WiFi
- ✅ WiFi连接稳定
- ✅ 防火墙没有阻止端口

---

### 方案 6：使用测试版本

如果还是不行，可以先用简单的测试版本：

1. 临时重命名文件：
   ```bash
   cd C:\Users\jingy\fyp-repo\apps\mobile
   ren App.tsx App-original.tsx
   ren App-test.tsx App.tsx
   ```

2. 重新启动服务器

3. 如果测试版本能工作，说明是代码问题

4. 恢复原文件：
   ```bash
   ren App.tsx App-test.tsx
   ren App-original.tsx App.tsx
   ```

---

## 🎯 推荐步骤：

1. ✅ 已执行：清除缓存并重启
2. 在手机上点击 **"RELOAD"**
3. 如果还不行，尝试方案3（本地模式）
4. 如果还不行，尝试方案6（测试版本）

---

## 💡 提示：

- 这个错误通常是**临时性的**
- 多试几次 "RELOAD" 通常能解决
- 确保网络连接稳定

