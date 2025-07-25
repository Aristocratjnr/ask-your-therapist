import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
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

// Move these helpers to the top-level scope
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

export default function AppointmentsScreen() {
  const { userProfile, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingHorizontal: width * 0.04 }]}> {/* Responsive horizontal padding */}
      <View style={{ height: width * 0.10 }} /> {/* Add vertical space at the top */}
      <View style={[styles.header, { paddingHorizontal: width * 0.04, paddingTop: width * 0.03, paddingBottom: width * 0.03, backgroundColor: 'transparent', borderBottomWidth: 0, justifyContent: 'center', alignItems: 'center' }]}> 
        <Text style={[styles.headerTitle, { fontSize: Math.max(16, width * 0.045), textAlign: 'center' }]}>My Appointments</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: width * 0.1 }}>
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={Math.max(48, width * 0.16)} color="#CBD5E1" />
            <Text style={[styles.emptyStateTitle, { fontSize: Math.max(16, width * 0.045) }]}>No appointments yet</Text>
            <Text style={[styles.emptyStateText, { fontSize: Math.max(13, width * 0.035) }]}> 
              {userProfile.role === 'client'
                ? 'Book your first session with a therapist'
                : 'Your appointments will appear here'
              }
            </Text>
            {userProfile.role === 'client' && (
              <TouchableOpacity 
                style={[styles.searchButton, { paddingHorizontal: width * 0.08, paddingVertical: width * 0.035 }]}
                onPress={() => router.push('/(tabs)/search')}
              >
                <Text style={[styles.searchButtonText, { fontSize: Math.max(14, width * 0.04) }]}>Find Therapists</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          appointments.map((appointment) => renderAppointmentCardResponsive(appointment, width, userProfile))
        )}
      </ScrollView>
    </View>
  );
}

// Responsive version of renderAppointmentCard
function renderAppointmentCardResponsive(appointment: Appointment | undefined | null, width: number, userProfile: any) {
  if (!appointment) return null;
  const dateInfo = formatAppointmentDate(appointment.scheduled_at);
  const otherUser = userProfile.role === 'client' ? appointment.therapist : appointment.client;
  const cardPadding = Math.max(12, width * 0.04);
  const cardMargin = Math.max(10, width * 0.03);
  return (
    <View key={appointment.id} style={[styles.appointmentCard, { padding: cardPadding, marginBottom: cardMargin }]}> 
      <View style={styles.appointmentHeader}>
        <View style={styles.appointmentDate}>
          <Text style={[styles.appointmentDateText, { fontSize: Math.max(15, width * 0.04) }]}>{dateInfo.date}</Text>
          <Text style={[styles.appointmentTimeText, { fontSize: Math.max(13, width * 0.035) }]}>{dateInfo.time}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}> 
          <Text style={styles.statusText}>{appointment.status}</Text>
        </View>
      </View>
      <View style={styles.appointmentContent}>
        <View style={styles.userInfo}>
          <User size={Math.max(18, width * 0.05)} color="#64748B" />
          <Text style={[styles.userName, { fontSize: Math.max(15, width * 0.04) }]}>{otherUser?.name || 'Unknown'}</Text>
        </View>
        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <Clock size={Math.max(14, width * 0.04)} color="#64748B" />
            <Text style={[styles.detailText, { fontSize: Math.max(13, width * 0.035) }]}>{appointment.duration} minutes</Text>
          </View>
          {appointment.notes && (
            <View style={styles.notesContainer}>
              <Text style={[styles.notesText, { fontSize: Math.max(13, width * 0.035) }]}>{appointment.notes}</Text>
            </View>
          )}
        </View>
        <View style={styles.appointmentActions}>
          {appointment.meeting_link && (
            <TouchableOpacity style={[styles.actionButton, { paddingHorizontal: width * 0.04, paddingVertical: width * 0.025 }]}> 
              <Video size={Math.max(14, width * 0.04)} color="#10B981" />
              <Text style={[styles.actionButtonText, { fontSize: Math.max(13, width * 0.035) }]}>Join Meeting</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionButton, { paddingHorizontal: width * 0.04, paddingVertical: width * 0.025 }]}> 
            <Phone size={Math.max(14, width * 0.04)} color="#10B981" />
            <Text style={[styles.actionButtonText, { fontSize: Math.max(13, width * 0.035) }]}>Contact</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748B',
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
    fontWeight: '400',
    fontFamily: 'System',
    color: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: 0.2,
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
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1E293B',
  },
  appointmentTimeText: {
    fontSize: 14,
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'System',
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
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1E293B',
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
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748B',
  },
  notesContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
  },
  notesText: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
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
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  searchButton: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#ffffff',
  },
});
