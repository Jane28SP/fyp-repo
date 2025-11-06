import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../supabaseClient';

interface Booking {
  id: string;
  event_id: string;
  status: string;
  created_at: string;
  event: {
    title: string;
    date: string;
    time: string;
    location: string;
  };
}

export default function DashboardScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAndBookings();
  }, []);

  const fetchUserAndBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.replace('Login');
        return;
      }
      setUser(user);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          event:events(title, date, time, location)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserAndBookings();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const isExpanded = selectedBooking === item.id;
    
    return (
      <View style={styles.bookingCard}>
        <TouchableOpacity
          style={styles.bookingHeader}
          onPress={() => setSelectedBooking(isExpanded ? null : item.id)}
        >
          <View style={styles.bookingInfo}>
            <Text style={styles.bookingTitle}>{item.event.title}</Text>
            <View style={styles.bookingDetails}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.bookingDate}>{item.event.date}</Text>
            </View>
            <View style={styles.bookingDetails}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.bookingDate}>{item.event.location}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              item.status === 'confirmed' && styles.statusConfirmed,
              item.status === 'cancelled' && styles.statusCancelled,
            ]}>
              <Text style={styles.statusText}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrLabel}>Your Ticket QR Code</Text>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={JSON.stringify({
                  bookingId: item.id,
                  eventId: item.event_id,
                  userId: user?.id,
                })}
                size={200}
              />
            </View>
            <Text style={styles.qrHint}>
              Show this at the event entrance
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E4281F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <Text style={styles.headerSubtitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="ticket-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No bookings yet</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Events')}
          >
            <Text style={styles.browseButtonText}>Browse Events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          renderItem={renderBooking}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#4a5568',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  logoutButton: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  bookingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingDate: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusConfirmed: {
    backgroundColor: '#48bb78',
  },
  statusCancelled: {
    backgroundColor: '#f56565',
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  qrLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  qrHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#718096',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#E4281F',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

