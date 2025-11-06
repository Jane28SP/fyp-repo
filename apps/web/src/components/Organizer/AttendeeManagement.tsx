import React, { useState } from 'react';
import { Event, Booking } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

interface AttendeeManagementProps {
  event: Event;
  bookings: Booking[];
  onBookingUpdate: () => void;
}

interface AttendeeFilters {
  status: string;
  rsvpStatus: string;
  searchTerm: string;
}

const AttendeeManagement: React.FC<AttendeeManagementProps> = ({ event, bookings, onBookingUpdate }) => {
  const [filters, setFilters] = useState<AttendeeFilters>({
    status: 'all',
    rsvpStatus: 'all',
    searchTerm: '',
  });
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredBookings = bookings.filter(booking => {
    if (filters.status !== 'all' && booking.status !== filters.status) return false;
    if (filters.rsvpStatus !== 'all' && booking.rsvp_status !== filters.rsvpStatus) return false;
    if (filters.searchTerm && !booking.user_id.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      onBookingUpdate();
    } catch (error) {
      console.error('更新预订状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .in('id', selectedBookings);

      if (error) throw error;
      onBookingUpdate();
      setSelectedBookings([]);
    } catch (error) {
      console.error('批量更新状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;
      onBookingUpdate();
    } catch (error) {
      console.error('签到失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">参与者管理</h3>
          {selectedBookings.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkStatusChange('confirmed')}
                disabled={loading}
                className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200"
              >
                批量确认
              </button>
              <button
                onClick={() => handleBulkStatusChange('cancelled')}
                disabled={loading}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200"
              >
                批量取消
              </button>
            </div>
          )}
        </div>

        <div className="flex space-x-4 mb-6">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">所有状态</option>
            <option value="confirmed">已确认</option>
            <option value="pending">待确认</option>
            <option value="cancelled">已取消</option>
            <option value="checked_in">已签到</option>
          </select>

          <select
            value={filters.rsvpStatus}
            onChange={(e) => setFilters({ ...filters, rsvpStatus: e.target.value })}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">所有RSVP状态</option>
            <option value="going">确定参加</option>
            <option value="maybe">可能参加</option>
            <option value="not_going">不参加</option>
          </select>

          <input
            type="text"
            placeholder="搜索参与者..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedBookings.length === filteredBookings.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBookings(filteredBookings.map(b => b.id));
                      } else {
                        setSelectedBookings([]);
                      }
                    }}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  RSVP
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  预订时间
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedBookings.includes(booking.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBookings([...selectedBookings, booking.id]);
                        } else {
                          setSelectedBookings(selectedBookings.filter(id => id !== booking.id));
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {booking.user_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'checked_in' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status === 'confirmed' ? '已确认' :
                       booking.status === 'checked_in' ? '已签到' :
                       booking.status === 'cancelled' ? '已取消' :
                       '待确认'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.rsvp_status === 'going' ? 'bg-green-100 text-green-800' :
                      booking.rsvp_status === 'maybe' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.rsvp_status === 'going' ? '参加' :
                       booking.rsvp_status === 'maybe' ? '可能' :
                       '不参加'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(booking.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {booking.status !== 'checked_in' && booking.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCheckIn(booking.id)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          签到
                        </button>
                      )}
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                          disabled={loading}
                          className="text-green-600 hover:text-green-900"
                        >
                          确认
                        </button>
                      )}
                      {booking.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusChange(booking.id, 'cancelled')}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900"
                        >
                          取消
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendeeManagement;

