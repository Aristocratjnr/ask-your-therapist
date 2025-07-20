import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';

export default function HomeScreen() {
  const { userProfile } = useAuth();
  const { initiateCall } = useVideoCall();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    unreadMessages: 0,
    progressEntries: 0,
    totalClients: 0,
  });

  const [progressStats, setProgressStats] = useState({
    avgPain: 0,
    avgMood: 0,
    streak: 0,
    lastEntry: null,
  });

  const isTherapist = userProfile?.role === 'therapist';
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get('window');
  const horizontalPadding = Math.max(16, Math.round(screenWidth * 0.05));
  const statCardMinWidth = Math.min(160, Math.max(120, Math.round(screenWidth * 0.28)));
  const fontScale = screenWidth < 350 ? 0.92 : screenWidth > 500 ? 1.08 : 1;
  // Responsive quick action columns
  let quickActionColumns = 2;
  if (screenWidth < 400) quickActionColumns = 1;
  else if (screenWidth > 700) quickActionColumns = 4;
  else if (screenWidth > 500) quickActionColumns = 3;
  const quickActionCardWidth = `${Math.floor(100 / quickActionColumns) - 3}%`;
  const quickActionCardMargin = 6;
  const quickActionIconSize = screenWidth < 350 ? 18 : screenWidth > 500 ? 28 : 22;

  useEffect(() => {
    loadDashboardData();
  }, [userProfile]);

  const loadDashboardData = async () => {
    if (!userProfile) return;

    try {
      // Load upcoming appointments
      const { count: appointmentCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq(isTherapist ? 'therapist_id' : 'client_id', userProfile.id)
        .gte('scheduled_at', new Date().toISOString());

      // Load unread messages
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userProfile.id)
        .eq('read', false);

      setStats(prev => ({
        ...prev,
        upcomingAppointments: appointmentCount || 0,
        unreadMessages: messageCount || 0,
      }));

      if (isTherapist) {
        // Load client count for therapists
        const { data: clientData } = await supabase
          .from('appointments')
          .select('client_id')
          .eq('therapist_id', userProfile.id);

        const uniqueClients = new Set(clientData?.map(a => a.client_id) || []);
        
        setStats(prev => ({
          ...prev,
          totalClients: uniqueClients.size,
        }));
      } else {
        // Load progress stats for clients
        const { data: progressData } = await supabase
          .from('progress_logs')
          .select('pain_level, mood_level, date')
          .eq('client_id', userProfile.id)
          .order('date', { ascending: false })
          .limit(7);

        if (progressData && progressData.length > 0) {
          const avgPain = Math.round(
            progressData.reduce((sum, log) => sum + log.pain_level, 0) / progressData.length
          );
          const avgMood = Math.round(
            progressData.reduce((sum, log) => sum + log.mood_level, 0) / progressData.length
          );

          setProgressStats({
            avgPain,
            avgMood,
            streak: progressData.length,
            lastEntry: progressData[0].date,
          });

          setStats(prev => ({
            ...prev,
            progressEntries: progressData.length,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'find-therapist':
        router.push('/(tabs)/search');
        break;
      case 'appointments':
        router.push('/(tabs)/appointments');
        break;
      case 'log-progress':
        router.push('/(tabs)/progress-log');
        break;
      case 'messages':
        router.push('/(tabs)/messages');
        break;
      case 'schedule':
        router.push('/(tabs)/appointments');
        break;
      case 'progress-reviews':
        router.push('/(tabs)/progress-charts');
        break;
      case 'client-profiles':
        router.push('/(tabs)/client-management');
        break;
      case 'demo-call':
        initiateCall('demo-therapist', 'video').then((channelName) => {
          router.push(`/video-call/${channelName}`);
        });
        break;
      default:
        console.log('Action not implemented:', action);
    }
  };

  const demoButtonScale = React.useRef(new Animated.Value(1)).current;
  const handleDemoButtonPressIn = () => {
    Animated.spring(demoButtonScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };
  const handleDemoButtonPressOut = () => {
    Animated.spring(demoButtonScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const quickActionScale = React.useRef<{ [key: string]: Animated.Value }>(
    {}
  ).current;
  const getQuickActionScale = (key: string) => {
    if (!quickActionScale[key]) quickActionScale[key] = new Animated.Value(1);
    return quickActionScale[key];
  };
  const handleQuickActionPressIn = (key: string) => {
    Animated.spring(getQuickActionScale(key), {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };
  const handleQuickActionPressOut = (key: string) => {
    Animated.spring(getQuickActionScale(key), {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const randomAvatarUrl = useMemo(() => {
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    const num = Math.floor(Math.random() * 60);
    return `https://randomuser.me/api/portraits/${gender}/${num}.jpg`;
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#14b8a6"
            colors={['#14b8a6']} 
          />
        }
      >
        {/* Header Section */}
        <LinearGradient
          colors={['#F0FDF4', '#ECFDF5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.headerContainer, { paddingHorizontal: horizontalPadding }]}
        >
          <View style={[styles.headerContent, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}> 
            <View>
              <Text style={[styles.greeting, { fontSize: 16 * fontScale }]}> {getGreeting()}, </Text>
              <Text style={[styles.name, { fontSize: 24 * fontScale }]}> {userProfile?.name || 'User'} </Text>
              <Text style={[styles.subtitle, { fontSize: 14 * fontScale }]}> {isTherapist ? 'Ready to help your clients today?' : 'How are you feeling today?'} </Text>
            </View>
            <View style={{ marginLeft: 16 }}>
              <View style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                overflow: 'hidden',
                borderWidth: 3,
                borderColor: '#fff',
                backgroundColor: '#e5e7eb',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 4,
              }}>
                <Image
                  source={{ uri: randomAvatarUrl }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Stats Grid */}
        <View style={[styles.statsGridContainer, { paddingHorizontal: horizontalPadding }]}> 
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { minWidth: statCardMinWidth }]}> 
              <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}> 
                <MaterialIcons name="calendar-today" size={20} color="#14b8a6" />
              </View>
              <Text style={[styles.statNumber, { fontSize: 20 * fontScale }]}> {stats.upcomingAppointments} </Text>
              <Text style={[styles.statLabel, { fontSize: 12 * fontScale }]}> Upcoming Appointments </Text>
            </View>

            <View style={[styles.statCard, { minWidth: statCardMinWidth }]}> 
              <View style={[styles.statIcon, { backgroundColor: '#E0E7FF' }]}> 
                <MaterialIcons name="mail" size={20} color="#4F46E5" />
              </View>
              <Text style={[styles.statNumber, { fontSize: 20 * fontScale }]}> {stats.unreadMessages} </Text>
              <Text style={[styles.statLabel, { fontSize: 12 * fontScale }]}> Unread Messages </Text>
            </View>

            {isTherapist ? (
              <View style={[styles.statCard, { minWidth: statCardMinWidth }]}> 
                <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}> 
                  <MaterialIcons name="group" size={20} color="#EF4444" />
                </View>
                <Text style={[styles.statNumber, { fontSize: 20 * fontScale }]}> {stats.totalClients} </Text>
                <Text style={[styles.statLabel, { fontSize: 12 * fontScale }]}> Total Clients </Text>
              </View>
            ) : (
              <View style={[styles.statCard, { minWidth: statCardMinWidth }]}> 
                <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}> 
                  <MaterialIcons name="show-chart" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.statNumber, { fontSize: 20 * fontScale }]}> {stats.progressEntries} </Text>
                <Text style={[styles.statLabel, { fontSize: 12 * fontScale }]}> Progress Entries </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={[styles.sectionContainer, { paddingHorizontal: horizontalPadding }]}> 
          <Text style={[styles.sectionTitle, { fontSize: 18 * fontScale }]}> Quick Actions </Text>
          <View style={styles.quickActionGrid}>
            {(isTherapist ? [
              {
                key: 'schedule',
                title: 'Manage Schedule',
                desc: 'Set your availability',
                icon: 'calendar-today',
                color: '#14b8a6',
                bgColor: '#D1FAE5',
                onPress: () => handleQuickAction('schedule'),
              },
              {
                key: 'messages',
                title: 'Client Messages',
                desc: 'Respond to clients',
                icon: 'mail',
                color: '#4F46E5',
                bgColor: '#E0E7FF',
                onPress: () => handleQuickAction('messages'),
              },
              {
                key: 'progress-reviews',
                title: 'Progress Reviews',
                desc: 'Check client progress',
                icon: 'show-chart',
                color: '#F59E0B',
                bgColor: '#FEF3C7',
                onPress: () => handleQuickAction('progress-reviews'),
              },
              {
                key: 'client-profiles',
                title: 'Client Profiles',
                desc: 'View client records',
                icon: 'folder-shared',
                color: '#EC4899',
                bgColor: '#FCE7F3',
                onPress: () => handleQuickAction('client-profiles'),
              },
            ] : [
              {
                key: 'find-therapist',
                title: 'Find Therapist',
                desc: 'Book a session',
                icon: 'favorite',
                color: '#14b8a6',
                bgColor: '#D1FAE5',
                onPress: () => handleQuickAction('find-therapist'),
              },
              {
                key: 'appointments',
                title: 'Appointments',
                desc: 'View schedule',
                icon: 'schedule',
                color: '#4F46E5',
                bgColor: '#E0E7FF',
                onPress: () => handleQuickAction('appointments'),
              },
              {
                key: 'log-progress',
                title: 'Log Progress',
                desc: 'Track your journey',
                icon: 'show-chart',
                color: '#F59E0B',
                bgColor: '#FEF3C7',
                onPress: () => handleQuickAction('log-progress'),
              },
              {
                key: 'messages',
                title: 'Messages',
                desc: 'Chat with therapist',
                icon: 'mail',
                color: '#EC4899',
                bgColor: '#FCE7F3',
                onPress: () => handleQuickAction('messages'),
              },
            ]).map(action => (
              <Animated.View
                key={action.key}
                style={{
                  transform: [{ scale: getQuickActionScale(action.key) }],
                  width: quickActionCardWidth as any, // allow percentage string for width
                  minWidth: 140,
                  marginBottom: 16,
                  marginRight: quickActionCardMargin,
                }}
              >
                <TouchableOpacity
                  style={[styles.quickActionCard, { backgroundColor: action.bgColor, alignItems: 'center', justifyContent: 'center' }]}
                  onPress={action.onPress}
                  onPressIn={() => handleQuickActionPressIn(action.key)}
                  onPressOut={() => handleQuickActionPressOut(action.key)}
                  activeOpacity={0.9}
                >
                  <View style={[styles.quickActionIconCircle, { backgroundColor: action.color, width: quickActionIconSize * 2.2, height: quickActionIconSize * 2.2, borderRadius: quickActionIconSize * 1.1 }]}> 
                    <MaterialIcons name={action.icon as any} size={quickActionIconSize} color="#fff" />
                  </View>
                  <Text style={[styles.quickActionTitle, { fontSize: 15 * fontScale, marginTop: 4, textAlign: 'center' }]}> {action.title} </Text>
                  <Text style={[styles.quickActionDesc, { fontSize: 13 * fontScale, marginTop: 2, textAlign: 'center' }]}> {action.desc} </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={[styles.sectionContainer, { paddingHorizontal: horizontalPadding }]}> 
          <Text style={[styles.sectionTitle, { fontSize: 18 * fontScale }]}> Recent Activity </Text>
          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <MaterialIcons name="schedule" size={20} color="#64748B" />
            </View>
            <Text style={[styles.activityText, { fontSize: 14 * fontScale }]}> {isTherapist ? 'No recent client activity. Check back later.' : 'Welcome to OTConekt! Start by finding a therapist that suits your needs.'} </Text>
          </View>
        </View>

        {/* Demo Video Call Section */}
        <View style={[styles.sectionContainer, { paddingHorizontal: horizontalPadding }]}> 
          <Text style={[styles.sectionTitle, { fontSize: 18 * fontScale }]}> Try Our Features </Text>
          <Animated.View style={{ transform: [{ scale: demoButtonScale }] }}>
            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => handleQuickAction('demo-call')}
              onPressIn={handleDemoButtonPressIn}
              onPressOut={handleDemoButtonPressOut}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.demoGradient}
              >
                <View style={styles.demoBadge}>
                  <Text style={styles.demoBadgeText}>NEW</Text>
                </View>
                <View style={styles.demoContent}>
                  <View style={styles.demoIconCircle}>
                    <MaterialIcons name="videocam" size={28} color="#fff" />
                  </View>
                  <View style={styles.demoTextContainer}>
                    <Text style={styles.demoCardTitle}>Test Video Call</Text>
                    <Text style={styles.demoCardDesc}> Experience our secure, high-quality video calling feature </Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 8,
  },
  headerContent: {
    maxWidth: '100%',
  },
  greeting: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748B',
    marginBottom: 4,
  },
  name: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748B',
    lineHeight: 20,
  },
  statsGridContainer: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    flex: 1,
    minWidth: 120,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748B',
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1E293B',
    marginBottom: 16,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1E293B',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionDesc: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748B',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityText: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748B',
    flex: 1,
    lineHeight: 20,
  },
  demoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  demoGradient: {
    padding: 20,
    position: 'relative',
  },
  demoBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  demoBadgeText: {
    fontWeight: '400',
    fontFamily: 'System',
    color: '#FFFFFF',
    fontSize: 12,
  },
  demoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  demoTextContainer: {
    flex: 1,
  },
  demoCardTitle: {
    fontWeight: '400',
    fontFamily: 'System',
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 4,
  },
  demoCardDesc: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#E0E7FF',
    fontSize: 14,
    lineHeight: 20,
  },
});