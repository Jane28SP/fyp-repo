import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'event_update' | 'reminder' | 'announcement' | 'booking_confirmation';
  timestamp: string;
  read: boolean;
  eventId?: string;
}

interface NotificationCenterProps {
  userId: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initialize notifications
    loadNotifications();

    // Set up Supabase Realtime subscription for events table
    const eventsChannel = supabase
      .channel('events-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('Event updated:', payload);
          // Add notification when an event is updated
          const newNotification: Notification = {
            id: `event-update-${Date.now()}`,
            title: 'Event Update',
            message: `The event "${payload.new.title}" has been updated. Please check for changes.`,
            type: 'event_update',
            timestamp: new Date().toISOString(),
            read: false,
            eventId: payload.new.id
          };
          addNotification(newNotification);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('New event created:', payload);
          // Add notification for new events
          const newNotification: Notification = {
            id: `new-event-${Date.now()}`,
            title: 'New Event Available',
            message: `New event "${payload.new.title}" is now available for booking!`,
            type: 'announcement',
            timestamp: new Date().toISOString(),
            read: false,
            eventId: payload.new.id
          };
          addNotification(newNotification);
        }
      )
      .subscribe();

    // Set up Realtime subscription for bookings table
    const bookingsChannel = supabase
      .channel('bookings-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Booking confirmed:', payload);
          // Add booking confirmation notification
          const newNotification: Notification = {
            id: `booking-${Date.now()}`,
            title: 'Booking Confirmed',
            message: 'Your booking has been successfully confirmed! Check your email for details.',
            type: 'booking_confirmation',
            timestamp: new Date().toISOString(),
            read: false,
            eventId: payload.new.event_id
          };
          addNotification(newNotification);
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [userId]);

  const loadNotifications = () => {
    // Load from localStorage
    const savedNotifications = localStorage.getItem(`notifications_${userId}`);
    
    if (savedNotifications) {
      const parsed = JSON.parse(savedNotifications);
      setNotifications(parsed);
      setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
    } else {
      // Initialize with mock notifications
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Welcome to JomEvent!',
          message: 'Start exploring amazing events happening around you.',
          type: 'announcement',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'Event Reminder',
          message: 'Don\'t forget to check in using your QR code when attending events!',
          type: 'reminder',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          read: false
        }
      ];

      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(mockNotifications));
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      // Keep only last 50 notifications
      const trimmed = updated.slice(0, 50);
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(trimmed));
      return trimmed;
    });
    setUnreadCount(prev => prev + 1);

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png'
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      );
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(0);
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'event_update':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFBE54' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      case 'reminder':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FCD34D' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'announcement':
        return (
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E4281F' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
        );
      case 'booking_confirmation':
        return (
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse" style={{ backgroundColor: '#E4281F' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border-2 border-gray-100 z-50 max-h-[600px] flex flex-col">
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm font-semibold hover:underline transition-colors"
                    style={{ color: '#FFBE54' }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-600 mt-1">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">We'll notify you when something arrives</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-orange-50/50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-gray-900">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: '#E4281F' }}></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center text-sm font-semibold hover:underline transition-colors"
                  style={{ color: '#FFBE54' }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
