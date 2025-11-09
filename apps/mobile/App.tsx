import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
  Dimensions,
  Image,
  ImageBackground,
  Share,
  Platform
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Polyline, Rect } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { WebView } from 'react-native-webview';
import { supabase } from './src/supabaseClient';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const EVENT_CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;
interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  price: number;
  category?: string;
  image_url?: string;
  organizer_id: string;
}

interface Booking {
  id: string;
  user_id: string;
  event_id: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'checked_in';
  created_at: string;
  event?: Event;
  attendee_name?: string;
  attendee_email?: string;
  attendee_phone?: string;
  payment_id?: string;
  payment_method?: string;
}

interface CartItem {
  event: Event;
  quantity: number;
}

const HomeIcon = ({ color = '#666', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

const CartIcon = ({ color = '#666', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="8" cy="21" r="1" />
    <Circle cx="19" cy="21" r="1" />
    <Path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </Svg>
);

const TicketIcon = ({ color = '#666', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <Path d="M13 5v2" />
    <Path d="M13 17v2" />
    <Path d="M13 11v2" />
  </Svg>
);

const BookingIcon = ({ color = '#666', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M8 2v4" />
    <Path d="M16 2v4" />
    <Rect width="18" height="18" x="3" y="4" rx="2" />
    <Path d="M3 10h18" />
  </Svg>
);

const ProfileIcon = ({ color = '#666', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'events' | 'cart' | 'bookings' | 'profile'>('home');
  const [showLogin, setShowLogin] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [profileTab, setProfileTab] = useState<'info' | 'reviews' | 'wishlist' | 'bookings'>('info');
  const [wishlist, setWishlist] = useState<Array<{ id: string; event_id: string; event: Event }>>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [showPayPalModal, setShowPayPalModal] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState('');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserBookings();
      fetchWishlist();
      loadReviews();
    } else {
      setWishlist([]);
      setReviews([]);
    }
  }, [user]);

  const loadReviews = async () => {
    if (!user) return;
    try {
      const data = await AsyncStorage.getItem(`userReviews_${user.id}`);
      setReviews(JSON.parse(data || '[]'));
    } catch (error) {
      setReviews([]);
    }
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        setShowLogin(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setShowLogin(true);
    } finally {
    setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        Alert.alert('Error', `Failed to load events: ${error.message}`);
      } else if (data) {
        setEvents(data);
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to load events: ${error.message}`);
    }
  };

  const fetchUserBookings = async () => {
    if (!user) {
      setUserBookings([]);
      return;
    }
    
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'sznagdhpnjexuuydnimh';
      const storageKey = `sb-${projectRef}-auth-token`;
      const storedSession = await AsyncStorage.getItem(storageKey);
      
      if (!storedSession) {
        setUserBookings([]);
        return;
      }

      const parsedSession = JSON.parse(storedSession);
      if (!parsedSession?.access_token) {
        setUserBookings([]);
        return;
      }

      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
      const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bmFnZGhwbmlexuuydnimhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzg4NjEsImV4cCI6MjA3MDE1NDg2MX0.TS8kgZjDjGhNSutksFEwJf7kslrqUddaChEbzdNqpl4';

      const bookingsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/bookings?user_id=eq.${user.id}&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${parsedSession.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
        }
      );

      if (!bookingsResponse.ok) {
        console.error('Failed to load bookings:', bookingsResponse.status);
        setUserBookings([]);
        return;
      }

      const bookingsData = await bookingsResponse.json();

      if (!bookingsData || bookingsData.length === 0) {
        setUserBookings([]);
        return;
      }

      const eventIds = Array.from(new Set(bookingsData.map((b: any) => b.event_id)));
      
      if (eventIds.length === 0) {
        setUserBookings([]);
        return;
      }

      const eventsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/events?select=*&id=in.(${eventIds.join(',')})`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${parsedSession.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!eventsResponse.ok) {
        console.error('Failed to load events:', eventsResponse.status);
        setUserBookings([]);
        return;
      }

      const eventsData = await eventsResponse.json();
      
      const eventsMap = new Map(eventsData.map((e: any) => [e.id, e]));

      const bookingsWithEvents = bookingsData
        .map((booking: any) => ({
          ...booking,
          event: eventsMap.get(booking.event_id) || null
        }))
        .filter((booking: any) => booking.event !== null)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });

      setUserBookings(bookingsWithEvents);
    } catch (error: any) {
      console.error('Failed to fetch bookings:', error);
      setUserBookings([]);
    }
  };

  const handleDownloadBooking = async (booking: Booking) => {
    if (!booking.event) return;

    try {
      const bookingInfo = `
📋 BOOKING ITINERARY

Event: ${booking.event.title}
Date: ${booking.event.date}
Time: ${booking.event.time}
Location: ${booking.event.location}
Price: RM ${booking.event.price}
Status: ${booking.status.toUpperCase()}
Booking ID: ${booking.id}
Booked on: ${new Date(booking.created_at).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}

${booking.attendee_name ? `Attendee: ${booking.attendee_name}` : ''}
${booking.attendee_email ? `Email: ${booking.attendee_email}` : ''}
${booking.attendee_phone ? `Phone: ${booking.attendee_phone}` : ''}

QR Code: Please view in booking details
Booking Reference: ${booking.id}

---
Generated by JomEvent
      `.trim();

      if (Platform.OS === 'web') {
        const blob = new Blob([bookingInfo], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `booking_${booking.id}_itinerary.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Itinerary downloaded successfully');
      } else {
        const fileName = `booking_${booking.id}_itinerary.txt`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        try {
          await FileSystem.writeAsStringAsync(fileUri, bookingInfo);

          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'text/plain',
              dialogTitle: 'Save Booking Itinerary',
            });
            Alert.alert('Success', 'Itinerary saved successfully!');
          } else {
            Alert.alert(
              'Download Complete',
              `Itinerary saved to: ${fileUri}\n\nYou can find it in your Downloads folder.`,
              [{ text: 'OK' }]
            );
          }
        } catch (writeError: any) {
          console.error('File write error:', writeError);
          Alert.alert('Error', writeError.message || 'Failed to save file');
        }
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Error', error.message || 'Failed to download itinerary');
    }
  };

  const handleShareBooking = async (booking: Booking) => {
    if (!booking.event) return;

    try {
      const shareMessage = `
🎫 Check out my booking!

Event: ${booking.event.title}
Date: ${booking.event.date} at ${booking.event.time}
Location: ${booking.event.location}

Booked via JomEvent
      `.trim();

      const result = await Share.share({
        message: shareMessage,
        title: `My Booking - ${booking.event.title}`,
      });

      if (result.action === Share.sharedAction) {
        // Share successful
      } else if (result.action === Share.dismissedAction) {
        // Share dismissed
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to share booking');
    }
  };

  const fetchWishlist = async () => {
    if (!user) return;
    
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'sznagdhpnjexuuydnimh';
      const storageKey = `sb-${projectRef}-auth-token`;
      const storedSession = await AsyncStorage.getItem(storageKey);
      
      if (!storedSession) {
        setWishlist([]);
        return;
      }

      const parsedSession = JSON.parse(storedSession);
      if (!parsedSession?.access_token) {
        setWishlist([]);
        return;
      }

      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
      const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bmFnZGhwbmpleHV1eWRuaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzg4NjEsImV4cCI6MjA3MDE1NDg2MX0.TS8kgZjDjGhNSutksFEwJf7kslrqUddaChEbzdNqpl4';

      const wishlistResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/wishlist?user_id=eq.${user.id}&select=id,user_id,event_id,created_at&order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${parsedSession.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!wishlistResponse.ok) {
        setWishlist([]);
        return;
      }

      const wishlistData = await wishlistResponse.json();
      if (!wishlistData || wishlistData.length === 0) {
        setWishlist([]);
        return;
      }

      const eventIds = wishlistData.map((item: any) => item.event_id).join(',');
      const eventsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/events?id=in.(${eventIds})&select=*`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${parsedSession.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!eventsResponse.ok) {
        setWishlist([]);
        return;
      }

      const eventsData = await eventsResponse.json();
      const eventsMap = new Map((eventsData || []).map((e: any) => [e.id, e]));

      const transformedData = wishlistData.map((item: any) => ({
        id: item.id,
        event_id: item.event_id,
        event: eventsMap.get(item.event_id),
      })).filter((item: any) => item.event);

      setWishlist(transformedData);
    } catch (error) {
      setWishlist([]);
    }
  };

  const toggleWishlist = async (event: Event) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add events to wishlist');
      return;
    }

    try {
      const isInWishlist = wishlist.some(item => item.event_id === event.id);
      
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'sznagdhpnjexuuydnimh';
      const storageKey = `sb-${projectRef}-auth-token`;
      const storedSession = await AsyncStorage.getItem(storageKey);
      
      if (!storedSession) {
        Alert.alert('Error', 'Please login again');
        return;
      }

      const parsedSession = JSON.parse(storedSession);
      if (!parsedSession?.access_token) {
        Alert.alert('Error', 'Invalid session. Please login again.');
        return;
      }

      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://sznagdhpnjexuuydnimh.supabase.co';
      const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6bmFnZGhwbmpleHV1eWRuaW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzg4NjEsImV4cCI6MjA3MDE1NDg2MX0.TS8kgZjDjGhNSutksFEwJf7kslrqUddaChEbzdNqpl4';

      if (isInWishlist) {
        const wishlistItem = wishlist.find(item => item.event_id === event.id);
        if (wishlistItem) {
          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/wishlist?id=eq.${wishlistItem.id}&user_id=eq.${user.id}`,
            {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${parsedSession.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            setWishlist(wishlist.filter(item => item.id !== wishlistItem.id));
            Alert.alert('Success', 'Removed from wishlist');
          }
        }
      } else {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/wishlist`,
          {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${parsedSession.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              event_id: event.id
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setWishlist([...wishlist, { id: data[0].id, event_id: event.id, event }]);
          Alert.alert('Success', 'Added to wishlist');
        } else {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 409 || errorData.message?.includes('duplicate')) {
            Alert.alert('Info', 'Already in wishlist');
          } else {
            Alert.alert('Error', 'Failed to add to wishlist');
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update wishlist');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    await fetchUserBookings();
    setRefreshing(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请输入邮箱和密码');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        setShowLogin(false);
        Alert.alert('Success', 'Login successful!');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('错误', '请填写所有字段');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      if (error) throw error;

      Alert.alert('Success', 'Registration successful! Please login');
      setIsRegister(false);
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            setUser(null);
            setShowLogin(true);
            setCartItems([]);
            setUserBookings([]);
            setCurrentTab('home');
          }
        }
      ]
    );
  };

  const addToCart = (event: Event) => {
    const existingItem = cartItems.find(item => item.event.id === event.id);
    if (existingItem) {
      Alert.alert('Info', 'This event is already in your cart');
      return;
    }
    setCartItems([...cartItems, { event, quantity: 1 }]);
    Alert.alert('Success', 'Added to cart');
  };

  const removeFromCart = (eventId: string) => {
    setCartItems(cartItems.filter(item => item.event.id !== eventId));
  };

  const updateCartQuantity = (eventId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(eventId);
      return;
    }
    setCartItems(cartItems.map(item =>
      item.event.id === eventId ? { ...item, quantity } : item
    ));
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Error', 'Cart is empty');
      return;
    }

    const total = cartItems.reduce((sum, item) => sum + (item.event.price * item.quantity), 0);
    
    if (total === 0) {
      // Free event, create booking directly
    setLoading(true);
    try {
      const bookings = cartItems.map(item => ({
        user_id: user.id,
        event_id: item.event.id,
        status: 'confirmed',
        attendee_name: user.user_metadata?.full_name || user.email,
        attendee_email: user.email,
      }));

      const { error } = await supabase
        .from('bookings')
        .insert(bookings);

      if (error) throw error;

        Alert.alert('Success', 'Booking successful!');
      setCartItems([]);
      setCurrentTab('bookings');
      await fetchUserBookings();
    } catch (error: any) {
        Alert.alert('Booking Failed', error.message);
      }
      setLoading(false);
    } else {
      // Paid event, show PayPal payment
      const itemName = cartItems.length === 1 
        ? cartItems[0].event.title 
        : `${cartItems.length} Event Tickets`;
      
      // Create PayPal payment URL
      const clientId = 'AViTyFGmZK1VRStNTrZBZUUC8vK2P3S03f1lpmzRX6xetFD1WAhoHoVyHhoLDSV30v7Dd3Mc4Pm22wSu';
      const returnUrl = encodeURIComponent('jomevent://paypal-success');
      const cancelUrl = encodeURIComponent('jomevent://paypal-cancel');
      
      // For mobile, we'll use a simple PayPal checkout URL
      // In production, you should use PayPal REST API to create orders
      const url = `https://www.paypal.com/checkoutnow?client-id=${clientId}&amount=${total}&currency=MYR&item-name=${encodeURIComponent(itemName)}`;
      
      setPaypalUrl(url);
      setShowPayPalModal(true);
    }
  };

  const handlePayPalSuccess = async (paymentId: string) => {
    setShowPayPalModal(false);
    setLoading(true);
    
    try {
      const bookings = cartItems.map(item => ({
        user_id: user.id,
        event_id: item.event.id,
        status: 'confirmed',
        attendee_name: user.user_metadata?.full_name || user.email,
        attendee_email: user.email,
        payment_id: paymentId,
        payment_method: 'paypal'
      }));

      const { error } = await supabase
        .from('bookings')
        .insert(bookings);

      if (error) throw error;

      Alert.alert('Success', 'Payment successful! Booking confirmed.');
      setCartItems([]);
      setCurrentTab('bookings');
      await fetchUserBookings();
    } catch (error: any) {
      Alert.alert('Booking Failed', error.message);
    }
    setLoading(false);
  };

  const getFilteredEvents = () => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  const getPaginatedEvents = () => {
    const filtered = getFilteredEvents();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      events: filtered.slice(startIndex, endIndex),
      totalPages,
      totalEvents: filtered.length
    };
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter]);

  const theme = {
    primary: '#E4281F',
    secondary: '#FFBE54',
    accent: '#FCEEC9',
    background: '#FFFFFF',
    white: '#ffffff',
    text: '#333333',
    gray: '#666666',
    lightGray: '#e0e0e0',
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.text, { marginTop: 10 }]}>Loading...</Text>
      </View>
    );
  }

  const renderLoginModal = () => (
    <Modal
      visible={showLogin}
      animationType="slide"
      onRequestClose={() => setShowLogin(false)}
    >
      <View style={[styles.container, { backgroundColor: theme.accent }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowLogin(false)}>
            <Text style={styles.backButton}>✕ Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {isRegister ? 'Sign Up' : 'Login'}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={styles.loginContainer}>
          <View style={styles.loginForm}>
            {isRegister && (
              <>
                <Text style={styles.label}>姓名</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="输入您的姓名"
                />
              </>
            )}

            <Text style={styles.label}>邮箱</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="输入邮箱"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>密码</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="输入密码"
              secureTextEntry
            />

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegister ? '注册' : 'Login'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setIsRegister(!isRegister)}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isRegister ? '已有账号？点击Login' : '没有账号？点击注册'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  if (false) {
    return (
      <View style={[styles.container, { backgroundColor: theme.white }]}>
        <ScrollView contentContainerStyle={styles.loginContainer}>
          <View style={styles.loginHeader}>
            <Text style={styles.appTitle}>🎫 Event Booking</Text>
            <Text style={styles.appSubtitle}>EventBooking系统</Text>
          </View>

          <View style={styles.loginForm}>
            <Text style={styles.loginTitle}>
              {isRegister ? '注册账号' : 'Login'}
            </Text>

            {isRegister && (
              <>
                <Text style={styles.label}>姓名</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="输入您的姓名"
                />
              </>
            )}

            <Text style={styles.label}>邮箱</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="输入邮箱"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>密码</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="输入密码"
              secureTextEntry
            />

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.primary }]}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>
                  {isRegister ? '注册' : 'Login'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setIsRegister(!isRegister)}
              style={styles.switchButton}
            >
              <Text style={styles.switchText}>
                {isRegister ? '已有账号？点击Login' : '没有账号？点击注册'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const renderEventDetail = () => (
    <Modal
      visible={showEventDetail}
      animationType="slide"
      onRequestClose={() => setShowEventDetail(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowEventDetail(false)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Event Details</Text>
          <View style={{ width: 50 }} />
        </View>

        {selectedEvent && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>{selectedEvent.title}</Text>
              
              {selectedEvent.image_url && (
                <Image
                  source={{ uri: selectedEvent.image_url }}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📅 Date</Text>
                <Text style={styles.detailValue}>{selectedEvent.date}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>🕐 Time</Text>
                <Text style={styles.detailValue}>{selectedEvent.time}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📍 Location</Text>
                <Text style={styles.detailValue}>{selectedEvent.location}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>💰 Price</Text>
                <Text style={[styles.detailValue, { color: theme.primary, fontWeight: 'bold' }]}>
                  RM {selectedEvent.price}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>👥 Capacity</Text>
                <Text style={styles.detailValue}>{selectedEvent.capacity} people</Text>
              </View>

              <View style={styles.separator} />

              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{selectedEvent.description}</Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.addToCartButton]}
                  onPress={() => {
                    addToCart(selectedEvent);
                    setShowEventDetail(false);
                  }}
                >
                  <Text style={styles.buttonText}>🛒 Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const renderBookingDetail = () => {
    if (!selectedBooking || !selectedBooking.event) return null;

    return (
      <Modal
        visible={showBookingDetail}
        animationType="slide"
        onRequestClose={() => setShowBookingDetail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowBookingDetail(false)}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Booking Details</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.detailCard}>
              <View style={styles.bookingDetailHeader}>
                <Text style={styles.bookingDetailStatus}>{selectedBooking.status.toUpperCase()}</Text>
                <Text style={styles.bookingDetailDate}>
                  Booked on {new Date(selectedBooking.created_at).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>

              {selectedBooking.event.image_url && (
                <Image
                  source={{ uri: selectedBooking.event.image_url }}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
              )}

              <Text style={styles.detailTitle}>{selectedBooking.event.title}</Text>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📅 Date</Text>
                <Text style={styles.detailValue}>{selectedBooking.event.date}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>🕐 Time</Text>
                <Text style={styles.detailValue}>{selectedBooking.event.time}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>📍 Location</Text>
                <Text style={styles.detailValue}>{selectedBooking.event.location}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>💰 Price</Text>
                <Text style={[styles.detailValue, { color: theme.primary, fontWeight: 'bold' }]}>
                  RM {selectedBooking.event.price}
                </Text>
              </View>

              {selectedBooking.attendee_name && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>👤 Attendee</Text>
                  <Text style={styles.detailValue}>{selectedBooking.attendee_name}</Text>
                </View>
              )}

              {selectedBooking.attendee_email && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>📧 Email</Text>
                  <Text style={styles.detailValue}>{selectedBooking.attendee_email}</Text>
                </View>
              )}

              <View style={styles.separator} />

              <Text style={styles.sectionTitle}>Booking QR Code</Text>
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={JSON.stringify({
                    bookingId: selectedBooking.id,
                    eventId: selectedBooking.event.id,
                    userId: selectedBooking.user_id,
                    status: selectedBooking.status
                  })}
                  size={200}
                  color="#000000"
                  backgroundColor="#FFFFFF"
                />
                <Text style={styles.qrCodeHint}>Show this at the event entrance</Text>
              </View>

              <View style={styles.separator} />

              <Text style={styles.sectionTitle}>Event Description</Text>
              <Text style={styles.description}>{selectedBooking.event.description}</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderPayPalModal = () => (
    <Modal
      visible={showPayPalModal}
      animationType="slide"
      onRequestClose={() => {
        setShowPayPalModal(false);
        Alert.alert('Payment Cancelled', 'Payment was cancelled');
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowPayPalModal(false)}>
            <Text style={styles.backButton}>← Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>PayPal Payment</Text>
          <View style={{ width: 50 }} />
        </View>
        <WebView
          source={{ uri: paypalUrl }}
          onNavigationStateChange={(navState) => {
            if (navState.url.includes('success') || navState.url.includes('approve')) {
              const urlParams = new URLSearchParams(navState.url.split('?')[1] || '');
              const paymentId = urlParams.get('paymentId') || urlParams.get('token') || 'paypal-' + Date.now();
              handlePayPalSuccess(paymentId);
            } else if (navState.url.includes('cancel')) {
              setShowPayPalModal(false);
              Alert.alert('Payment Cancelled', 'Payment was cancelled');
            }
          }}
          style={styles.webView}
        />
      </View>
    </Modal>
  );

  // 主页（与 Web 版本的 Hero Banner 相似，使用3色配色）
  // Get latest events (5 furthest future dates)
  const getLatestEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => new Date(event.date) >= today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const renderHome = () => {
    const latestEvents = getLatestEvents();

    return (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
      }
    >
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: 'https://sznagdhpnjexuuydnimh.supabase.co/storage/v1/object/public/images/fypBanner.png' }}
            style={styles.heroBackground}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.heroTitleContainer}>
                <Text style={styles.heroTitle}>
                  Discover Your Next
        </Text>
                <View style={styles.heroTitleHighlightContainer}>
                  <Text style={styles.heroTitleHighlight}>Experience</Text>
                  <View style={styles.heroTitleUnderline} />
                </View>
              </View>
              <Text style={styles.heroSubtitle}>
                Yoga, Talks, Workshops & More – All in One Place
              </Text>
              <TouchableOpacity 
                style={styles.heroButton}
                onPress={() => setCurrentTab('events')}
              >
                <Text style={styles.heroButtonText}>Explore Events</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {user ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Welcome back, {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}!
            </Text>
          </View>
        ) : (
          <View style={styles.authButtonsContainer}>
          <TouchableOpacity 
              style={styles.authButton}
            onPress={() => setShowLogin(true)}
          >
              <Text style={styles.authButtonText}>Login</Text>
          </TouchableOpacity>
        <TouchableOpacity 
              style={[styles.authButton, styles.registerButton]}
              onPress={() => {
                setIsRegister(true);
                setShowLogin(true);
              }}
            >
              <Text style={[styles.authButtonText, styles.registerButtonText]}>Register</Text>
        </TouchableOpacity>
      </View>
        )}

      <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>🔥 Latest Events</Text>
            {latestEvents.length > 2 && (
              <Text style={styles.swipeHint}>← Swipe to see more →</Text>
            )}
          </View>
          {latestEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Events Available</Text>
              <Text style={styles.emptyText}>Loading event data...</Text>
          </View>
        ) : (
            <FlatList
              data={latestEvents}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.latestEventsContainer}
              renderItem={({ item }) => (
            <TouchableOpacity
                  style={[styles.latestEventCard, { width: EVENT_CARD_WIDTH }]}
              onPress={() => {
                    setSelectedEvent(item);
                setShowEventDetail(true);
              }}
            >
                  <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/300x200?text=Event' }}
                    style={styles.latestEventImage}
                    resizeMode="cover"
                  />
                  <View style={styles.latestEventContent}>
                    <Text style={styles.latestEventTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.latestEventDate}>📅 {item.date}</Text>
                    <Text style={styles.latestEventLocation} numberOfLines={1}>📍 {item.location}</Text>
                    <Text style={[styles.latestEventPrice, { color: theme.primary }]}>RM {item.price}</Text>
                  </View>
            </TouchableOpacity>
              )}
            />
        )}
      </View>

        <View style={styles.testimonialsSection}>
          <Text style={styles.testimonialsLabel}>WHAT OUR USERS SAY</Text>
          <Text style={styles.testimonialsTitle}>Join the community of satisfied event-goers!</Text>
          <View style={styles.testimonialsGrid}>
            <View style={styles.testimonialCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' }}
                style={styles.testimonialAvatar}
              />
              <Text style={styles.testimonialName}>Brandon Vega</Text>
              <Text style={styles.testimonialRole}>Tokyo Art Collective</Text>
              <Text style={styles.testimonialText}>
                JomEvent transformed the way we manage our events. The ease of posting and the smooth registration process has made our gatherings more organized and enjoyable for everyone involved.
              </Text>
            </View>
            <View style={styles.testimonialCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' }}
                style={styles.testimonialAvatar}
              />
              <Text style={styles.testimonialName}>Chris Wei</Text>
              <Text style={styles.testimonialRole}>Tokyo Tech Forum</Text>
              <Text style={styles.testimonialText}>
                As an attendee, I appreciate how JomEvent simplifies my experience. I can quickly find classes that interest me and register with just a few clicks, making event participation a breeze.
              </Text>
            </View>
            <View style={styles.testimonialCard}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' }}
                style={styles.testimonialAvatar}
              />
              <Text style={styles.testimonialName}>Karen Weiss</Text>
              <Text style={styles.testimonialRole}>Tokyo Startup Hub</Text>
              <Text style={styles.testimonialText}>
                JomEvent's platform has streamlined our event planning process. The ability to generate QR codes for entry has significantly reduced check-in times and improved overall efficiency.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>We're here to help you succeed!</Text>
          <View style={styles.contactInfo}>
            <TouchableOpacity style={styles.contactItem}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </Svg>
              <Text style={styles.contactText}>contactus@jomevent.com.my</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </Svg>
              <Text style={styles.contactText}>+603-8160 4033</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <Path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </Svg>
              <Text style={styles.contactText} numberOfLines={2}>28, Jln TPP 5, Taman Perindustrian Putra, 47130 Puchong, Selangor, Malaysia</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.footerBrand}>
              <Text style={styles.footerBrandText}>JomEvent!</Text>
              <Text style={styles.footerDescription}>
                Your one-stop platform for discovering and organizing amazing events.
              </Text>
            </View>
            <View style={styles.footerLinks}>
              <Text style={styles.footerLinkTitle}>Quick Links</Text>
              <TouchableOpacity onPress={() => setCurrentTab('home')}>
                <Text style={styles.footerLink}>Browse Events</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCurrentTab('bookings')}>
                <Text style={styles.footerLink}>My Bookings</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.footerSocial}>
              <Text style={styles.footerLinkTitle}>Connect With Us</Text>
              <View style={styles.socialIcons}>
                <TouchableOpacity style={[styles.socialIcon, { marginRight: 12 }]}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
                    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialIcon, { marginRight: 12 }]}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
                    <Path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialIcon}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="white">
                    <Path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0z" />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.footerBottom}>
            <Text style={styles.footerCopyright}>© 2025 JomEvent! All rights reserved.</Text>
          </View>
        </View>
    </ScrollView>
  );
  };

  const renderEvents = () => {
    const { events: paginatedEvents, totalPages, totalEvents } = getPaginatedEvents();

    return (
    <View style={styles.content}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
            placeholder="Search events..."
        />
      </View>

        {totalEvents > 0 && totalPages > 1 && (
          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>
              Page {currentPage} of {totalPages} ({totalEvents} events)
            </Text>
          </View>
        )}

      <ScrollView 
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
        }
      >
          {paginatedEvents.map(event => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventCard}
            onPress={() => {
              setSelectedEvent(event);
              setShowEventDetail(true);
            }}
          >
              {event.image_url && (
                <Image
                  source={{ uri: event.image_url }}
                  style={styles.eventImage}
                  resizeMode="cover"
                />
              )}
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventInfo}>📅 {event.date} {event.time}</Text>
            <Text style={styles.eventInfo}>📍 {event.location}</Text>
            <View style={styles.eventFooter}>
              <Text style={styles.eventPrice}>RM {event.price}</Text>
                <View style={styles.eventActions}>
                  {user && (
                    <TouchableOpacity 
                      style={styles.wishlistButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleWishlist(event);
                      }}
                    >
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill={wishlist.some(item => item.event_id === event.id) ? '#E4281F' : 'none'} stroke={wishlist.some(item => item.event_id === event.id) ? '#E4281F' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
                      </Svg>
                    </TouchableOpacity>
                  )}
              <TouchableOpacity 
                style={styles.addButton}
                onPress={(e) => {
                  e.stopPropagation();
                  addToCart(event);
                }}
              >
                    <Text style={styles.addButtonText}>+ Cart</Text>
              </TouchableOpacity>
                </View>
            </View>
          </TouchableOpacity>
        ))}
          {paginatedEvents.length === 0 && (
          <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Events Available</Text>
          </View>
        )}
      </ScrollView>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={[
                styles.paginationButton,
                currentPage === 1 && styles.paginationButtonDisabled
              ]}
            >
              <Text style={[
                styles.paginationButtonText,
                currentPage === 1 && styles.paginationButtonTextDisabled
              ]}>
                Previous
              </Text>
            </TouchableOpacity>

            <View style={styles.paginationPages}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <TouchableOpacity
                    key={page}
                    onPress={() => setCurrentPage(page)}
                    style={[
                      styles.paginationPageButton,
                      currentPage === page && styles.paginationPageButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.paginationPageText,
                      currentPage === page && styles.paginationPageTextActive
                    ]}>
                      {page}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={[
                styles.paginationButton,
                currentPage === totalPages && styles.paginationButtonDisabled
              ]}
            >
              <Text style={[
                styles.paginationButtonText,
                currentPage === totalPages && styles.paginationButtonTextDisabled
              ]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        )}
    </View>
  );
  };

  const renderCart = () => {
    const total = cartItems.reduce((sum, item) => sum + (item.event.price * item.quantity), 0);

    return (
      <View style={styles.content}>
        <ScrollView style={styles.scrollContent}>
          {cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Cart is empty</Text>
              <TouchableOpacity 
                style={[styles.button, { marginTop: 20 }]}
                onPress={() => setCurrentTab('events')}
              >
                <Text style={styles.buttonText}>Browse Events</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {cartItems.map(item => (
                <View key={item.event.id} style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemTitle}>{item.event.title}</Text>
                    <Text style={styles.cartItemPrice}>RM {item.event.price}</Text>
                  </View>
                  <View style={styles.cartItemActions}>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity 
                        onPress={() => updateCartQuantity(item.event.id, item.quantity - 1)}
                        style={styles.quantityButton}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity 
                        onPress={() => updateCartQuantity(item.event.id, item.quantity + 1)}
                        style={styles.quantityButton}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity 
                      onPress={() => removeFromCart(item.event.id)}
                      style={styles.removeButton}
                    >
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              <View style={styles.cartTotal}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>RM {total.toFixed(2)}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.button, styles.checkoutButton]}
                onPress={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Checkout</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderBookings = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filteredBookings = userBookings.filter(booking => {
      if (!booking.event) return false;
      const eventDate = new Date(booking.event.date);
      eventDate.setHours(0, 0, 0, 0);

      switch (bookingFilter) {
        case 'upcoming':
          return booking.status !== 'cancelled' && eventDate >= today;
        case 'past':
          return eventDate < today;
        case 'all':
        default:
          return booking.status !== 'cancelled';
      }
    });

    const allCount = userBookings.filter(b => b.status !== 'cancelled').length;

    const upcomingCount = userBookings.filter(b => {
      if (!b.event) return false;
      const eventDate = new Date(b.event.date);
      eventDate.setHours(0, 0, 0, 0);
      return b.status !== 'cancelled' && eventDate >= today;
    }).length;

    const pastCount = userBookings.filter(b => {
      if (!b.event) return false;
      const eventDate = new Date(b.event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate < today;
    }).length;

    return (
    <View style={styles.content}>
        <View style={styles.bookingFilters}>
          <TouchableOpacity
            style={[styles.bookingFilterTab, bookingFilter === 'all' && styles.bookingFilterTabActive]}
            onPress={() => setBookingFilter('all')}
          >
            <Text style={[styles.bookingFilterText, bookingFilter === 'all' && styles.bookingFilterTextActive]}>
              All
            </Text>
            {allCount > 0 && (
              <View style={[styles.bookingFilterBadge, bookingFilter === 'all' && styles.bookingFilterBadgeActive]}>
                <Text style={[styles.bookingFilterBadgeText, bookingFilter === 'all' && styles.bookingFilterBadgeTextActive]}>
                  {allCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bookingFilterTab, bookingFilter === 'upcoming' && styles.bookingFilterTabActive]}
            onPress={() => setBookingFilter('upcoming')}
          >
            <Text style={[styles.bookingFilterText, bookingFilter === 'upcoming' && styles.bookingFilterTextActive]}>
              Upcoming
            </Text>
            {upcomingCount > 0 && (
              <View style={[styles.bookingFilterBadge, bookingFilter === 'upcoming' && styles.bookingFilterBadgeActive]}>
                <Text style={[styles.bookingFilterBadgeText, bookingFilter === 'upcoming' && styles.bookingFilterBadgeTextActive]}>
                  {upcomingCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bookingFilterTab, bookingFilter === 'past' && styles.bookingFilterTabActive]}
            onPress={() => setBookingFilter('past')}
          >
            <Text style={[styles.bookingFilterText, bookingFilter === 'past' && styles.bookingFilterTextActive]}>
              Past
            </Text>
            {pastCount > 0 && (
              <View style={[styles.bookingFilterBadge, bookingFilter === 'past' && styles.bookingFilterBadgeActive]}>
                <Text style={[styles.bookingFilterBadgeText, bookingFilter === 'past' && styles.bookingFilterBadgeTextActive]}>
                  {pastCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

      <ScrollView 
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
        }
      >
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Bookings</Text>
            </View>
          ) : (
            filteredBookings.map(booking => (
              <View key={booking.id} style={styles.bookingCard}>
                <View style={styles.bookingStatusBar}>
                  <View style={styles.bookingStatusIndicator}>
                    <View style={[styles.bookingStatusDot, { backgroundColor: booking.status === 'confirmed' ? '#4CAF50' : '#999' }]} />
                    <Text style={styles.bookingStatusText}>{booking.status.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.bookingDateText}>
                    Booked on {new Date(booking.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </Text>
                </View>

                {booking.event && (
                  <>
                    {booking.event.image_url && (
                      <Image
                        source={{ uri: booking.event.image_url }}
                        style={styles.bookingEventImage}
                        resizeMode="cover"
                      />
                    )}
                    <Text style={styles.bookingEventTitle}>{booking.event.title}</Text>
                    
                    <View style={styles.bookingDetails}>
                      <View style={styles.bookingDetailRow}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M8 2v4" />
                          <Path d="M16 2v4" />
                          <Rect width="18" height="18" x="3" y="4" rx="2" />
                          <Path d="M3 10h18" />
                        </Svg>
                        <Text style={styles.bookingDetailText}>{booking.event.date} {booking.event.time}</Text>
                      </View>
                      <View style={styles.bookingDetailRow}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <Path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </Svg>
                        <Text style={styles.bookingDetailText}>{booking.event.location}</Text>
                      </View>
                      <View style={styles.bookingDetailRow}>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                          <Path d="M13 5v2" />
                          <Path d="M13 17v2" />
                          <Path d="M13 11v2" />
                        </Svg>
                        <Text style={styles.bookingDetailText}>1 Ticket • RM {booking.event.price}</Text>
                      </View>
                    </View>

                    <View style={styles.bookingActions}>
                      <TouchableOpacity
                        style={[styles.bookingActionButton, styles.qrCodeButton]}
                        onPress={() => {
                          setSelectedBooking(booking);
                          setShowBookingDetail(true);
                        }}
                      >
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Rect width="5" height="5" x="3" y="3" rx="1" />
                          <Rect width="5" height="5" x="16" y="3" rx="1" />
                          <Rect width="5" height="5" x="3" y="16" rx="1" />
                          <Path d="M21 16h-3" />
                          <Path d="M21 21h-3" />
                          <Path d="M12 7v3" />
                          <Path d="M7 12h3" />
                          <Path d="M12 12h.01" />
                          <Path d="M16 12h.01" />
                          <Path d="M12 16h.01" />
                          <Path d="M16 16h.01" />
                          <Path d="M21 12h.01" />
                        </Svg>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.bookingActionButton, styles.downloadButton]}
                        onPress={() => handleDownloadBooking(booking)}
                      >
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <Polyline points="7 10 12 15 17 10" />
                          <Path d="M12 15V3" />
                        </Svg>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.bookingActionButton, styles.shareButton]}
                        onPress={() => handleShareBooking(booking)}
                      >
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <Circle cx="18" cy="5" r="3" />
                          <Circle cx="6" cy="12" r="3" />
                          <Circle cx="18" cy="19" r="3" />
                          <Path d="m8.59 13.51 6.83 3.98" />
                          <Path d="m15.41 6.51-6.82 3.98" />
                        </Svg>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  const renderProfile = () => {
    const renderProfileContent = () => {
      if (profileTab === 'wishlist') {
        return (
          <View style={styles.profileTabContent}>
            <Text style={styles.profileTabTitle}>My Wishlist</Text>
            {wishlist.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No items in wishlist</Text>
              </View>
            ) : (
              wishlist.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.wishlistCard}
                  onPress={() => {
                    setSelectedEvent(item.event);
                    setShowEventDetail(true);
                  }}
                >
                  {item.event.image_url && (
                    <Image
                      source={{ uri: item.event.image_url }}
                      style={styles.wishlistImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.wishlistInfo}>
                    <Text style={styles.wishlistTitle}>{item.event.title}</Text>
                    <Text style={styles.wishlistDate}>📅 {item.event.date}</Text>
                    <Text style={styles.wishlistPrice}>RM {item.event.price}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.wishlistRemoveButton}
                    onPress={() => toggleWishlist(item.event)}
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="#E4281F" stroke="#E4281F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
                    </Svg>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        );
      }

      if (profileTab === 'reviews') {
        return (
          <View style={styles.profileTabContent}>
            <Text style={styles.profileTabTitle}>My Reviews</Text>
            {reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No reviews yet</Text>
              </View>
            ) : (
              reviews.map((review: any, index: number) => (
                <View key={index} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewEventTitle}>{review.eventTitle || 'Event'}</Text>
                    <View style={styles.reviewRating}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Text key={i} style={styles.reviewStar}>
                          {i < review.rating ? '⭐' : '☆'}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{review.comment}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
              ))
            )}
          </View>
        );
      }

      if (profileTab === 'bookings') {
        return (
          <View style={styles.profileTabContent}>
            <Text style={styles.profileTabTitle}>My Bookings</Text>
        {userBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No Bookings</Text>
          </View>
        ) : (
          userBookings.map(booking => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => {
                    setSelectedBooking(booking);
                    setShowBookingDetail(true);
                  }}
                >
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingStatus}>{booking.status}</Text>
                <Text style={styles.bookingDate}>
                      {new Date(booking.created_at).toLocaleDateString('en-GB')}
                </Text>
              </View>
              {booking.event && (
                <>
                  <Text style={styles.bookingEventTitle}>{booking.event.title}</Text>
                  <Text style={styles.bookingInfo}>📅 {booking.event.date} {booking.event.time}</Text>
                  <Text style={styles.bookingInfo}>📍 {booking.event.location}</Text>
                  <Text style={styles.bookingPrice}>RM {booking.event.price}</Text>
                </>
              )}
                </TouchableOpacity>
          ))
        )}
    </View>
  );
      }

      return (
        <View style={styles.profileTabContent}>
          <Text style={styles.profileTabTitle}>Personal Info</Text>
          <View style={styles.profileInfoCard}>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Name:</Text>
              <Text style={styles.profileInfoValue}>{user?.user_metadata?.full_name || 'User'}</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Email:</Text>
              <Text style={styles.profileInfoValue}>{user?.email || 'N/A'}</Text>
            </View>
          </View>
        </View>
      );
    };

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeaderRed}>
          <Text style={styles.profileHeaderTitle}>My Profile</Text>
          <TouchableOpacity>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 20h9" />
              <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </Svg>
          </TouchableOpacity>
        </View>

      <View style={styles.profileUserCard}>
        <View style={styles.profileUserInfo}>
          <View style={styles.profileAvatarContainer}>
            <View style={styles.profileAvatarSquare}>
              <Text style={styles.profileAvatarText}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
            <TouchableOpacity style={styles.profileEditIcon}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 20h9" />
                <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </Svg>
            </TouchableOpacity>
          </View>
          <View style={styles.profileUserDetails}>
            <Text style={styles.profileUserName}>
              {user?.user_metadata?.full_name || 'User'}
          </Text>
            <Text style={styles.profileUserEmail}>{user?.email}</Text>
          </View>
        </View>
        <View style={styles.profileStatsCards}>
          <View style={styles.profileStatCardYellow}>
            <Text style={styles.profileStatCardNumber}>{userBookings.length}</Text>
            <View style={styles.profileStatCardIcon}>
              <BookingIcon color="#666" size={16} />
            </View>
            <Text style={styles.profileStatCardLabel}>Bookings</Text>
          </View>
          <View style={styles.profileStatCardRed}>
            <Text style={styles.profileStatCardNumberRed}>{cartItems.length}</Text>
            <View style={styles.profileStatCardIcon}>
              <CartIcon color="#666" size={16} />
            </View>
            <Text style={styles.profileStatCardLabel}>Cart Items</Text>
          </View>
        </View>
        </View>

      <View style={styles.profileTabs}>
        <TouchableOpacity
          style={[styles.profileTab, profileTab === 'info' && styles.profileTabActive]}
          onPress={() => setProfileTab('info')}
        >
          <Text style={[styles.profileTabText, profileTab === 'info' && styles.profileTabTextActive]}>Info</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.profileTab, profileTab === 'bookings' && styles.profileTabActive]}
          onPress={() => setProfileTab('bookings')}
        >
          <Text style={[styles.profileTabText, profileTab === 'bookings' && styles.profileTabTextActive]}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.profileTab, profileTab === 'reviews' && styles.profileTabActive]}
          onPress={() => setProfileTab('reviews')}
        >
          <Text style={[styles.profileTabText, profileTab === 'reviews' && styles.profileTabTextActive]}>Reviews</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.profileTab, profileTab === 'wishlist' && styles.profileTabActive]}
          onPress={() => setProfileTab('wishlist')}
        >
          <Text style={[styles.profileTabText, profileTab === 'wishlist' && styles.profileTabTextActive]}>Wishlist</Text>
        </TouchableOpacity>
          </View>

      {renderProfileContent()}

      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Settings & More</Text>
        <View style={styles.profileSettingsList}>
          <TouchableOpacity style={styles.profileSettingItem}>
            <View style={styles.profileSettingIconBlue}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M12 20h9" />
                <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </Svg>
          </View>
            <Text style={styles.profileSettingText}>Account Settings</Text>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="m9 18 6-6-6-6" />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileSettingItem}>
            <View style={styles.profileSettingIconPurple}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#9333EA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </Svg>
            </View>
            <Text style={styles.profileSettingText}>Notifications</Text>
            <View style={styles.profileNotificationBadge}>
              <Text style={styles.profileNotificationBadgeText}>3</Text>
            </View>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="m9 18 6-6-6-6" />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileSettingItem}>
            <View style={styles.profileSettingIconRed}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#E4281F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
              </Svg>
            </View>
            <Text style={styles.profileSettingText}>Favorite Events</Text>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="m9 18 6-6-6-6" />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileSettingItem}>
            <View style={styles.profileSettingIconGreen}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <Path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <Path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </Svg>
            </View>
            <Text style={styles.profileSettingText}>Payment Methods</Text>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="m9 18 6-6-6-6" />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity style={styles.profileSettingItem}>
            <View style={styles.profileSettingIconOrange}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx="12" cy="12" r="10" />
                <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <Path d="M12 17h.01" />
              </Svg>
            </View>
            <Text style={styles.profileSettingText}>Help & Support</Text>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <Path d="m9 18 6-6-6-6" />
            </Svg>
          </TouchableOpacity>
        </View>
        </View>

        <TouchableOpacity 
        style={styles.profileLogoutButton}
          onPress={handleLogout}
        >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <Polyline points="16 17 21 12 16 7" />
          <Path d="M21 12H9" />
        </Svg>
        <Text style={[styles.profileLogoutText, { marginLeft: 8 }]}>Logout</Text>
        </TouchableOpacity>

      <Text style={styles.profileVersion}>JomEvent v1.0.0</Text>
    </ScrollView>
  );
  };

  return (
    <View style={styles.container}>
      {currentTab !== 'profile' && (
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerTitle}>
            {currentTab === 'home' && 'Home'}
            {currentTab === 'events' && 'Events'}
            {currentTab === 'cart' && 'Cart'}
            {currentTab === 'bookings' && 'My Bookings'}
        </Text>
      </View>
      )}

      {currentTab === 'home' && renderHome()}
      {currentTab === 'events' && renderEvents()}
      {currentTab === 'cart' && renderCart()}
      {currentTab === 'bookings' && renderBookings()}
      {currentTab === 'profile' && renderProfile()}

      {renderEventDetail()}
      {renderBookingDetail()}
      {renderLoginModal()}
      {renderPayPalModal()}

      <View style={[styles.tabBar, { backgroundColor: theme.white }]}>
        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setCurrentTab('home')}
        >
          <View style={styles.tabIconContainer}>
            <HomeIcon color={currentTab === 'home' ? theme.primary : '#666'} size={24} />
          </View>
          <Text style={[styles.tabLabel, currentTab === 'home' && { color: theme.primary }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setCurrentTab('events')}
        >
          <View style={styles.tabIconContainer}>
            <TicketIcon color={currentTab === 'events' ? theme.primary : '#666'} size={24} />
          </View>
          <Text style={[styles.tabLabel, currentTab === 'events' && { color: theme.primary }]}>Event</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setCurrentTab('cart')}
        >
          <View style={styles.tabIconContainer}>
            <CartIcon color={currentTab === 'cart' ? theme.primary : '#666'} size={24} />
          </View>
          <Text style={[styles.tabLabel, currentTab === 'cart' && { color: theme.primary }]}>Cart</Text>
          {cartItems.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setCurrentTab('bookings')}
        >
          <View style={styles.tabIconContainer}>
            <BookingIcon color={currentTab === 'bookings' ? theme.primary : '#666'} size={24} />
          </View>
          <Text style={[styles.tabLabel, currentTab === 'bookings' && { color: theme.primary }]}>Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem}
          onPress={() => setCurrentTab('profile')}
        >
          <View style={styles.tabIconContainer}>
            <ProfileIcon color={currentTab === 'profile' ? theme.primary : '#666'} size={24} />
          </View>
          <Text style={[styles.tabLabel, currentTab === 'profile' && { color: theme.primary }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    marginBottom: 60,
  },
  scrollContent: {
    flex: 1,
  },
  loginContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E4281F',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  loginForm: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#E4281F',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  switchText: {
    color: '#E4281F',
    fontSize: 14,
  },
  // 主页样式
  heroContainer: {
    height: 400,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 15,
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  heroContent: {
    padding: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  heroTitleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 0,
  },
  heroTitleHighlightContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: 0,
  },
  heroTitleHighlight: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
  },
  heroTitleUnderline: {
    position: 'absolute',
    bottom: 4,
    left: -10,
    right: -10,
    height: 4,
    backgroundColor: '#06B6D4',
    borderRadius: 2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
    lineHeight: 22,
  },
  heroButton: {
    backgroundColor: '#06B6D4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  heroButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  welcomeContainer: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  authButtonsContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  authButton: {
    flex: 1,
    backgroundColor: '#E4281F',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 6,
  },
  registerButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E4281F',
    marginRight: 0,
    marginLeft: 6,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButtonText: {
    color: '#E4281F',
  },
  section: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  swipeHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  latestEventsContainer: {
    paddingHorizontal: 15,
    paddingRight: 30,
  },
  latestEventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginRight: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  latestEventImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  latestEventContent: {
    padding: 10,
  },
  latestEventTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    minHeight: 36,
  },
  latestEventDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  latestEventLocation: {
    fontSize: 11,
    color: '#999',
    marginBottom: 5,
  },
  latestEventPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  eventInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  eventPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E4281F',
    marginTop: 5,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wishlistButton: {
    padding: 8,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#E4281F',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: 'white',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  paginationInfo: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  paginationText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E4281F',
  },
  paginationButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  paginationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#999',
  },
  paginationPages: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  paginationPageButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationPageButtonActive: {
    backgroundColor: '#E4281F',
  },
  paginationPageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  paginationPageTextActive: {
    color: 'white',
  },
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    backgroundColor: '#f0f0f0',
  },
  cartItemInfo: {
    flex: 1,
    marginBottom: 10,
  },
  cartItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cartItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E4281F',
  },
  cartItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E4281F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 15,
    color: '#333',
  },
  removeButton: {
    padding: 8,
  },
  removeButtonText: {
    color: '#999',
    fontSize: 14,
  },
  cartTotal: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E4281F',
  },
  checkoutButton: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  // Booking
  bookingFilters: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bookingFilterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bookingFilterTabActive: {
    backgroundColor: '#E4281F',
    borderColor: '#E4281F',
  },
  bookingFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  bookingFilterTextActive: {
    color: 'white',
  },
  bookingFilterBadge: {
    marginLeft: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  bookingFilterBadgeActive: {
    backgroundColor: 'white',
  },
  bookingFilterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  bookingFilterBadgeTextActive: {
    color: '#E4281F',
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  bookingStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bookingStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookingStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  bookingStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  bookingDateText: {
    fontSize: 12,
    color: '#666',
  },
  bookingEventImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  bookingEventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 12,
  },
  bookingDetails: {
    marginHorizontal: 15,
    marginBottom: 15,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  bookingActions: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  bookingActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    minHeight: 48,
  },
  qrCodeButton: {
    backgroundColor: '#FFF5F0',
  },
  downloadButton: {
    backgroundColor: '#EFF6FF',
  },
  shareButton: {
    backgroundColor: '#F5F3FF',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bookingStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    textTransform: 'uppercase',
  },
  bookingDate: {
    fontSize: 12,
    color: '#999',
  },
  bookingInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  bookingPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E4281F',
    marginTop: 5,
  },
  viewDetailsButton: {
    backgroundColor: '#E4281F',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileContainer: {
    padding: 0,
  },
  profileHeaderRed: {
    backgroundColor: '#E4281F',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  profileUserCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profileAvatarSquare: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileEditIcon: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  profileUserDetails: {
    flex: 1,
  },
  profileUserName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileUserEmail: {
    fontSize: 14,
    color: '#666',
  },
  profileStatsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileStatCardYellow: {
    flex: 1,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginRight: 6,
  },
  profileStatCardRed: {
    flex: 1,
    backgroundColor: '#FFE6E6',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginLeft: 6,
  },
  profileStatCardNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  profileStatCardNumberRed: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E4281F',
    marginBottom: 8,
  },
  profileStatCardIcon: {
    marginBottom: 8,
  },
  profileStatCardLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  profileSection: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  profileSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  profileQuickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileQuickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileQuickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 8,
  },
  profileSettingsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileSettingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileSettingIconBlue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileSettingIconPurple: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileSettingIconRed: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE6E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileSettingIconGreen: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileSettingIconOrange: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE6D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileSettingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  profileNotificationBadge: {
    backgroundColor: '#E4281F',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  profileNotificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileLogoutButton: {
    backgroundColor: '#E4281F',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileLogoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileVersion: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  profileTabs: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  profileTabActive: {
    backgroundColor: '#E4281F',
  },
  profileTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  profileTabTextActive: {
    color: 'white',
  },
  profileTabContent: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  profileTabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  wishlistCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wishlistImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  wishlistInfo: {
    flex: 1,
  },
  wishlistTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  wishlistDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  wishlistPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E4281F',
  },
  wishlistRemoveButton: {
    padding: 8,
    justifyContent: 'center',
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewEventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewStar: {
    fontSize: 16,
    marginLeft: 2,
  },
  reviewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  profileInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  profileInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  profileInfoValue: {
    fontSize: 14,
    color: '#333',
  },
  bookingDetailHeader: {
    marginBottom: 20,
  },
  bookingDetailStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  bookingDetailDate: {
    fontSize: 14,
    color: '#666',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  qrCodeHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
  },
  testimonialsSection: {
    backgroundColor: '#FFF9E6',
    padding: 20,
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
  },
  testimonialsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  testimonialsTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  testimonialsGrid: {
    gap: 0,
  },
  testimonialCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  testimonialAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
  },
  testimonialName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  testimonialRole: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  testimonialText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  contactSection: {
    backgroundColor: 'white',
    padding: 20,
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  contactInfo: {
    gap: 0,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  footer: {
    backgroundColor: '#1F2937',
    padding: 20,
    marginTop: 20,
  },
  footerContent: {
    marginBottom: 20,
  },
  footerBrand: {
    marginBottom: 20,
  },
  footerBrandText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E4281F',
    marginBottom: 10,
  },
  footerDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  footerLinks: {
    marginBottom: 20,
  },
  footerLinkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  footerSocial: {
    marginBottom: 20,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#374151',
    paddingTop: 20,
    alignItems: 'center',
  },
  footerCopyright: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 5,
    paddingTop: 5,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    position: 'relative',
  },
  tabIconContainer: {
    marginBottom: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    color: '#666',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 20,
    backgroundColor: '#E4281F',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  // 模态框
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E4281F',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalContent: {
    flex: 1,
    padding: 15,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonRow: {
    marginTop: 10,
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
  },
  // 空状态
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});
