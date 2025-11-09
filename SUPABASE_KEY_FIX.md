# 🔑 Supabase API Key 修复

## ❌ 错误信息
```
Invalid API key
Double check your Supabase `anon` or `service_role` API key.
```

## ✅ 问题原因
Mobile 使用了过期或错误的 Supabase Anon Key。

---

## 🔧 已修复

### 使用正确的 Supabase 配置：

```
URL: https://sznagdhpnjexuuydnimh.supabase.co
Key: eyJhbGc...TS8kgZjDjGhNSutksFEwJf7kslrqUddaChEbzdNqpl4
```

这是与 Web 版本**完全相同**的配置。

---

## 🔄 必须完全重启

环境变量更改需要：
1. 停止所有 Expo 进程
2. 清除 Expo 缓存
3. 重新启动服务器
4. 在手机上重新扫描 QR 码

---

## 📱 在手机上操作

### ⚠️ 重要：必须重新扫描 QR 码

1. **完全退出** Expo Go 中的应用
2. **回到 Expo Go 主页**
3. **等待 30-60 秒**（PowerShell 显示新 QR 码）
4. **重新扫描新的 QR 码**

**不要只是 Reload！** 环境变量更改必须完全重启。

---

## ✅ 修复后应该看到

### 数据加载成功：
- 活动总数：应该显示实际数量（不是 0）
- 活动列表：应该显示所有活动
- 控制台日志：`Events loaded: X` (X > 0)

### 如果还是看到错误：
请截图告诉我具体的错误信息。

---

## 🎯 验证步骤

1. **在 PowerShell 中查看日志**：
   - 应该看到 `Events loaded: X`
   - 不应该看到 "Invalid API key" 错误

2. **在手机上**：
   - 首页统计应该显示活动数量
   - 点击"活动"标签应该看到活动列表

---

现在等待 30-60 秒，然后在手机上重新扫描 QR 码！

