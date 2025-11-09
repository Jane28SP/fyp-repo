-- 在 Supabase Dashboard 的 SQL Editor 中运行这个脚本
-- https://supabase.com/dashboard/project/sznagdhpnjexuuydnimh/sql

-- 首先检查是否有用户
SELECT COUNT(*) as user_count FROM auth.users;

-- 插入示例活动数据
INSERT INTO events (
  title, 
  description, 
  date, 
  time, 
  location, 
  capacity, 
  price, 
  organizer_id, 
  category
)
SELECT 
  title,
  description,
  date,
  time,
  location,
  capacity,
  price,
  (SELECT id FROM auth.users LIMIT 1) as organizer_id,
  category
FROM (
  VALUES 
    (
      '技术分享会：React 19 新特性', 
      '深入了解 React 19 的新特性和改进，包括新的编译器、并发特性等', 
      '2025-01-15', 
      '14:00-16:00', 
      '北京市朝阳区科技园区A座3楼', 
      100, 
      0.00, 
      'Technology'
    ),
    (
      'Startup Investment Forum 3', 
      'Connect with investors and showcase your startup. Network with other entrepreneurs and learn from industry experts.', 
      '2025-06-20', 
      '09:00-17:00', 
      'Petaling Jaya Convention Centre, Selangor', 
      200, 
      50.00, 
      'Business'
    ),
    (
      'Hihi bye bye', 
      'Fun community event with activities for everyone. Join us for a day of fun, food, and networking!', 
      '2025-11-06', 
      '09:00-17:00', 
      'Petaling Jaya Convention Centre, Selangor', 
      150, 
      30.00, 
      'Education'
    )
) AS v(title, description, date, time, location, capacity, price, category);

-- 验证插入成功
SELECT COUNT(*) as total_events, 
       SUM(CASE WHEN category = 'Technology' THEN 1 ELSE 0 END) as technology_events,
       SUM(CASE WHEN category = 'Business' THEN 1 ELSE 0 END) as business_events,
       SUM(CASE WHEN category = 'Education' THEN 1 ELSE 0 END) as education_events
FROM events;

-- 显示所有活动
SELECT id, title, date, time, price, category 
FROM events 
ORDER BY date;





