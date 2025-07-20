import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Users, TrendingUp, Calendar, MessageCircle, FileText } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useMessaging } from '@/contexts/MessagingContext';

interface RecentProgress {
  pain_level: number;
  mood_level: number;
  date: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo_url?: string;
  condition?: string;
  recentProgress?: RecentProgress | null;
}

export default function ClientManagementScreen() {
  const { userProfile } = useAuth();
  const { createConversation } = useMessaging();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.role === 'therapist') {
      loadClients();
    }
  }, [userProfile]);

  const loadClients = async () => {
    try {
      // Get clients who have appointments with this therapist
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          client_id,
          client:users!client_id(id, name, email, phone, photo_url, condition)
        `)
        .eq('therapist_id', userProfile!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique clients
      const uniqueClients: Client[] = (appointments || []).reduce((acc: Client[], appointment: any) => {
        const clientId = appointment.client_id;
        const client = appointment.client;
        
        if (client && !acc.find(c => c.id === clientId)) {
          acc.push({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            photo_url: client.photo_url,
            condition: client.condition,
          });
        }
        return acc;
      }, []);

      // Get recent progress for each client
      const clientsWithProgress = await Promise.all(
        uniqueClients.map(async (client): Promise<Client> => {
          const { data: recentProgress } = await supabase
            .from('progress_logs')
            .select('pain_level, mood_level, date')
            .eq('client_id', client.id)
            .order('date', { ascending: false })
            .limit(1);

          return {
            ...client,
            recentProgress: recentProgress?.[0] || null,
          };
        })
      );

      setClients(clientsWithProgress);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const viewClientProgress = (clientId: string) => {
    router.push(`/client-progress/${clientId}` as any);
  };

  const viewClientProfile = (clientId: string) => {
    router.push(`/client-profile/${clientId}` as any);
  };

  const handleStartConversation = async (clientId: string) => {
    try {
      const conversationId = await createConversation(clientId);
      router.push({
        pathname: '/chat/[conversationId]',
        params: { conversationId }
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  // Only show this screen to therapists
  if (!userProfile || userProfile.role !== 'therapist') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Access denied. This screen is for therapists only.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Users size={32} color="#10B981" />
        <Text style={styles.headerTitle}>Client Management</Text>
        <Text style={styles.headerSubtitle}>Monitor your clients' progress</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Active Clients ({clients.length})</Text>

        {clients.map((client) => (
          <TouchableOpacity
            key={client.id}
            style={styles.clientCard}
            onPress={() => viewClientProfile(client.id)}
          >
            <View style={styles.clientHeader}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientInitials}>
                  {client.name?.charAt(0) || 'C'}
                </Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{client.name}</Text>
                <Text style={styles.clientCondition}>{client.condition}</Text>
              </View>
            </View>

            {client.recentProgress && (
              <View style={styles.progressInfo}>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Latest Pain Level</Text>
                  <Text style={[
                    styles.progressValue,
                    { color: client.recentProgress.pain_level > 6 ? '#ef4444' : '#10B981' }
                  ]}>
                    {client.recentProgress.pain_level}/10
                  </Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Latest Mood</Text>
                  <Text style={[
                    styles.progressValue,
                    { color: client.recentProgress.mood_level < 5 ? '#ef4444' : '#10B981' }
                  ]}>
                    {client.recentProgress.mood_level}/10
                  </Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={styles.progressLabel}>Last Update</Text>
                  <Text style={styles.progressDate}>
                    {new Date(client.recentProgress.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.clientActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push(`/client-profile/${client.id}`)}
              >
                <FileText size={16} color="#10B981" />
                <Text style={styles.actionText}>View Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push(`/(tabs)/progress-charts?clientId=${client.id}`)}
              >
                <TrendingUp size={16} color="#10B981" />
                <Text style={styles.actionText}>View Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push(`/(tabs)/booking?clientId=${client.id}`)}
              >
                <Calendar size={16} color="#10B981" />
                <Text style={styles.actionText}>Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleStartConversation(client.id)}
              >
                <MessageCircle size={16} color="#10B981" />
                <Text style={styles.actionText}>Message</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 90, // Add padding for tab bar
  },
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  clientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  clientCondition: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  clientActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
