import { supabase } from '../lib/supabase';

export const initializeSampleEvents = async () => {
  const sampleEvents = [
    {
      title: '技术分享会：React 19 新特性',
      description: '深入了解React 19的最新特性，包括并发渲染、自动批处理等重大更新。适合前端开发者参加。',
      date: '2024-01-15',
      time: '14:00-16:00',
      location: '北京市朝阳区科技园区A座3楼',
      capacity: 50,
      price: 0,
      image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'
    },
    {
      title: '创业投资论坛',
      description: '与知名投资人面对面交流，了解最新的投资趋势和创业机会。',
      date: '2024-01-20',
      time: '09:00-17:00',
      location: '上海市浦东新区陆家嘴金融中心',
      capacity: 100,
      price: 299,
      image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop'
    },
    {
      title: '瑜伽工作坊',
      description: '专业瑜伽导师指导，适合初学者和进阶练习者。放松身心，提升生活质量。',
      date: '2024-01-25',
      time: '10:00-12:00',
      location: '广州市天河区体育中心瑜伽馆',
      capacity: 30,
      price: 150,
      image_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop'
    },
    {
      title: '美食节：国际料理展示',
      description: '品尝来自世界各地的美食，体验不同文化的烹饪艺术。',
      date: '2024-02-01',
      time: '11:00-20:00',
      location: '深圳市南山区海上世界',
      capacity: 200,
      price: 80,
      image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop'
    },
    {
      title: '音乐会：古典与现代的碰撞',
      description: '著名交响乐团演出，融合古典音乐与现代元素，带来震撼的听觉盛宴。',
      date: '2024-02-10',
      time: '19:30-21:30',
      location: '成都市锦江区音乐厅',
      capacity: 500,
      price: 380,
      image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop'
    }
  ];

  try {
    // 检查是否已有数据
    const { data: existingEvents } = await supabase
      .from('events')
      .select('count')
      .limit(1);

    if (existingEvents && existingEvents.length > 0) {
      console.log('示例数据已存在，跳过初始化');
      return;
    }

    // 插入示例数据
    const { error } = await supabase
      .from('events')
      .insert(sampleEvents);

    if (error) {
      console.error('初始化示例数据失败:', error);
    } else {
      console.log('示例数据初始化成功');
    }
  } catch (error) {
    console.error('初始化数据时出错:', error);
  }
}; 