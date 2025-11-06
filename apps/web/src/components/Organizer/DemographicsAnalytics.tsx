import React from 'react';
import { Event, Booking } from '../../lib/supabase';

interface DemographicsAnalyticsProps {
  events: Event[];
  bookings: Booking[];
}

interface DemographicsData {
  ageGroups: { group: string; count: number; percentage: number }[];
  genderDistribution: { gender: string; count: number; percentage: number }[];
  locationData: { location: string; count: number; percentage: number }[];
  engagementMetrics: {
    averageSessionTime: number;
    repeatAttendees: number;
    socialShares: number;
    feedbackScore: number;
  };
  attendeeGrowth: { month: string; newAttendees: number; totalAttendees: number }[];
}

const DemographicsAnalytics: React.FC<DemographicsAnalyticsProps> = ({ events, bookings }) => {
  // Mock demographics data (in a real app, this would come from user profiles)
  const demographicsData: DemographicsData = {
    ageGroups: [
      { group: '18-24', count: 45, percentage: 22 },
      { group: '25-34', count: 78, percentage: 38 },
      { group: '35-44', count: 52, percentage: 25 },
      { group: '45-54', count: 25, percentage: 12 },
      { group: '55+', count: 8, percentage: 4 }
    ],
    genderDistribution: [
      { gender: 'Female', count: 112, percentage: 54 },
      { gender: 'Male', count: 89, percentage: 43 },
      { gender: 'Other', count: 6, percentage: 3 }
    ],
    locationData: [
      { location: 'New York', count: 65, percentage: 31 },
      { location: 'San Francisco', count: 48, percentage: 23 },
      { location: 'Los Angeles', count: 38, percentage: 18 },
      { location: 'Chicago', count: 32, percentage: 15 },
      { location: 'Other', count: 25, percentage: 12 }
    ],
    engagementMetrics: {
      averageSessionTime: 125, // minutes
      repeatAttendees: 68,
      socialShares: 234,
      feedbackScore: 4.6
    },
    attendeeGrowth: [
      { month: 'Jan', newAttendees: 45, totalAttendees: 45 },
      { month: 'Feb', newAttendees: 32, totalAttendees: 77 },
      { month: 'Mar', newAttendees: 58, totalAttendees: 135 },
      { month: 'Apr', newAttendees: 41, totalAttendees: 176 },
      { month: 'May', newAttendees: 67, totalAttendees: 243 },
      { month: 'Jun', newAttendees: 52, totalAttendees: 295 }
    ]
  };

  // Calculate total confirmed bookings for the UI
  // const totalBookings = bookings.filter(b => b.status !== 'cancelled').length;

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Demographics & Engagement Analytics</h2>
        
        {/* Engagement Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Avg. Session Time</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {Math.floor(demographicsData.engagementMetrics.averageSessionTime / 60)}h {demographicsData.engagementMetrics.averageSessionTime % 60}m
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Repeat Attendees</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {demographicsData.engagementMetrics.repeatAttendees}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Social Shares</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {demographicsData.engagementMetrics.socialShares}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Feedback Score</div>
                <div className="text-2xl font-semibold text-gray-900">
                  {demographicsData.engagementMetrics.feedbackScore}/5.0
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Demographics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Age Groups */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Age Distribution</h3>
            <div className="space-y-3">
              {demographicsData.ageGroups.map((group) => (
                <div key={group.group} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">{group.group}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${group.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {group.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gender Distribution */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gender Distribution</h3>
            <div className="space-y-3">
              {demographicsData.genderDistribution.map((gender) => (
                <div key={gender.gender} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full mr-3 ${
                      gender.gender === 'Female' ? 'bg-pink-500' :
                      gender.gender === 'Male' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">{gender.gender}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          gender.gender === 'Female' ? 'bg-pink-500' :
                          gender.gender === 'Male' ? 'bg-blue-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${gender.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {gender.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Data */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Geographic Distribution</h3>
            <div className="space-y-3">
              {demographicsData.locationData.map((location) => (
                <div key={location.location} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">{location.location}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${location.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">
                      {location.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attendee Growth Chart */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attendee Growth Over Time</h3>
          <div className="flex items-end space-x-4 h-64">
            {demographicsData.attendeeGrowth.map((month, index) => (
              <div key={month.month} className="flex flex-col items-center flex-1">
                <div className="flex flex-col justify-end h-48 mb-2">
                  <div
                    className="bg-indigo-500 rounded-t-md mb-1"
                    style={{ 
                      height: `${(month.totalAttendees / Math.max(...demographicsData.attendeeGrowth.map(m => m.totalAttendees))) * 180}px`,
                      minHeight: '4px'
                    }}
                    title={`Total: ${month.totalAttendees}`}
                  ></div>
                  <div
                    className="bg-indigo-300 rounded-t-md"
                    style={{ 
                      height: `${(month.newAttendees / Math.max(...demographicsData.attendeeGrowth.map(m => m.newAttendees))) * 60}px`,
                      minHeight: '4px'
                    }}
                    title={`New: ${month.newAttendees}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{month.month}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-6">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Total Attendees</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-300 rounded mr-2"></div>
              <span className="text-sm text-gray-600">New Attendees</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Key Insight</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Your 25-34 age group represents 38% of attendees and shows the highest engagement rate. Consider targeting similar demographics for future events.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Recommendation</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>68% repeat attendance rate is excellent! Consider implementing a loyalty program to further increase retention.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemographicsAnalytics;
