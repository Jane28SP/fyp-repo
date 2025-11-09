# 上传 Banner 图片到 Supabase Storage

## 方法 1: 通过 Supabase Dashboard 上传（最简单）

### 步骤：

1. **创建 Storage Bucket**
   - 登录 [Supabase Dashboard](https://supabase.com/dashboard)
   - 选择你的项目
   - 点击左侧菜单的 **Storage**
   - 点击 **New bucket** 按钮
   - 输入 bucket 名称：`images`
   - 勾选 **Public bucket**（这样图片可以公开访问，不需要认证）
   - 点击 **Create bucket**

2. **上传图片**
   - 在 Storage 页面，点击 `images` bucket
   - 点击 **Upload file** 按钮
   - 选择文件：`apps/web/public/fypBanner.png`
   - 上传完成后，点击文件名称
   - 复制 **Public URL**（类似：`https://sznagdhpnjexuuydnimh.supabase.co/storage/v1/object/public/images/fypBanner.png`）

3. **更新手机版代码**
   - 打开 `apps/mobile/App.tsx`
   - 找到 `ImageBackground` 的 `source` 属性
   - 将 URL 更新为你复制的 Public URL

---

## 方法 2: 使用脚本上传（需要先创建 bucket）

### 前提条件：
- 已创建 `images` bucket（参考方法 1 的步骤 1）
- 已安装 Node.js

### 步骤：

1. **安装依赖**（如果还没安装）
   ```bash
   cd apps/web
   npm install
   ```

2. **运行上传脚本**
   ```bash
   cd ../..
   node upload_banner.js
   ```

3. **脚本会自动：**
   - 读取 `apps/web/public/fypBanner.png`
   - 上传到 Supabase Storage 的 `images` bucket
   - 显示 Public URL

---

## 方法 3: 使用现有的 bucket（如果有）

如果你已经有其他 bucket（比如 `event-images`），可以：

1. 修改 `upload_banner.js` 中的 bucket 名称
2. 或者直接在 Dashboard 中上传到现有 bucket
3. 更新手机版代码中的 URL

---

## 验证上传

上传完成后，在浏览器中打开 Public URL，应该能看到 banner 图片。

如果图片无法显示，检查：
- ✅ Bucket 是否设置为 **Public**
- ✅ 文件路径是否正确
- ✅ URL 是否完整

---

## 更新手机版代码

上传成功后，确保手机版 `App.tsx` 中的图片 URL 正确：

```typescript
<ImageBackground
  source={{ uri: 'https://sznagdhpnjexuuydnimh.supabase.co/storage/v1/object/public/images/fypBanner.png' }}
  style={styles.heroBackground}
  resizeMode="cover"
>
```

