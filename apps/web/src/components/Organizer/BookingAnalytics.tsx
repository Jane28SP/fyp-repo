import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Event, Booking } from '../../lib/supabase';

interface BookingAnalyticsProps {
  events: Event[];
  bookings: Booking[];
}

const BookingAnalytics: React.FC<BookingAnalyticsProps> = ({ events, bookings }) => {
  // Prepare data for charts
  const chartData = useMemo(() => {
    // Booking trend over time
    const bookingTrend = bookings.reduce((acc: any, booking) => {
      const date = new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const trendDates = Object.keys(bookingTrend).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
    const trendValues = trendDates.map(date => bookingTrend[date]);

    // Revenue by event
    const revenueByEvent = events.map(event => {
      const eventBookings = bookings.filter(
        b => b.event_id === event.id && b.status !== 'cancelled'
      );
      const revenue = eventBookings.reduce((sum, _) => sum + (event.price || 0), 0);
      return {
        name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
        value: revenue
      };
    }).sort((a, b) => b.value - a.value);

    // Booking status distribution
    const statusCounts = bookings.reduce((acc: any, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    // Bookings per event
    const bookingsPerEvent = events.map(event => {
      const count = bookings.filter(
        b => b.event_id === event.id && b.status !== 'cancelled'
      ).length;
      return {
        name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
        value: count
      };
    }).sort((a, b) => b.value - a.value);

    // Booking rate by event (bookings / capacity)
    const bookingRate = events.map(event => {
      const bookingCount = bookings.filter(
        b => b.event_id === event.id && b.status !== 'cancelled'
      ).length;
      const rate = event.capacity > 0 ? (bookingCount / event.capacity) * 100 : 0;
      return {
        name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
        value: Math.round(rate)
      };
    }).sort((a, b) => b.value - a.value);

    return {
      trendDates,
      trendValues,
      revenueByEvent,
      statusCounts,
      bookingsPerEvent,
      bookingRate
    };
  }, [events, bookings]);

  // Booking Trend Line Chart
  const bookingTrendOption = {
    title: {
      text: 'Booking Trend Over Time',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: '600', color: '#374151' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' }
    },
    xAxis: {
      type: 'category',
      data: chartData.trendDates,
      axisLabel: { rotate: 45, color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    yAxis: {
      type: 'value',
      name: 'Bookings',
      nameTextStyle: { color: '#6b7280' },
      axisLabel: { color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [{
      data: chartData.trendValues,
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(228, 40, 31, 0.2)' },
            { offset: 1, color: 'rgba(228, 40, 31, 0.02)' }
          ]
        }
      },
      lineStyle: { color: '#E4281F', width: 3 },
      itemStyle: { color: '#E4281F' }
    }],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
      backgroundColor: 'transparent'
    }
  };

  // Revenue by Event Bar Chart
  const revenueChartOption = {
    title: {
      text: 'Revenue by Event',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: '600', color: '#374151' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>RM ${param.value.toLocaleString()}`;
      }
    },
    xAxis: {
      type: 'category',
      data: chartData.revenueByEvent.map(item => item.name),
      axisLabel: { rotate: 45, interval: 0, color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    yAxis: {
      type: 'value',
      name: 'Revenue (RM)',
      nameTextStyle: { color: '#6b7280' },
      axisLabel: { color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [{
      data: chartData.revenueByEvent.map(item => item.value),
      type: 'bar',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#E4281F' },
            { offset: 1, color: '#c7221a' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '20%',
      containLabel: true,
      backgroundColor: 'transparent'
    }
  };

  // Booking Status Pie Chart
  const statusChartOption = {
    title: {
      text: 'Booking Status Distribution',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: '600', color: '#374151' }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      textStyle: { color: '#6b7280' }
    },
    series: [{
      name: 'Booking Status',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        color: '#374151',
        formatter: '{b}: {c}\n({d}%)'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: '600'
        },
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.1)'
        }
      },
      data: [
        { value: chartData.statusCounts.confirmed || 0, name: 'Confirmed', itemStyle: { color: '#10b981' } },
        { value: chartData.statusCounts.checked_in || 0, name: 'Checked In', itemStyle: { color: '#3b82f6' } },
        { value: chartData.statusCounts.pending || 0, name: 'Pending', itemStyle: { color: '#f59e0b' } },
        { value: chartData.statusCounts.cancelled || 0, name: 'Cancelled', itemStyle: { color: '#dc2626' } }
      ]
    }]
  };

  // Bookings per Event Bar Chart
  const bookingsPerEventOption = {
    title: {
      text: 'Total Bookings per Event',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: '600', color: '#374151' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' }
    },
    xAxis: {
      type: 'category',
      data: chartData.bookingsPerEvent.map(item => item.name),
      axisLabel: { rotate: 45, interval: 0, color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    yAxis: {
      type: 'value',
      name: 'Number of Bookings',
      nameTextStyle: { color: '#6b7280' },
      axisLabel: { color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [{
      data: chartData.bookingsPerEvent.map(item => item.value),
      type: 'bar',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: '#f59e0b' },
            { offset: 1, color: '#d97706' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '20%',
      containLabel: true,
      backgroundColor: 'transparent'
    }
  };

  // Booking Rate (Utilization) Chart
  const bookingRateOption = {
    title: {
      text: 'Event Capacity Utilization (%)',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: '600', color: '#374151' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>${param.value}% utilized`;
      }
    },
    xAxis: {
      type: 'category',
      data: chartData.bookingRate.map(item => item.name),
      axisLabel: { rotate: 45, interval: 0, color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    yAxis: {
      type: 'value',
      name: 'Utilization %',
      max: 100,
      nameTextStyle: { color: '#6b7280' },
      axisLabel: { color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [{
      data: chartData.bookingRate.map(item => item.value),
      type: 'bar',
      itemStyle: {
        color: (params: any) => {
          const value = params.value;
          if (value >= 80) return '#10b981';
          if (value >= 50) return '#f59e0b';
          return '#dc2626';
        },
        borderRadius: [4, 4, 0, 0]
      }
    }],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '20%',
      containLabel: true,
      backgroundColor: 'transparent'
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No booking data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Bookings</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {bookings.filter(b => b.status !== 'cancelled').length}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</div>
          <div className="text-2xl font-bold text-gray-900 mt-1" style={{ color: '#E4281F' }}>
            RM {bookings.reduce((sum, booking) => {
              const event = events.find(e => e.id === booking.event_id);
              return booking.status !== 'cancelled' ? sum + (event?.price || 0) : sum;
            }, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-100 shadow-sm">
          <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Average Booking Value</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            RM {(() => {
              const validBookings = bookings.filter(b => b.status !== 'cancelled');
              if (validBookings.length === 0) return 0;
              const total = validBookings.reduce((sum, booking) => {
                const event = events.find(e => e.id === booking.event_id);
                return sum + (event?.price || 0);
              }, 0);
              return Math.round(total / validBookings.length);
            })()}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trend */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-100">
          <ReactECharts option={bookingTrendOption} style={{ height: '350px', width: '100%' }} />
        </div>

        {/* Revenue by Event */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-100">
          <ReactECharts option={revenueChartOption} style={{ height: '350px', width: '100%' }} />
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-100">
          <ReactECharts option={statusChartOption} style={{ height: '350px', width: '100%' }} />
        </div>

        {/* Bookings per Event */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-100">
          <ReactECharts option={bookingsPerEventOption} style={{ height: '350px', width: '100%' }} />
        </div>
      </div>

      {/* Capacity Utilization */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-100">
        <ReactECharts option={bookingRateOption} style={{ height: '400px', width: '100%' }} />
      </div>
    </div>
  );
};

export default BookingAnalytics;

