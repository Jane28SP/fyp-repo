# Attendance 表设置说明

## 📋 概述
QR签到功能会自动更新 `bookings` 表的 `status` 和 `checked_in_at` 字段。如果需要更详细的签到记录（包括设备信息），可以创建 `attendance` 表。

## 🔧 在 Supabase 中创建 attendance 表

### 方法 1: 使用 Supabase Dashboard

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor**
3. 执行以下 SQL 语句：

```sql
-- 创建 attendance 表
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_info JSONB,
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_attendance_booking_id ON attendance(booking_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_organizer_id ON attendance(organizer_id);
CREATE INDEX IF NOT EXISTS idx_attendance_checked_in_at ON attendance(checked_in_at);

-- 启用 Row Level Security (RLS)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 创建策略：组织者可以查看自己活动的签到记录
CREATE POLICY "Organizers can view their own event attendance"
  ON attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = attendance.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );

-- 创建策略：组织者可以创建自己活动的签到记录
CREATE POLICY "Organizers can insert their own event attendance"
  ON attendance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizers
      WHERE organizers.id = attendance.organizer_id
      AND organizers.user_id = auth.uid()
    )
  );
```

### 方法 2: 使用 Supabase CLI

```bash
# 创建 migration 文件
supabase migration new create_attendance_table

# 编辑 migration 文件，添加上述 SQL 语句

# 应用 migration
supabase db push
```

## 📊 表结构说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | UUID | 主键，自动生成 |
| `booking_id` | UUID | 关联的预订ID |
| `event_id` | UUID | 关联的活动ID |
| `user_id` | UUID | 关联的用户ID |
| `checked_in_at` | TIMESTAMPTZ | 签到时间戳 |
| `device_info` | JSONB | 设备信息（可选）|
| `organizer_id` | UUID | 组织者ID |
| `created_at` | TIMESTAMPTZ | 记录创建时间 |

## 🔍 device_info JSONB 结构示例

```json
{
  "userAgent": "Mozilla/5.0...",
  "platform": "Win32",
  "language": "en-US",
  "screenWidth": 1920,
  "screenHeight": 1080,
  "timestamp": "2025-04-11T10:30:00.000Z",
  "timezone": "Asia/Kuala_Lumpur"
}
```

## ⚠️ 注意事项

1. **可选功能**: `attendance` 表是可选的。即使表不存在，QR签到功能仍然可以正常工作（会更新 `bookings` 表）。

2. **数据冗余**: `bookings` 表的 `checked_in_at` 字段已经记录了签到时间，`attendance` 表主要用于：
   - 存储详细的设备信息
   - 支持多次签到记录（如果需要）
   - 提供更详细的签到分析

3. **权限设置**: 确保 RLS 策略正确配置，只有组织者可以查看和创建自己活动的签到记录。

4. **性能优化**: 已创建必要的索引以提高查询性能。

## 🔄 实时更新

系统会自动监听 `bookings` 表的变化，当签到状态更新时，相关的视图会实时刷新。

## 📝 使用说明

1. **自动创建**: 当扫描QR码并成功签到时，系统会尝试在 `attendance` 表中创建记录。

2. **错误处理**: 如果 `attendance` 表不存在，系统会记录日志但不会影响签到流程。

3. **查询签到记录**: 可以通过以下方式查询签到记录：

```sql
-- 查询某个活动的所有签到记录
SELECT * FROM attendance 
WHERE event_id = 'your-event-id'
ORDER BY checked_in_at DESC;

-- 查询某个用户的签到记录
SELECT * FROM attendance 
WHERE user_id = 'your-user-id'
ORDER BY checked_in_at DESC;
```

## ✅ 验证

创建表后，可以执行以下查询验证：

```sql
-- 检查表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'attendance'
);

-- 查看表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'attendance';
```

