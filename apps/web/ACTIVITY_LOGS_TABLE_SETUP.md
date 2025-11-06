# Activity Logs 表设置说明

## 📋 概述
操作日志系统用于记录系统内的所有操作（除了Demo账户），包括用户注册、登录、活动管理、预订、支付等关键操作。

## 🔧 在 Supabase 中创建 activity_logs 表

### 方法 1: 使用 Supabase Dashboard

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor**
3. 执行以下 SQL 语句：

```sql
-- 创建 activity_logs 表
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  activity_type TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('event', 'booking', 'promo_code', 'user', 'payment', 'other')),
  entity_id UUID,
  description TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_id ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_email ON activity_logs(user_email);

-- 复合索引用于常见查询
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_created ON activity_logs(entity_type, entity_id, created_at DESC);

-- 启用 Row Level Security (RLS)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 创建策略：用户可以查看自己的活动日志
CREATE POLICY "Users can view their own activity logs"
  ON activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- 创建策略：系统可以插入活动日志（通过service role）
-- 注意：这个策略允许所有已认证用户插入日志
-- 在实际应用中，你可能需要通过 database trigger 或 service role 来插入日志
CREATE POLICY "Authenticated users can insert activity logs"
  ON activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 可选：创建策略允许组织者查看其活动的所有日志
-- 这需要关联查询 organizers 和 events 表
CREATE POLICY "Organizers can view their event activity logs"
  ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizers o ON o.id = e.organizer_id
      WHERE e.id::text = activity_logs.entity_id::text
      AND activity_logs.entity_type = 'event'
      AND o.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN events e ON e.id = b.event_id
      JOIN organizers o ON o.id = e.organizer_id
      WHERE b.id::text = activity_logs.entity_id::text
      AND activity_logs.entity_type = 'booking'
      AND o.user_id = auth.uid()
    )
  );
```

### 方法 2: 使用 Supabase CLI

```bash
# 创建 migration 文件
supabase migration new create_activity_logs_table

# 编辑 migration 文件，添加上述 SQL 语句

# 应用 migration
supabase db push
```

## 📊 表结构说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键，自动生成 |
| `user_id` | UUID | 执行操作的用户ID（关联 auth.users） |
| `user_email` | TEXT | 用户邮箱（冗余字段，便于查询） |
| `activity_type` | TEXT | 活动类型（见下方枚举） |
| `entity_type` | TEXT | 实体类型：event, booking, promo_code, user, payment, other |
| `entity_id` | UUID | 关联的实体ID（可选） |
| `description` | TEXT | 操作描述 |
| `metadata` | JSONB | 额外的元数据（设备信息、操作详情等） |
| `ip_address` | TEXT | IP地址（可选） |
| `user_agent` | TEXT | 用户代理字符串 |
| `created_at` | TIMESTAMPTZ | 记录创建时间 |

## 🎯 活动类型枚举

### 认证相关
- `user_register` - 用户注册
- `user_login` - 用户登录
- `user_logout` - 用户登出
- `email_verified` - 邮箱验证

### 活动管理
- `event_created` - 创建活动
- `event_updated` - 更新活动
- `event_deleted` - 删除活动

### 预订管理
- `booking_created` - 创建预订
- `booking_cancelled` - 取消预订
- `booking_checked_in` - 签到
- `booking_status_changed` - 预订状态变更

### 优惠券管理
- `promo_code_created` - 创建优惠券
- `promo_code_updated` - 更新优惠券
- `promo_code_activated` - 激活优惠券
- `promo_code_deactivated` - 停用优惠券
- `promo_code_used` - 使用优惠券

### 支付相关
- `payment_initiated` - 发起支付
- `payment_success` - 支付成功
- `payment_failed` - 支付失败

### 其他
- `image_uploaded` - 图片上传
- `attendee_managed` - 参与者管理
- `notification_sent` - 发送通知

## 📝 metadata JSONB 结构示例

```json
{
  "device": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Win32",
    "language": "en-US",
    "screenWidth": 1920,
    "screenHeight": 1080,
    "timezone": "Asia/Kuala_Lumpur"
  },
  "eventTitle": "Spring Festival",
  "bookingAmount": 150.00,
  "promoCode": "SPRING2025"
}
```

## 🔍 查询示例

### 查询用户的所有活动
```sql
SELECT * FROM activity_logs 
WHERE user_id = 'user-id-here'
ORDER BY created_at DESC;
```

### 查询特定活动的所有操作
```sql
SELECT * FROM activity_logs 
WHERE entity_type = 'event' 
AND entity_id = 'event-id-here'
ORDER BY created_at DESC;
```

### 查询特定类型的活动
```sql
SELECT * FROM activity_logs 
WHERE activity_type = 'booking_created'
ORDER BY created_at DESC
LIMIT 100;
```

### 查询时间范围内的活动
```sql
SELECT * FROM activity_logs 
WHERE created_at >= '2025-01-01'
AND created_at < '2025-02-01'
ORDER BY created_at DESC;
```

## ⚠️ 注意事项

1. **Demo账户**: 系统会自动跳过Demo账户的操作记录
2. **性能**: 建议定期清理旧日志（如保留6个月或1年）
3. **隐私**: 确保遵循数据保护法规，不要记录敏感信息
4. **权限**: RLS策略确保用户只能查看自己的日志，组织者可以查看其活动的相关日志
5. **索引**: 已创建必要的索引以提高查询性能

## 🔄 数据清理

### 定期清理旧日志（可选）

```sql
-- 删除6个月前的日志（谨慎使用！）
DELETE FROM activity_logs 
WHERE created_at < NOW() - INTERVAL '6 months';
```

### 归档旧日志（推荐）

```sql
-- 创建归档表
CREATE TABLE IF NOT EXISTS activity_logs_archive (
  LIKE activity_logs INCLUDING ALL
);

-- 移动旧日志到归档表
INSERT INTO activity_logs_archive
SELECT * FROM activity_logs 
WHERE created_at < NOW() - INTERVAL '6 months';

-- 删除已归档的日志
DELETE FROM activity_logs 
WHERE created_at < NOW() - INTERVAL '6 months';
```

## ✅ 验证

创建表后，可以执行以下查询验证：

```sql
-- 检查表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'activity_logs'
);

-- 查看表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_logs';

-- 查看最近的日志
SELECT * FROM activity_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

