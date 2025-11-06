import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Event, Booking } from '../../lib/supabase';

interface SalesRevenueChartsProps {
  events: Event[];
  bookings: Booking[];
}

const SalesRevenueCharts: React.FC<SalesRevenueChartsProps> = ({ events, bookings }) => {
  // Prepare data for charts
  const chartData = useMemo(() => {
    // Calculate ticket sales and revenue by date
    const salesByDate: { [key: string]: { sales: number; revenue: number } } = {};
    
    bookings
      .filter(b => b.status !== 'cancelled')
      .forEach(booking => {
        const date = new Date(booking.created_at).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
        
        if (!salesByDate[date]) {
          salesByDate[date] = { sales: 0, revenue: 0 };
        }
        
        const event = events.find(e => e.id === booking.event_id);
        if (event) {
          salesByDate[date].sales += 1;
          // Calculate revenue considering discount
          const discountAmount = booking.discount_amount || 0;
          const ticketPrice = event.price || 0;
          salesByDate[date].revenue += Math.max(0, ticketPrice - discountAmount);
        }
      });

    const sortedDates = Object.keys(salesByDate).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    const salesData = sortedDates.map(date => salesByDate[date].sales);
    const revenueData = sortedDates.map(date => salesByDate[date].revenue);

    // Calculate sales and revenue by event
    const eventStats = events.map(event => {
      const eventBookings = bookings.filter(
        b => b.event_id === event.id && b.status !== 'cancelled'
      );
      
      const sales = eventBookings.length;
      const revenue = eventBookings.reduce((sum, booking) => {
        const discountAmount = booking.discount_amount || 0;
        const ticketPrice = event.price || 0;
        return sum + Math.max(0, ticketPrice - discountAmount);
      }, 0);

      return {
        name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
        sales,
        revenue
      };
    }).sort((a, b) => b.revenue - a.revenue);

    return {
      dates: sortedDates,
      salesData,
      revenueData,
      eventStats
    };
  }, [events, bookings]);

  // Ticket Sales Over Time Chart
  const salesChartOption = {
    title: {
      text: 'Ticket Sales Over Time',
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: '600', color: '#374151' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      formatter: (params: any) => {
        const date = params[0].axisValue;
        const value = params[0].value;
        return `${date}<br/>Tickets Sold: <strong>${value}</strong>`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.dates,
      axisLabel: { 
        rotate: 45, 
        color: '#6b7280',
        fontSize: 11
      },
      axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    yAxis: {
      type: 'value',
      name: 'Tickets Sold',
      nameTextStyle: { color: '#6b7280' },
      axisLabel: { color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [
      {
        name: 'Ticket Sales',
        type: 'line',
        data: chartData.salesData,
        smooth: true,
        lineStyle: {
          color: '#3b82f6',
          width: 3
        },
        itemStyle: {
          color: '#3b82f6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  };

  // Revenue Over Time Chart
  const revenueChartOption = {
    title: {
      text: 'Revenue Over Time',
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: '600', color: '#374151' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      formatter: (params: any) => {
        const date = params[0].axisValue;
        const value = params[0].value;
        return `${date}<br/>Revenue: <strong>RM ${value.toLocaleString()}</strong>`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.dates,
      axisLabel: { 
        rotate: 45, 
        color: '#6b7280',
        fontSize: 11
      },
      axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    yAxis: {
      type: 'value',
      name: 'Revenue (RM)',
      nameTextStyle: { color: '#6b7280' },
      axisLabel: { 
        color: '#6b7280',
        formatter: (value: number) => `RM ${(value / 1000).toFixed(0)}k`
      },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [
      {
        name: 'Revenue',
        type: 'bar',
        data: chartData.revenueData,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#059669' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#059669' },
                { offset: 1, color: '#047857' }
              ]
            }
          }
        }
      }
    ]
  };

  // Sales by Event Chart
  const salesByEventOption = {
    title: {
      text: 'Ticket Sales by Event',
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: '600', color: '#374151' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      formatter: (params: any) => {
        const event = params[0];
        return `${event.name}<br/>Tickets Sold: <strong>${event.value}</strong>`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.eventStats.map(e => e.name),
      axisLabel: { 
        rotate: 45, 
        color: '#6b7280',
        fontSize: 11
      },
      axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    yAxis: {
      type: 'value',
      name: 'Tickets Sold',
      nameTextStyle: { color: '#6b7280' },
      axisLabel: { color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [
      {
        name: 'Ticket Sales',
        type: 'bar',
        data: chartData.eventStats.map(e => e.sales),
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
        },
        emphasis: {
          focus: 'series'
        }
      }
    ]
  };

  // Revenue by Event Chart
  const revenueByEventOption = {
    title: {
      text: 'Revenue by Event',
      left: 'center',
      textStyle: { fontSize: 18, fontWeight: '600', color: '#374151' }
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      formatter: (params: any) => {
        return `${params.name}<br/>Revenue: <strong>RM ${params.value.toLocaleString()}</strong><br/>Percentage: ${params.percent}%`;
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
      textStyle: { color: '#6b7280', fontSize: 12 }
    },
    series: [
      {
        name: 'Revenue',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: (params: any) => {
            return `${params.name}\nRM ${params.value.toLocaleString()}`;
          },
          fontSize: 11,
          color: '#374151'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 13,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: chartData.eventStats
          .filter(e => e.revenue > 0)
          .map(e => ({
            value: e.revenue,
            name: e.name
          }))
          .slice(0, 10) // Top 10 events
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Sales and Revenue Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <ReactECharts 
            option={salesChartOption} 
            style={{ height: '400px', width: '100%' }} 
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <ReactECharts 
            option={revenueChartOption} 
            style={{ height: '400px', width: '100%' }} 
          />
        </div>
      </div>

      {/* Sales and Revenue by Event */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <ReactECharts 
            option={salesByEventOption} 
            style={{ height: '400px', width: '100%' }} 
          />
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <ReactECharts 
            option={revenueByEventOption} 
            style={{ height: '400px', width: '100%' }} 
          />
        </div>
      </div>
    </div>
  );
};

export default SalesRevenueCharts;

