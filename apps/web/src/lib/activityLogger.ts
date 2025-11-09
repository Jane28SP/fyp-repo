import { supabase } from './supabase';

/**
 * Activity type enum
 */
export enum ActivityType {
  // Authentication related
  USER_REGISTER = 'user_register',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  EMAIL_VERIFIED = 'email_verified',
  
  // 活动管理
  EVENT_CREATED = 'event_created',
  EVENT_UPDATED = 'event_updated',
  EVENT_DELETED = 'event_deleted',
  
  // Booking management
  BOOKING_CREATED = 'booking_created',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_CHECKED_IN = 'booking_checked_in',
  BOOKING_STATUS_CHANGED = 'booking_status_changed',
  
  // 优惠券管理
  PROMO_CODE_CREATED = 'promo_code_created',
  PROMO_CODE_UPDATED = 'promo_code_updated',
  PROMO_CODE_ACTIVATED = 'promo_code_activated',
  PROMO_CODE_DEACTIVATED = 'promo_code_deactivated',
  PROMO_CODE_USED = 'promo_code_used',
  
  // 支付相关
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  
  // File operations
  IMAGE_UPLOADED = 'image_uploaded',
  
  // Other
  ATTENDEE_MANAGED = 'attendee_managed',
  NOTIFICATION_SENT = 'notification_sent',
}

/**
 * 实体类型
 */
export type EntityType = 'event' | 'booking' | 'promo_code' | 'user' | 'payment' | 'other';

/**
 * 活动日志接口
 */
export interface ActivityLog {
  id?: string;
  user_id: string;
  user_email?: string;
  activity_type: ActivityType;
  entity_type: EntityType;
  entity_id?: string;
  description: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

/**
 * 获取设备信息
 */
function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/**
 * 获取IP地址（简化版，实际应该通过后端API获取）
 */
async function getIPAddress(): Promise<string | undefined> {
  try {
    // 注意：这是一个简化的实现，实际应该通过后端API获取真实IP
    // 前端直接获取IP可能不准确，最好通过后端记录
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Record activity log
 * @param activityType 活动类型
 * @param entityType 实体类型
 * @param entityId 实体ID（可选）
 * @param description 描述
 * @param metadata 额外元数据（可选）
 * @param userId 用户ID（可选，如果不提供则从session获取）
 */
export async function logActivity(
  activityType: ActivityType,
  entityType: EntityType,
  description: string,
  options: {
    entityId?: string;
    metadata?: Record<string, any>;
    userId?: string;
    userEmail?: string;
  } = {}
): Promise<void> {
  try {
    // 获取当前用户
    let userId = options.userId;
    let userEmail = options.userEmail;

    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
      userEmail = session?.user?.email;
    }

    // Skip if no user ID
    if (!userId) {
      return;
    }

    // 获取设备信息
    const deviceInfo = getDeviceInfo();
    const ipAddress = await getIPAddress();

    // 构建日志记录
    const logEntry: Omit<ActivityLog, 'id' | 'created_at'> = {
      user_id: userId,
      user_email: userEmail,
      activity_type: activityType,
      entity_type: entityType,
      entity_id: options.entityId,
      description,
      metadata: {
        ...options.metadata,
        device: deviceInfo,
      },
      ip_address: ipAddress,
      user_agent: deviceInfo.userAgent,
    };

    // 插入日志到数据库
    const { error } = await supabase
      .from('activity_logs')
      .insert([logEntry]);

    if (error) {
      // 如果表不存在，只记录到控制台，不抛出错误
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.warn('Activity logs table not found. Please create it in Supabase.', error);
        return;
      }
      console.error('Failed to log activity:', error);
      // 不抛出错误，避免影响主流程
    }
  } catch (error: any) {
    // 静默处理错误，避免影响主流程
    console.error('Error logging activity:', error);
  }
}

/**
 * 批量记录活动日志（用于批量操作）
 */
export async function logBatchActivity(
  logs: Array<{
    activityType: ActivityType;
    entityType: EntityType;
    description: string;
    entityId?: string;
    metadata?: Record<string, any>;
    userId?: string;
    userEmail?: string;
  }>
): Promise<void> {
  try {
    // 获取当前用户
    const { data: { session } } = await supabase.auth.getSession();
    const defaultUserId = session?.user?.id;
    const defaultUserEmail = session?.user?.email;

    // Skip if no user ID
    if (!defaultUserId) {
      return;
    }

    // 获取设备信息
    const deviceInfo = getDeviceInfo();
    const ipAddress = await getIPAddress();

    // Build log entries
    const logEntries = logs
      .filter(log => {
        const userId = log.userId || defaultUserId;
        return userId;
      })
      .map(log => ({
        user_id: log.userId || defaultUserId!,
        user_email: log.userEmail || defaultUserEmail,
        activity_type: log.activityType,
        entity_type: log.entityType,
        entity_id: log.entityId,
        description: log.description,
        metadata: {
          ...log.metadata,
          device: deviceInfo,
        },
        ip_address: ipAddress,
        user_agent: deviceInfo.userAgent,
      }));

    if (logEntries.length === 0) {
      return;
    }

    // 批量插入日志
    const { error } = await supabase
      .from('activity_logs')
      .insert(logEntries);

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.warn('Activity logs table not found. Please create it in Supabase.', error);
        return;
      }
      console.error('Failed to log batch activities:', error);
    }
  } catch (error: any) {
    console.error('Error logging batch activities:', error);
  }
}

/**
 * 查询活动日志（用于管理员查看）
 */
export async function getActivityLogs(options: {
  userId?: string;
  activityType?: ActivityType;
  entityType?: EntityType;
  entityId?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
} = {}): Promise<ActivityLog[]> {
  try {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.activityType) {
      query = query.eq('activity_type', options.activityType);
    }

    if (options.entityType) {
      query = query.eq('entity_type', options.entityType);
    }

    if (options.entityId) {
      query = query.eq('entity_id', options.entityId);
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Failed to get activity logs:', error);
    return [];
  }
}

