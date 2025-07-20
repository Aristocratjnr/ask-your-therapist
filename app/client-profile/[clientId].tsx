// Create: app/client-profile/[clientId].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { User, FileText, Calendar, ArrowLeft, Save, Edit3 } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo_url?: string;
}

interface ClientProfile {
  id: string;
  client_id: string;
  condition: string;
  therapy_goals?: string;
  medical_history?: string;
  current_medications?: string;
  access_granted_until: string;
  client?: ClientData;
}

interface Appointment {
  id: string;
  client_id: string;
  therapist_id: string;
  scheduled_at: string;
  status: 'booked' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  created_at: string;
}

interface TherapistNote {
  id: string;
  client_profile_id: string;
  therapist_id: string;
  subject: string;
  content: string;
  note_type: string;
  is_official: boolean;
  signed_at?: string;
  signed_by?: string;
  created_at: string;
}

export default function ClientProfileScreen() {
  const { clientId } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [appointmentHistory, setAppointmentHistory] = useState<Appointment[]>([]);
  const [therapistNotes, setTherapistNotes] = useState<TherapistNote[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteSubject, setNoteSubject] = useState('');

  // Guard clause for userProfile
  if (!userProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in to view client profiles.</Text>
      </View>
    );
  }

  useEffect(() => {
    checkAccessAndLoadProfile();
  }, [clientId]);

  const checkAccessAndLoadProfile = async () => {
    try {
      // Check if therapist has access to this client
      const { data: accessCheck, error: accessError } = await supabase
        .rpc('has_client_access', {
          therapist_uuid: userProfile.id,
          client_uuid: clientId
        });

      if (accessError) {
        console.error('Access check error:', accessError);
        setHasAccess(false);
        return;
      }

      setHasAccess(accessCheck);

      if (!accessCheck) {
        Alert.alert(
          'Access Denied',
          'You do not have current access to this client profile. Access is granted only during active appointments.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      await loadClientProfile();
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const loadClientProfile = async () => {
    try {
      // Load client profile
      const { data: profile, error: profileError } = await supabase
        .from('client_profiles')
        .select(`
          *,
          client:users!client_id(id, name, email, phone, photo_url)
        `)
        .eq('client_id', clientId)
        .single();

      if (profileError) throw profileError;
      setClientProfile(profile);

      // Load appointment history
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .eq('therapist_id', userProfile.id)
        .order('scheduled_at', { ascending: false });

      if (appointmentsError) throw appointmentsError;
      setAppointmentHistory(appointments || []);

      // Load therapist notes
      const { data: notes, error: notesError } = await supabase
        .from('therapist_notes')
        .select('*')
        .eq('client_profile_id', profile.id)
        .eq('therapist_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setTherapistNotes(notes || []);

    } catch (error) {
      console.error('Error loading client profile:', error);
      Alert.alert('Error', 'Failed to load client profile');
    }
  };

  const addTherapistNote = async () => {
    if (!noteSubject.trim() || !newNote.trim() || !clientProfile) {
      Alert.alert('Error', 'Please enter both subject and note content');
      return;
    }

    try {
      const { error } = await supabase
        .from('therapist_notes')
        .insert({
          client_profile_id: clientProfile.id,
          therapist_id: userProfile.id,
          subject: noteSubject.trim(),
          content: newNote.trim(),
          signed_by: userProfile.id,
        });

      if (error) throw error;

      Alert.alert('Success', 'Note added successfully');
      setNewNote('');
      setNoteSubject('');
      setEditingNote(false);
      loadClientProfile();

    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading client profile...</Text>
      </View>
    );
  }

  if (!hasAccess) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Text style={styles.accessDeniedText}>
          Access to this client profile is restricted.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#10B981" />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#10B981" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Profile</Text>
      </View>

      {/* Client Header */}
      <View style={styles.clientHeader}>
        <View style={styles.clientAvatar}>
          <User size={32} color="#ffffff" />
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{clientProfile?.client?.name}</Text>
          <Text style={styles.clientCondition}>{clientProfile?.condition}</Text>
          <Text style={styles.accessInfo}>
            Access until: {clientProfile?.access_granted_until ? new Date(clientProfile.access_granted_until).toLocaleString() : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Medical Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Condition</Text>
            <Text style={styles.infoValue}>{clientProfile?.condition}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Therapy Goals</Text>
            <Text style={styles.infoValue}>
              {clientProfile?.therapy_goals || 'Not specified'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Medical History</Text>
            <Text style={styles.infoValue}>
              {clientProfile?.medical_history || 'Not provided'}
            </Text>
          </View>
        </View>
      </View>

      {/* Appointment History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointment History</Text>
        {appointmentHistory.length === 0 ? (
          <Text style={styles.noDataText}>No appointments yet</Text>
        ) : (
          appointmentHistory.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Calendar size={16} color="#10B981" />
                <Text style={styles.appointmentDate}>
                  {new Date(appointment.scheduled_at).toLocaleDateString()}
                </Text>
                <Text style={styles.appointmentStatus}>{appointment.status}</Text>
              </View>
              <Text style={styles.appointmentTime}>
                {new Date(appointment.scheduled_at).toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Therapist Notes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Professional Notes</Text>
          <TouchableOpacity
            style={styles.addNoteButton}
            onPress={() => setEditingNote(true)}
          >
            <Edit3 size={16} color="#10B981" />
            <Text style={styles.addNoteText}>Add Note</Text>
          </TouchableOpacity>
        </View>

        {editingNote && (
          <View style={styles.noteEditor}>
            <TextInput
              style={styles.noteSubjectInput}
              placeholder="Note subject (e.g., Session Summary, Progress Update)"
              value={noteSubject}
              onChangeText={setNoteSubject}
            />
            <TextInput
              style={styles.noteInput}
              placeholder="Enter your professional note here..."
              value={newNote}
              onChangeText={setNewNote}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <View style={styles.noteActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setEditingNote(false);
                  setNewNote('');
                  setNoteSubject('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={addTherapistNote}
              >
                <Save size={16} color="#ffffff" />
                <Text style={styles.saveButtonText}>Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {therapistNotes.length === 0 ? (
          <Text style={styles.noDataText}>No notes yet</Text>
        ) : (
          therapistNotes.map((note) => (
            <View key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <FileText size={16} color="#6b7280" />
                <Text style={styles.noteSubject}>{note.subject}</Text>
                <Text style={styles.noteDate}>
                  {new Date(note.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.noteContent}>{note.content}</Text>
              <Text style={styles.noteSignature}>
                Signed by: {userProfile.name} at {note.signed_at ? new Date(note.signed_at).toLocaleString() : 'N/A'}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#10B981',
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 16,
  },
  clientHeader: {
    backgroundColor: '#ffffff',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  clientAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  clientCondition: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  accessInfo: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  addNoteText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 4,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  noDataText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  appointmentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  appointmentStatus: {
    fontSize: 12,
    color: '#10B981',
    textTransform: 'capitalize',
  },
  appointmentTime: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 24,
  },
  noteEditor: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  noteSubjectInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    marginBottom: 12,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#ffffff',
    marginLeft: 4,
  },
  noteCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteSubject: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  noteDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  noteContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  noteSignature: {
    fontSize: 11,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    padding: 24,
  },
});