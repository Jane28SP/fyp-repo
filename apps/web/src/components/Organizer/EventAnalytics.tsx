import React from 'react';
import { Event, Booking } from '../../lib/supabase';

interface EventAnalyticsProps {
  event: Event;
  bookings: Booking[];
}

interface EventStats {
  totalBookings: number;
  confirmedBookings: number;
  checkedInCount: number;
  cancellationRate: number;
  revenue: number;
  rsvpStats: {
    going: number;
    maybe: number;
    notGoing: number;
  };
}

const EventAnalytics: React.FC<EventAnalyticsProps> = ({ event, bookings }) => {
  const calculateStats = (): EventStats => {
    const eventBookings = bookings.filter(b => b.event_id === event.id);
    const totalBookings = eventBookings.length;
    const confirmedBookings = eventBookings.filter(b => b.status === 'confirmed').length;
    const checkedInCount = eventBookings.filter(b => b.status === 'checked_in').length;
    const cancelledBookings = eventBookings.filter(b => b.status === 'cancelled').length;
    const cancellationRate = totalBookings ? (cancelledBookings / totalBookings) * 100 : 0;
    const revenue = eventBookings.filter(b => b.status !== 'cancelled').length * event.price;

    const rsvpStats = {
      going: eventBookings.filter(b => b.rsvp_status === 'going').length,
      maybe: eventBookings.filter(b => b.rsvp_status === 'maybe').length,
      notGoing: eventBookings.filter(b => b.rsvp_status === 'not_going').length,
    };

    return {
      totalBookings,
      confirmedBookings,
      checkedInCount,
      cancellationRate,
      revenue,
      rsvpStats,
    };
  };

  const stats = calculateStats();
  const capacityPercentage = (stats.confirmedBookings / event.capacity) * 100;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Event Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Booking Status</div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-gray-900">
              {stats.confirmedBookings}/{event.capacity}
            </div>
            <div className="mt-1 text-sm text-gray-500">Confirmed/Total Capacity</div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 rounded-full h-2"
              style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Check-in Rate</div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-gray-900">
              {stats.confirmedBookings ? 
                Math.round((stats.checkedInCount / stats.confirmedBookings) * 100) : 0}%
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {stats.checkedInCount} checked in
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Revenue</div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-gray-900">
              RM {stats.revenue}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Cancellation rate: {Math.round(stats.cancellationRate)}%
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-500 mb-3">RSVP Statistics</h4>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-lg font-semibold text-green-600">
              {stats.rsvpStats.going}
            </div>
            <div className="text-sm text-gray-500">Going</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">
              {stats.rsvpStats.maybe}
            </div>
            <div className="text-sm text-gray-500">Maybe</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-red-600">
              {stats.rsvpStats.notGoing}
            </div>
            <div className="text-sm text-gray-500">Not Going</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventAnalytics;

