import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, User, CheckCircle, Phone, Video } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type TimeSlot = {
  time: string;
  available: boolean;
};

type UserData = {
  id: string;
  name: string;
  email: string;
  photo_url: string | null;
  location: string | null;
  phone: string | null;
};

type Appointment = {
  id: string;
  client_id: string;
  therapist_id: string;
  scheduled_at: string;
  duration: number;
  status: 'booked' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  meeting_link?: string;
  created_at: string;
  updated_at: string;
  client: UserData;
  therapist: UserData;
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
  users: UserData | null;
};

export default function AppointmentsScreen() {
  const { userProfile, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Don't render until we have user profile
  if (authLoading || !userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  useEffect(() => {
    if (userProfile?.id) {
      loadAppointments();
    }
  }, [userProfile]);

  const loadAppointments = async () => {
    if (!userProfile?.id) return;

    try {
      console.log('🔍 Loading appointments for user:', userProfile.id);
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:users!client_id(id, name, email, phone, photo_url),
          therapist:users!therapist_id(id, name, email, phone, photo_url)
        `)
        .order('scheduled_at', { ascending: true });

      // Filter based on user role
      if (userProfile.role === 'client') {
        query = query.eq('client_id', userProfile.id);
      } else if (userProfile.role === 'therapist') {
        query = query.eq('therapist_id', userProfile.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error loading appointments:', error);
        Alert.alert('Error', 'Failed to load appointments');
        return;
      }

      console.log('✅ Appointments loaded:', data?.length || 0);
      setAppointments(data || []);

    } catch (error) {
      console.error('💥 Error loading appointments:', error);
      Alert.alert('Error', 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'booked': return '#10B981';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      case 'no_show': return '#6B7280';
      default: return '#64748B';
    }
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const dateInfo = formatAppointmentDate(appointment.scheduled_at);
    const otherUser = userProfile.role === 'client' ? appointment.therapist : appointment.client;

    return (
      <View key={appointment.id} style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <View style={styles.appointmentDate}>
            <Text style={styles.appointmentDateText}>{dateInfo.date}</Text>
            <Text style={styles.appointmentTimeText}>{dateInfo.time}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
            <Text style={styles.statusText}>{appointment.status}</Text>
          </View>
        </View>

        <View style={styles.appointmentContent}>
          <View style={styles.userInfo}>
            <User size={20} color="#64748B" />
            <Text style={styles.userName}>{otherUser?.name || 'Unknown'}</Text>
          </View>

          <View style={styles.appointmentDetails}>
            <View style={styles.detailRow}>
              <Clock size={16} color="#64748B" />
              <Text style={styles.detailText}>{appointment.duration} minutes</Text>
            </View>
            
            {appointment.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesText}>{appointment.notes}</Text>
              </View>
            )}
          </View>

          <View style={styles.appointmentActions}>
            {appointment.meeting_link && (
              <TouchableOpacity style={styles.actionButton}>
                <Video size={16} color="#10B981" />
                <Text style={styles.actionButtonText}>Join Meeting</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionButton}>
              <Phone size={16} color="#10B981" />
              <Text style={styles.actionButtonText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color="#CBD5E1" />
            <Text style={styles.emptyStateTitle}>No appointments yet</Text>
            <Text style={styles.emptyStateText}>
              {userProfile.role === 'client' // ✅ Changed
                ? 'Book your first session with a therapist'
                : 'Your appointments will appear here'
              }
            </Text>
            {userProfile.role === 'client' && ( // ✅ Changed
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Text style={styles.searchButtonText}>Find Therapists</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          appointments.map(renderAppointmentCard)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 90, // Add padding for tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  headerButton: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  therapistCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  therapistInfo: {
    alignItems: 'center',
  },
  therapistName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  therapistCredentials: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 8,
  },
  therapistRate: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  dateScroll: {
    marginHorizontal: -20,
  },
  dateContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  dateCard: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    minWidth: 60,
  },
  selectedDateCard: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  dayText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 4,
  },
  dateNumber: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  monthText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  selectedDateText: {
    color: '#ffffff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  disabledTimeSlot: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  selectedTimeText: {
    color: '#ffffff',
  },
  disabledTimeText: {
    color: '#94a3b8',
  },
  durationContainer: {
    gap: 12,
  },
  durationOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  selectedDuration: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  durationText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    textAlign: 'center',
  },
  selectedDurationText: {
    color: '#ffffff',
  },
  notesInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    minHeight: 100,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#10B981',
  },
  bottomActions: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  bookButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
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
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  appointmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  appointmentDate: {
    flex: 1,
  },
  appointmentDateText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  appointmentTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  appointmentContent: {
    gap: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  appointmentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  notesContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  notesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#475569',
    lineHeight: 20,
  },
  appointmentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  searchButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  searchButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
