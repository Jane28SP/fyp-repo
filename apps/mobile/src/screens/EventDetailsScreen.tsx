import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { Event } from '../../../web/src/lib/supabase';

type EventDetailsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EventDetails'>;
  route: RouteProp<RootStackParamList, 'EventDetails'>;
};

export default function EventDetailsScreen({ navigation, route }: EventDetailsScreenProps) {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error('Failed to load event:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = () => {
    navigation.navigate('Booking', { eventId });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E4281F" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {event.image_url && (
          <Image source={{ uri: event.image_url }} style={styles.image} />
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📅 Date & Time</Text>
            <Text style={styles.infoValue}>
              {new Date(event.date).toLocaleDateString()} at {event.time}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📍 Location</Text>
            <Text style={styles.infoValue}>{event.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>💰 Price</Text>
            <Text style={styles.priceValue}>
              {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>👥 Capacity</Text>
            <Text style={styles.infoValue}>{event.capacity} spots</Text>
          </View>

          {event.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.category}</Text>
            </View>
          )}

          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <Text style={styles.footerPrice}>
            {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.bookButton} onPress={handleBook}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#e0e0e0',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  infoRow: {
    marginBottom: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E4281F',
  },
  categoryBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  categoryText: {
    color: '#FF6F00',
    fontWeight: '600',
  },
  descriptionContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  priceContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footerPriceLabel: {
    fontSize: 12,
    color: '#666',
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E4281F',
  },
  bookButton: {
    backgroundColor: '#E4281F',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
