import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image, ActivityIndicator, Dimensions, useWindowDimensions, PixelRatio, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type TimeSlot = {
  time: string;
  available: boolean;
};

type TherapistData = {
  id: string;
  user_id: string;
  bio: string;
  specialties: string[];
  credentials: string;
  experience_years: number;
  hourly_rate: string;
  is_approved: boolean;
  users: {
    id: string;
    name: string;
    email: string;
    photo_url: string | null;
    location: string | null;
    phone: string | null;
  } | null;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scaleFont = (size: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Platform.OS === 'ios' ? Math.round(PixelRatio.roundToNearestPixel(newSize)) : Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

export default function BookingScreen() {
  const params = useLocalSearchParams();
  const { userProfile } = useAuth();
  const [therapist, setTherapist] = useState<TherapistData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState<number>(60);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { width: screenWidth } = useWindowDimensions();
  const [imageError, setImageError] = useState(false);

  const timeSlots: TimeSlot[] = [
    { time: '09:00', available: true },
    { time: '10:00', available: true },
    { time: '11:00', available: false },
    { time: '12:00', available: true },
    { time: '13:00', available: false },
    { time: '14:00', available: true },
    { time: '15:00', available: true },
    { time: '16:00', available: true },
    { time: '17:00', available: false },
  ];

  const durations = [
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
  ];

  useEffect(() => {
    if (params.therapist) {
      try {
        setTherapist(JSON.parse(params.therapist as string));
        setLoading(false);
      } catch (e) {
        setError('Invalid therapist data.');
        setLoading(false);
      }
    } else if (params.id) {
      loadTherapist(params.id as string);
    } else {
      setError('No therapist data provided.');
      setLoading(false);
    }
  }, [params.therapist, params.id]);

  const loadTherapist = async (id: string) => {
    try {
      console.log('🔍 Loading therapist with ID:', id);
      const { data: therapistData, error: therapistError } = await supabase
        .from('therapist_profiles')
        .select(`
          *,
          users (
            id,
            name,
            email,
            photo_url,
            location,
            phone
          )
        `)
        .eq('id', id)
        .single();
      if (therapistError) {
        console.error('❌ Therapist fetch error:', therapistError);
        setError('Therapist not found.');
        return;
      }
      setTherapist(therapistData);
    } catch (error) {
      console.error('💥 Error loading therapist:', error);
      setError('Failed to load therapist data.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select a time slot for your appointment');
      return;
    }

    if (!userProfile?.id) {
      Alert.alert('Authentication Required', 'Please sign in to book an appointment');
      return;
    }

    if (!therapist) {
      Alert.alert('Error', 'Therapist data not available');
      return;
    }

    setBooking(true);
    let appointmentDateTime: Date;
    let hours: string, minutes: string;
    let appointmentData: any, appointmentError: any;
    try {
      // If therapist was passed via params (mock/demo mode), mock the booking
      if (!therapist.users) {
        // Mock success
        Alert.alert(
          'Appointment Booked!',
          `Your session with ${(therapist as any).name} is confirmed for ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
          [
            {
              text: 'View Appointments',
              onPress: () => router.push('/(tabs)/appointments')
            },
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        // Real backend booking
        appointmentDateTime = new Date(selectedDate);
        [hours, minutes] = selectedTime.split(':');
        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        ({ data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            client_id: userProfile.id,
            therapist_id: therapist.user_id,
            scheduled_at: appointmentDateTime.toISOString(),
            duration: duration,
            status: 'booked',
            notes: notes || null,
            meeting_link: null,
          })
          .select()
          .single());

        if (appointmentError) throw appointmentError;

        Alert.alert(
          'Appointment Booked!', 
          `Your session with ${therapist.users?.name} is confirmed for ${selectedDate.toLocaleDateString()} at ${selectedTime}.`,
          [
            {
              text: 'View Appointments',
              onPress: () => router.push('/(tabs)/appointments')
            },
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      Alert.alert(
        'Booking Failed', 
        error.message || 'An error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setBooking(false);
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={[styles.loadingText, { fontSize: scaleFont(16) }]}>Loading therapist details...</Text>
      </View>
    );
  }

  if (error || !therapist) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { fontSize: scaleFont(16) }]}>{error || 'Therapist not found'}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.replace('/(tabs)/search')}
          activeOpacity={0.7}
          accessibilityLabel="Go to search"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.retryButtonText, { fontSize: scaleFont(14) }]}>Go to Search</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#14b8a6', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingHorizontal: screenWidth * 0.06 }]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7} accessibilityLabel="Go back" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: scaleFont(18) }]}>Book Session</Text>
        <View style={styles.headerButton} />
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
      >
        {/* Therapist Card */}
        <View style={[styles.therapistCard, { marginHorizontal: screenWidth * 0.04 }]}> 
          <View style={styles.therapistInfo}>
            <Image
              source={
                imageError || !therapist.users?.photo_url
                  ? require('../../assets/images/ot.png')
                  : { uri: therapist.users.photo_url }
              }
              style={styles.therapistImage}
              onError={() => setImageError(true)}
            />
            <View style={styles.therapistDetails}>
              <Text style={[styles.therapistName, { fontSize: scaleFont(18) }]}> {therapist.users?.name || 'Licensed Therapist'} </Text>
              <Text style={[styles.therapistCredentials, { fontSize: scaleFont(14) }]}>{therapist.credentials}</Text>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={16} color="#F59E0B" />
                <Text style={[styles.ratingText, { fontSize: scaleFont(13) }]}>4.9 (128 reviews)</Text>
              </View>
              {therapist.users?.location && (
                <View style={styles.locationContainer}>
                  <MaterialIcons name="location-on" size={16} color="#64748b" />
                  <Text style={[styles.locationText, { fontSize: scaleFont(13) }]}>{therapist.users.location}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.rateContainer}>
            <Text style={[styles.rateText, { fontSize: scaleFont(18) }]}>₵{therapist.hourly_rate}</Text>
            <Text style={[styles.rateLabel, { fontSize: scaleFont(12) }]}>per hour</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={[styles.section, { marginHorizontal: screenWidth * 0.04 }]}> 
          <View style={styles.sectionHeader}>
            <MaterialIcons name="calendar-today" size={20} color="#14b8a6" />
            <Text style={[styles.sectionTitle, { fontSize: scaleFont(16) }]}>Select Date</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.dateScrollContent}
          >
            {generateDateOptions().map((date, index) => {
              const dateInfo = formatDate(date);
              const isSelected = selectedDate.toDateString() === date.toDateString();
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateCard, isSelected && styles.selectedDateCard]}
                  onPress={() => setSelectedDate(date)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Select date ${dateInfo.day} ${dateInfo.month} ${dateInfo.date}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.dayText, { fontSize: scaleFont(12) }, isSelected && styles.selectedDateText]}> {dateInfo.day} </Text>
                  <Text style={[styles.dateNumber, { fontSize: scaleFont(18) }, isSelected && styles.selectedDateText]}> {dateInfo.date} </Text>
                  <Text style={[styles.monthText, { fontSize: scaleFont(12) }, isSelected && styles.selectedDateText]}> {dateInfo.month} </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={[styles.section, { marginHorizontal: screenWidth * 0.04 }]}> 
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={20} color="#14b8a6" />
            <Text style={[styles.sectionTitle, { fontSize: scaleFont(16) }]}>Select Time</Text>
          </View>
          <View style={styles.timeGrid}>
            {timeSlots.map((slot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  !slot.available && styles.disabledTimeSlot,
                  selectedTime === slot.time && styles.selectedTimeSlot
                ]}
                onPress={() => slot.available && setSelectedTime(slot.time)}
                disabled={!slot.available}
                activeOpacity={0.7}
                accessibilityLabel={slot.available ? `Select time ${slot.time}` : `Time ${slot.time} is booked`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[
                  styles.timeText,
                  { fontSize: scaleFont(14) },
                  !slot.available && styles.disabledTimeText,
                  selectedTime === slot.time && styles.selectedTimeText
                ]}>
                  {slot.time}
                </Text>
                {!slot.available && (
                  <Text style={styles.slotStatusText}>Booked</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration Selection */}
        <View style={[styles.section, { marginHorizontal: screenWidth * 0.04 }]}> 
          <View style={styles.sectionHeader}>
            <MaterialIcons name="schedule" size={20} color="#14b8a6" />
            <Text style={[styles.sectionTitle, { fontSize: scaleFont(16) }]}>Session Duration</Text>
          </View>
          <View style={styles.durationContainer}>
            {durations.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.durationOption,
                  duration === option.value && styles.selectedDuration
                ]}
                onPress={() => setDuration(option.value)}
                activeOpacity={0.7}
                accessibilityLabel={`Select duration ${option.label}`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[
                  styles.durationText,
                  { fontSize: scaleFont(14) },
                  duration === option.value && styles.selectedDurationText
                ]}>
                  {option.label}
                </Text>
                {duration === option.value && (
                  <View style={styles.durationPrice}>
                    <Text style={[styles.durationPriceText, { fontSize: scaleFont(13) }]}>₵{(parseInt(therapist.hourly_rate) * (option.value / 60)).toFixed(2)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={[styles.section, { marginHorizontal: screenWidth * 0.04 }]}> 
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person" size={20} color="#14b8a6" />
            <Text style={[styles.sectionTitle, { fontSize: scaleFont(16) }]}>Additional Notes</Text>
          </View>
          <TextInput
            style={[styles.notesInput, { fontSize: scaleFont(14), minHeight: scaleFont(120) }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Share any specific concerns or goals for this session..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            accessibilityLabel="Additional notes"
          />
        </View>

        {/* Summary */}
        <View style={[styles.summaryCard, { marginHorizontal: screenWidth * 0.04 }]}> 
          <Text style={[styles.summaryTitle, { fontSize: scaleFont(18) }]}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontSize: scaleFont(14) }]}>Therapist</Text>
            <Text style={[styles.summaryValue, { fontSize: scaleFont(14) }]}> {therapist.users?.name || 'Licensed Therapist'} </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontSize: scaleFont(14) }]}>Date</Text>
            <Text style={[styles.summaryValue, { fontSize: scaleFont(14) }]}> {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontSize: scaleFont(14) }]}>Time</Text>
            <Text style={[styles.summaryValue, { fontSize: scaleFont(14) }]}>{selectedTime || 'Not selected'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontSize: scaleFont(14) }]}>Duration</Text>
            <Text style={[styles.summaryValue, { fontSize: scaleFont(14) }]}>{duration} min</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { fontSize: scaleFont(16) }]}>Total</Text>
            <Text style={[styles.totalValue, { fontSize: scaleFont(16) }]}>₵{(parseInt(therapist.hourly_rate) * (duration / 60)).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Book Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.bookButtonFlat,
            (!selectedTime || booking) && styles.disabledButton
          ]}
          onPress={handleBookAppointment}
          disabled={!selectedTime || booking}
          activeOpacity={0.9}
          accessibilityLabel="Confirm booking"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {booking ? (
            <ActivityIndicator color="#14b8a6" />
          ) : (
            <>
              <MaterialIcons name="check-circle" size={20} color="#14b8a6" />
              <Text style={styles.bookButtonFlatText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#ef4444',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#ffffff',
  },
  headerButton: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  therapistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  therapistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  therapistImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  therapistImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  therapistDetails: {
    flex: 1,
  },
  therapistName: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
    marginBottom: 4,
  },
  therapistCredentials: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginLeft: 4,
  },
  rateContainer: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  rateText: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
  },
  rateLabel: {
    fontSize: 12,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
  },
  dateScrollContent: {
    paddingHorizontal: 4,
  },
  dateCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    minWidth: 64,
    marginHorizontal: 6,
  },
  selectedDateCard: {
    backgroundColor: '#14b8a6',
    borderColor: '#14b8a6',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
    marginBottom: 4,
  },
  monthText: {
    fontSize: 12,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  selectedDateText: {
    color: '#ffffff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    width: '30%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#14b8a6',
    borderColor: '#14b8a6',
  },
  disabledTimeSlot: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
  },
  selectedTimeText: {
    color: '#ffffff',
  },
  disabledTimeText: {
    color: '#cbd5e1',
  },
  slotStatusText: {
    fontSize: 10,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#94a3b8',
    marginTop: 4,
  },
  durationContainer: {
    gap: 10,
  },
  durationOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  selectedDuration: {
    backgroundColor: '#f0fdf4',
    borderColor: '#14b8a6',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
    textAlign: 'center',
  },
  selectedDurationText: {
    color: '#14b8a6',
  },
  durationPrice: {
    marginTop: 8,
  },
  durationPriceText: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    minHeight: 120,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.7,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#ffffff',
  },
  // Add new styles for the flat button to match search.tsx
  bookButtonFlat: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderColor: '#14b8a6',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: 0,
    gap: 10,
  },
  bookButtonFlatText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
    marginLeft: 8,
  },
});