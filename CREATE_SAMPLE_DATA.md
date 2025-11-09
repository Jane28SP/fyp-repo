# 📝 创建示例数据

## 问题
Supabase `events` 表是空的（0 条记录）。

## 解决方案

### 选项 1：在 Web 版本创建活动（推荐）

1. **打开 Web 版本**：`http://localhost:3000`

2. **登录为组织者**：
   - 点击 "Sign In"
   - 使用组织者账号登录

3. **创建活动**：
   - 导航到 "Organizer Dashboard"
   - 点击 "Create Event"
   - 填写活动信息：
     - Title: 技术分享会：React 19 新特性
     - Date: 2025-01-15
     - Time: 14:00
     - Location: 北京市朝阳区科技园区A座3楼
     - Price: 0
     - Description: 学习 React 19 的最新特性
   - 保存

4. **在 Mobile 上刷新**：
   - 下拉刷新
   - 应该能看到新创建的活动

---

### 选项 2：直接在 Supabase 插入数据

1. **访问 Supabase Dashboard**：
   - https://supabase.com/dashboard
   - 选择项目：`sznagdhpnjexuuydnimh`

2. **打开 SQL Editor**：
   ```sql
   INSERT INTO events (title, description, date, time, location, capacity, price, organizer_id, category)
   VALUES 
   ('技术分享会：React 19 新特性', '深入了解 React 19 的新特性和改进', '2025-01-15', '14:00-16:00', '北京市朝阳区科技园区A座3楼', 100, 0, (SELECT id FROM auth.users LIMIT 1), 'Technology'),
   ('Startup Investment Forum 3', 'Connect with investors and showcase your startup', '2025-06-20', '09:00-17:00', 'Petaling Jaya Convention Centre, Selangor', 200, 50, (SELECT id FROM auth.users LIMIT 1), 'Business'),
   ('Hihi bye bye', 'Fun community event', '2025-11-06', '09:00-17:00', 'Petaling Jaya Convention Centre, Selangor', 150, 30, (SELECT id FROM auth.users LIMIT 1), 'Education');
   ```

3. **运行 SQL**：点击 "Run"

4. **在 Mobile 上刷新**：下拉刷新

---

### 选项 3：使用初始化脚本

在浏览器控制台（Web 版本）运行：

```javascript
// 在 http://localhost:3000 打开浏览器控制台
// 按 F12，然后粘贴以下代码：

async function createSampleEvents() {
  const { supabase } = await import('./src/lib/supabase');
  
  // 获取当前用户 ID
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.log('Please login first!');
    return;
  }

  const events = [
    {
      title: '技术分享会：React 19 新特性',
      description: '深入了解 React 19 的新特性和改进',
      date: '2025-01-15',
      time: '14:00-16:00',
      location: '北京市朝阳区科技园区A座3楼',
      capacity: 100,
      price: 0,
      organizer_id: user.id,
      category: 'Technology'
    },
    {
      title: 'Startup Investment Forum 3',
      description: 'Connect with investors and showcase your startup',
      date: '2025-06-20',
      time: '09:00-17:00',
      location: 'Petaling Jaya Convention Centre, Selangor',
      capacity: 200,
      price: 50,
      organizer_id: user.id,
      category: 'Business'
    },
    {
      title: 'Hihi bye bye',
      description: 'Fun community event',
      date: '2025-11-06',
      time: '09:00-17:00',
      location: 'Petaling Jaya Convention Centre, Selangor',
      capacity: 150,
      price: 30,
      organizer_id: user.id,
      category: 'Education'
    }
  ];

  const { data, error } = await supabase
    .from('events')
    .insert(events)
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Created', data.length, 'events!');
  }
}

createSampleEvents();
```

---

## ✅ 验证数据已创建

### 在 Web 上：
- 刷新页面
- 应该看到 "3 events"

### 在 Mobile 上：
- 下拉刷新首页
- 活动总数应该显示 3
- 点击"活动"标签应该看到活动列表

---

## 🎯 推荐做法

**使用选项 2（Supabase SQL Editor）最简单快速！**

1. 访问 Supabase Dashboard
2. 复制粘贴 SQL
3. 运行
4. 在 Mobile 上下拉刷新

就这么简单！





