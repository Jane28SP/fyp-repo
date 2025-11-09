# 🔧 修复 ESLint 错误

## ❌ 错误：
```
[eslint] Invalid Options:
Unknown options: extensions, resolvePluginsRelativeTo
'extensions' has been removed.
'resolvePluginsRelativeTo' has been removed.
```

## ✅ 原因：
- `react-scripts` 5.0.1 使用的 ESLint 配置与系统中的 ESLint 版本不兼容
- 这是版本冲突问题

## ✅ 已执行的修复：

1. ✅ 在启动脚本中添加了 `DISABLE_ESLINT_PLUGIN=true`
2. ✅ 这会禁用 ESLint 插件，避免配置冲突
3. ✅ 正在重新启动 Web 应用

---

## 🎯 现在等待：

- 等待 **30-60 秒**
- Web 应用应该能正常启动
- 浏览器会自动打开：`http://localhost:3000`

---

## ⚠️ 注意：

禁用 ESLint 只是临时解决方案。如果需要 ESLint 检查：

### 方法 1：更新 react-scripts（推荐）
```bash
cd apps/web
npm install react-scripts@latest
```

### 方法 2：使用 .env 文件
创建 `apps/web/.env` 文件：
```
DISABLE_ESLINT_PLUGIN=true
```

---

等待 30-60 秒，Web 应用应该能正常启动了！

