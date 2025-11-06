import React, { useState, useEffect } from 'react';
import { Event, Booking } from '../../lib/supabase';

interface RevenueTrackingProps {
  events: Event[];
  bookings: Booking[];
}

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: { month: string; revenue: number }[];
  paymentMethodBreakdown: { method: string; amount: number; percentage: number }[];
  topPerformingEvents: { event: Event; revenue: number; bookings: number }[];
  revenueGrowth: number;
}

const RevenueTracking: React.FC<RevenueTrackingProps> = ({ events, bookings }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);

  useEffect(() => {
    calculateRevenueData();
  }, [events, bookings, timeRange]); // calculateRevenueData is defined in the same component

  const calculateRevenueData = () => {
    // Filter bookings by time range
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filteredBookings = bookings.filter(
      booking => new Date(booking.created_at) >= startDate && booking.status !== 'cancelled'
    );

    // Calculate total revenue
    const totalRevenue = filteredBookings.reduce((sum, booking) => {
      const event = events.find(e => e.id === booking.event_id);
      return sum + (event?.price || 0);
    }, 0);

    // Calculate monthly revenue (mock data for demo)
    const monthlyRevenue = [
      { month: 'Jan', revenue: 2400 },
      { month: 'Feb', revenue: 1398 },
      { month: 'Mar', revenue: 9800 },
      { month: 'Apr', revenue: 3908 },
      { month: 'May', revenue: 4800 },
      { month: 'Jun', revenue: 3800 },
    ];

    // Payment method breakdown (mock data)
    const paymentMethodBreakdown = [
      { method: 'Stripe', amount: totalRevenue * 0.6, percentage: 60 },
      { method: 'PayPal', amount: totalRevenue * 0.3, percentage: 30 },
      { method: 'Free', amount: 0, percentage: 10 },
    ];

    // Top performing events
    const eventRevenue = new Map<string, { revenue: number; bookings: number }>();
    
    filteredBookings.forEach(booking => {
      const event = events.find(e => e.id === booking.event_id);
      if (event) {
        const current = eventRevenue.get(event.id) || { revenue: 0, bookings: 0 };
        eventRevenue.set(event.id, {
          revenue: current.revenue + event.price,
          bookings: current.bookings + 1
        });
      }
    });

    const topPerformingEvents = Array.from(eventRevenue.entries())
      .map(([eventId, data]) => ({
        event: events.find(e => e.id === eventId)!,
        revenue: data.revenue,
        bookings: data.bookings
      }))
      .filter(item => item.event)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Revenue growth (mock calculation)
    const revenueGrowth = 12.5;

    setRevenueData({
      totalRevenue,
      monthlyRevenue,
      paymentMethodBreakdown,
      topPerformingEvents,
      revenueGrowth
    });
  };

  const formatCurrency = (amount: number) => `RM ${amount.toLocaleString()}`;

  if (!revenueData) return <div>Loading revenue data...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Revenue Tracking</h2>
          <div className="flex space-x-2">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  timeRange === range
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(revenueData.totalRevenue)}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <svg className="self-center flex-shrink-0 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="sr-only">Increased by</span>
                      {revenueData.revenueGrowth}%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Revenue per Event</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(events.length ? revenueData.totalRevenue / events.length : 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Ticket Sales</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {bookings.filter(b => b.status !== 'cancelled').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method Breakdown</h3>
        <div className="space-y-4">
          {revenueData.paymentMethodBreakdown.map((method) => (
            <div key={method.method} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  method.method === 'Stripe' ? 'bg-blue-500' :
                  method.method === 'PayPal' ? 'bg-blue-600' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm font-medium text-gray-900">{method.method}</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">{method.percentage}%</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(method.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing Events */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Events</h3>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Price
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueData.topPerformingEvents.map((item, index) => (
                <tr key={item.event.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.event.title}</div>
                    <div className="text-sm text-gray-500">{item.event.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.bookings}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrency(item.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(item.event.price)}
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

export default RevenueTracking;
