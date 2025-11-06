# 网络连接问题解决方案

如果遇到 `TypeError: fetch failed` 错误，这是因为 Expo CLI 尝试连接服务器检查版本时失败。

## 解决方案：

### 方法 1：使用离线模式（推荐）
```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npx expo start --offline --no-web
```

### 方法 2：跳过版本检查
```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
$env:EXPO_NO_VERSION_CHECK='1'
npx expo start --no-web
```

### 方法 3：使用普通模式（如果网络正常）
```bash
cd C:\Users\jingy\fyp-repo\apps\mobile
npm start
```

## 注意：
- `--no-web` 标志会跳过 web bundling，避免 web 相关错误
- 如果网络正常，Expo Go 会自动检测到开发服务器
- 如果网络有问题，使用 `--offline` 模式

