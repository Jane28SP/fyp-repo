import React, { useState, useEffect, useRef } from 'react';
import { QrReader } from 'react-qr-reader';
import { supabase } from '../../lib/supabase';
import type { Event, Booking, Attendance } from '../../lib/supabase';

interface CheckInScannerProps {
  eventId?: string; // 如果指定，只扫描该活动的QR码
  onCheckInSuccess?: (booking: Booking) => void;
  onCheckInError?: (error: string) => void;
}

interface QRCodeData {
  bookingId: string;
  eventId: string;
  userId: string;
  timestamp?: string;
}

const CheckInScanner: React.FC<CheckInScannerProps> = ({ 
  eventId, 
  onCheckInSuccess, 
  onCheckInError 
}) => {
  const [scanning, setScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [checkedInBookings, setCheckedInBookings] = useState<Set<string>>(new Set());
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 获取当前组织者的信息
  useEffect(() => {
    const fetchCurrentEvent = async () => {
      if (!eventId) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const { data: event, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (error) throw error;
        setCurrentEvent(event);
      } catch (error) {
        console.error('Failed to fetch event:', error);
      }
    };

    fetchCurrentEvent();
  }, [eventId]);

  // 获取设备信息
  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  };

  // 验证并处理QR码数据
  const processQRCode = async (data: string) => {
    // 防止重复扫描同一QR码（2秒内）
    if (lastScannedCode === data && Date.now() - (parseInt(localStorage.getItem(`lastScan_${data}`) || '0')) < 2000) {
      return;
    }

    setLastScannedCode(data);
    localStorage.setItem(`lastScan_${data}`, Date.now().toString());

    try {
      setProcessing(true);
      setCheckInStatus('idle');
      setStatusMessage('正在验证QR码...');

      // 解析QR码数据
      let qrData: QRCodeData;
      try {
        qrData = JSON.parse(data);
      } catch (error) {
        throw new Error('无效的QR码格式');
      }

      // 验证QR码数据结构
      if (!qrData.bookingId || !qrData.eventId || !qrData.userId) {
        throw new Error('QR码数据不完整');
      }

      // 获取当前用户（组织者）
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('请先登录');
      }

      // 验证活动是否属于当前组织者
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*, organizer_id')
        .eq('id', qrData.eventId)
        .single();

      if (eventError || !event) {
        throw new Error('活动不存在');
      }

      // 检查组织者权限（通过organizers表验证）
      const { data: organizer } = await supabase
        .from('organizers')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (!organizer) {
        throw new Error('您没有权限进行此操作');
      }

      // 如果指定了eventId，验证QR码中的eventId是否匹配
      if (eventId && qrData.eventId !== eventId) {
        throw new Error('QR码不属于当前活动');
      }

      // 验证活动是否属于该组织者
      if (event.organizer_id !== organizer.id) {
        throw new Error('您没有权限管理此活动');
      }

      // 检查预订是否存在且状态正确
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*, event:events(*)')
        .eq('id', qrData.bookingId)
        .eq('event_id', qrData.eventId)
        .eq('user_id', qrData.userId)
        .single();

      if (bookingError || !booking) {
        throw new Error('预订不存在或QR码无效');
      }

      // 检查是否已经签到
      if (booking.status === 'checked_in') {
        const checkedInTime = booking.checked_in_at 
          ? new Date(booking.checked_in_at).toLocaleString('zh-CN')
          : '未知时间';
        throw new Error(`该预订已在 ${checkedInTime} 完成签到`);
      }

      // 检查预订状态
      if (booking.status === 'cancelled') {
        throw new Error('该预订已取消，无法签到');
      }

      if (booking.status === 'pending') {
        throw new Error('该预订尚未确认，请先确认预订');
      }

      // 获取设备信息
      const deviceInfo = getDeviceInfo();

      // 更新预订状态为已签到
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
          // 如果有device_info字段，可以存储设备信息
          // device_info: deviceInfo, // 如果数据库支持JSON字段
        })
        .eq('id', qrData.bookingId);

      if (updateError) {
        throw new Error(`签到失败: ${updateError.message}`);
      }

      // 创建attendance记录（如果attendance表存在）
      // 这里我们尝试创建，如果表不存在则跳过
      try {
        const { error: attendanceError } = await supabase
          .from('attendance')
          .insert({
            booking_id: qrData.bookingId,
            event_id: qrData.eventId,
            user_id: qrData.userId,
            checked_in_at: new Date().toISOString(),
            device_info: deviceInfo,
            organizer_id: organizer.id,
          });
        
        if (attendanceError) {
          // attendance表可能不存在，这是可选的，不影响主流程
          console.log('Attendance table not found or error:', attendanceError.message);
        }
      } catch (attendanceError: any) {
        // attendance表可能不存在，这是可选的，不影响主流程
        console.log('Attendance table not found, skipping attendance record creation');
      }

      // 标记为已签到（防止重复）
      setCheckedInBookings(prev => {
        const newSet = new Set(prev);
        newSet.add(qrData.bookingId);
        return newSet;
      });

      // 更新状态
      setCheckInStatus('success');
      const attendeeName = booking.attendee_name || booking.user_id || '参与者';
      setStatusMessage(`✅ 签到成功！\n参与者: ${attendeeName}\n时间: ${new Date().toLocaleString('zh-CN')}`);

      // 触发成功回调
      if (onCheckInSuccess) {
        onCheckInSuccess(booking as Booking);
      }

      // 3秒后清除状态
      setTimeout(() => {
        setCheckInStatus('idle');
        setStatusMessage('');
      }, 3000);

    } catch (error: any) {
      console.error('Check-in error:', error);
      setCheckInStatus('error');
      setStatusMessage(`❌ ${error.message || '签到失败'}`);
      
      if (onCheckInError) {
        onCheckInError(error.message || '签到失败');
      }

      // 3秒后清除错误状态
      setTimeout(() => {
        setCheckInStatus('idle');
        setStatusMessage('');
      }, 3000);
    } finally {
      setProcessing(false);
    }
  };

  // 处理QR码扫描结果
  const handleScan = (result: any, error: any) => {
    if (error) {
      // 如果扫描出错，只记录到控制台，不显示给用户（避免频繁提示）
      console.error('QR Scanner Error:', error);
      return;
    }
    
    if (result && result.text && !processing) {
      processQRCode(result.text);
    }
  };

  // 开始/停止扫描
  const toggleScanning = async () => {
    if (scanning) {
      setScanning(false);
      setStatusMessage('');
      setCheckInStatus('idle');
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    } else {
      // 检查摄像头权限
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // 如果成功获取权限，停止预览流（QrReader会自己管理）
        stream.getTracks().forEach(track => track.stop());
        setScanning(true);
        setStatusMessage('请将QR码对准摄像头');
      } catch (error) {
        console.error('Camera access denied:', error);
        setStatusMessage('⚠️ 无法访问摄像头，请检查权限设置');
        setScanning(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">QR码签到扫描器</h3>
          {currentEvent && (
            <p className="text-sm text-gray-600 mt-1">
              活动: {currentEvent.title}
            </p>
          )}
        </div>
        <button
          onClick={toggleScanning}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            scanning
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {scanning ? '⏸️ 停止扫描' : '▶️ 开始扫描'}
        </button>
      </div>

      {scanning ? (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ width: '100%', position: 'relative' }}>
              <QrReader
                onResult={handleScan}
                constraints={{
                  facingMode: 'environment', // 使用后置摄像头
                }}
              />
            </div>
            {processing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-2"></div>
                  <p>处理中...</p>
                </div>
              </div>
            )}
          </div>

          {/* 扫描指引 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>使用提示：</strong>
              <br />
              • 确保光线充足
              <br />
              • 将QR码完整显示在扫描框内
              <br />
              • 保持手机稳定
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <svg
            className="w-24 h-24 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          <p className="text-gray-600 mb-4">点击"开始扫描"按钮启动QR码扫描器</p>
          <p className="text-sm text-gray-500">
            需要摄像头权限才能使用扫描功能
          </p>
        </div>
      )}

      {/* 状态消息 */}
      {statusMessage && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            checkInStatus === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : checkInStatus === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          <p className="text-sm whitespace-pre-line font-medium">{statusMessage}</p>
        </div>
      )}

      {/* 最近签到记录 */}
      {checkedInBookings.size > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">本次会话签到记录</h4>
          <p className="text-sm text-gray-600">
            已成功签到: <span className="font-bold text-green-600">{checkedInBookings.size}</span> 人
          </p>
        </div>
      )}
    </div>
  );
};

export default CheckInScanner;

