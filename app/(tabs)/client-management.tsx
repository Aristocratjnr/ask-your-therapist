import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image,
  Dimensions,
  useWindowDimensions,
  PixelRatio
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useMessaging } from '@/contexts/MessagingContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scaleFont = (size: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

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
  const { width: screenWidth } = useWindowDimensions();
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

      // Get unique clients with random user images
      const uniqueClients: Client[] = (appointments || []).reduce((acc: Client[], appointment: any, index: number) => {
        const clientId = appointment.client_id;
        const client = appointment.client;
        
        if (client && !acc.find(c => c.id === clientId)) {
          acc.push({
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            photo_url: `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${index % 100}.jpg`,
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
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9']}
        style={[styles.header, { paddingTop: screenWidth * 0.15 }]}
      >
        <View style={styles.headerContent}>
          <MaterialIcons 
            name="group" 
            size={scaleFont(32)} 
            color="#14b8a6" 
            style={{ marginBottom: screenWidth * 0.03 }}
          />
          <Text style={[styles.headerTitle, { fontSize: scaleFont(24) }]}>Client Management</Text>
          <Text style={[styles.headerSubtitle, { fontSize: scaleFont(14) }]}>Monitor your clients' progress</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={[styles.contentWithMargin, { padding: screenWidth * 0.05 }]}>
        <Text style={[styles.sectionTitle, { fontSize: scaleFont(18) }]}>
          Active Clients ({clients.length})
        </Text>

        {clients.map((client, idx) => (
          <View
            key={client.id}
            style={[
              styles.clientCard, 
              idx === 0 && styles.firstCard,
              { 
                padding: screenWidth * 0.04,
                marginBottom: screenWidth * 0.03,
                borderRadius: screenWidth * 0.04
              }
            ]}
          >
            {/* Client Header with Profile Image */}
            <View style={styles.clientHeader}>
              {client.photo_url ? (
                <Image
                  source={{ uri: client.photo_url }}
                  style={[
                    styles.clientAvatar, 
                    { 
                      width: screenWidth * 0.12,
                      height: screenWidth * 0.12,
                      borderRadius: screenWidth * 0.06
                    }
                  ]}
                />
              ) : (
                <View style={[
                  styles.clientAvatarPlaceholder,
                  { 
                    width: screenWidth * 0.12,
                    height: screenWidth * 0.12,
                    borderRadius: screenWidth * 0.06
                  }
                ]}>
                  <Text style={[styles.clientInitials, { fontSize: scaleFont(18) }]}>
                    {client.name?.charAt(0) || 'C'}
                  </Text>
                </View>
              )}
              <View style={styles.clientInfo}>
                <Text style={[styles.clientName, { fontSize: scaleFont(16) }]}>{client.name}</Text>
                <Text style={[styles.clientCondition, { fontSize: scaleFont(14) }]}>
                  {client.condition || 'No condition specified'}
                </Text>
              </View>
            </View>

            {/* Progress Info */}
            {client.recentProgress && (
              <View style={[
                styles.progressInfo,
                { 
                  paddingVertical: screenWidth * 0.02,
                  marginVertical: screenWidth * 0.02
                }
              ]}>
                <View style={styles.progressItem}>
                  <Text style={[styles.progressLabel, { fontSize: scaleFont(12) }]}>Latest Pain</Text>
                  <Text style={[
                    styles.progressValue,
                    { 
                      fontSize: scaleFont(16),
                      color: client.recentProgress.pain_level > 6 ? '#ef4444' : '#14b8a6' 
                    }
                  ]}>
                    {client.recentProgress.pain_level}/10
                  </Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={[styles.progressLabel, { fontSize: scaleFont(12) }]}>Latest Mood</Text>
                  <Text style={[
                    styles.progressValue,
                    { 
                      fontSize: scaleFont(16),
                      color: client.recentProgress.mood_level < 5 ? '#ef4444' : '#14b8a6' 
                    }
                  ]}>
                    {client.recentProgress.mood_level}/10
                  </Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={[styles.progressLabel, { fontSize: scaleFont(12) }]}>Last Update</Text>
                  <Text style={[styles.progressDate, { fontSize: scaleFont(14) }]}>
                    {new Date(client.recentProgress.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={[
              styles.clientActionsRow,
              { 
                paddingTop: screenWidth * 0.03,
                marginTop: screenWidth * 0.02
              }
            ]}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push(`/client-profile/${client.id}`)}
              >
                <MaterialIcons name="person" size={scaleFont(18)} color="#14b8a6" />
                <Text style={[styles.actionText, { fontSize: scaleFont(12) }]}>Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push(`/(tabs)/progress-charts?clientId=${client.id}`)}
              >
                <MaterialIcons name="trending-up" size={scaleFont(18)} color="#14b8a6" />
                <Text style={[styles.actionText, { fontSize: scaleFont(12) }]}>Progress</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push(`/(tabs)/booking?clientId=${client.id}`)}
              >
                <MaterialIcons name="calendar-today" size={scaleFont(18)} color="#14b8a6" />
                <Text style={[styles.actionText, { fontSize: scaleFont(12) }]}>Schedule</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleStartConversation(client.id)}
              >
                <MaterialIcons name="message" size={scaleFont(18)} color="#14b8a6" />
                <Text style={[styles.actionText, { fontSize: scaleFont(12) }]}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  header: {
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748b',
  },
  contentWithMargin: {
    marginTop: 12,
  },
  sectionTitle: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1f2937',
    marginBottom: 16,
  },
  clientCard: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  firstCard: {
    marginTop: 8,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientAvatar: {
    marginRight: 12,
  },
  clientAvatarPlaceholder: {
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientInitials: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#ffffff',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1f2937',
  },
  clientCondition: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#6b7280',
    marginTop: 2,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  progressItem: {
    alignItems: 'center',
    padding: 8,
  },
  progressLabel: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#6b7280',
    marginBottom: 4,
  },
  progressValue: {
    fontWeight: '300',
    fontFamily: 'System',
  },
  progressDate: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#6b7280',
  },
  clientActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#14b8a6',
    marginTop: 4,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#6b7280',
    textAlign: 'center',
  },
});