import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions,
  useWindowDimensions,
  ActivityIndicator,
  PixelRatio
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scaleFont = (size: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

interface ProgressEntry {
  id: string;
  client_id: string;
  date: string;
  exercise_notes: string;
  pain_level: number;
  mood_level: number;
  therapist_notes?: string;
  created_at: string;
  updated_at: string;
}

export default function ProgressChartsScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { clientId } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile || clientId) {
      loadProgressData();
    }
  }, [clientId, userProfile]);

  const loadProgressData = async () => {
    try {
      const targetClientId = clientId || userProfile?.id;
      
      if (!targetClientId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('client_id', targetClientId)
        .order('date', { ascending: true })
        .limit(30);

      if (error) throw error;
      setProgressData(data || []);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverage = (field: 'pain_level' | 'mood_level') => {
    if (progressData.length === 0) return 0;
    const sum = progressData.reduce((acc, entry) => acc + (entry[field] || 0), 0);
    return Math.round(sum / progressData.length);
  };

  const getLatestTrend = (field: 'pain_level' | 'mood_level') => {
    if (progressData.length < 2) return 'stable';
    const latest = progressData[progressData.length - 1][field];
    const previous = progressData[progressData.length - 2][field];
    
    if (latest > previous) return field === 'pain_level' ? 'up' : 'up';
    if (latest < previous) return field === 'pain_level' ? 'down' : 'down';
    return 'stable';
  };

  const getTrendColor = (trend: string, field: 'pain_level' | 'mood_level') => {
    if (trend === 'up') return field === 'pain_level' ? '#ef4444' : '#14b8a6';
    if (trend === 'down') return field === 'pain_level' ? '#14b8a6' : '#ef4444';
    return '#64748b';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Loading progress data...</Text>
      </View>
    );
  }

  if (progressData.length === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#f8fafc', '#f1f5f9']}
          style={[styles.header, { paddingTop: screenWidth * 0.15 }]}
        >
          <MaterialIcons 
            name="trending-up" 
            size={scaleFont(32)} 
            color="#14b8a6" 
            style={{ marginBottom: screenWidth * 0.03 }}
          />
          <Text style={[styles.title, { fontSize: scaleFont(24) }]}>Progress Overview</Text>
          <Text style={[styles.subtitle, { fontSize: scaleFont(14) }]}>
            {clientId ? 'Client Progress Analysis' : 'Your Recovery Journey'}
          </Text>
        </LinearGradient>

        <View style={styles.emptyContainer}>
          <MaterialIcons 
            name="insert-chart-outlined" 
            size={scaleFont(48)} 
            color="#cbd5e1" 
          />
          <Text style={[styles.emptyText, { fontSize: scaleFont(18) }]}>
            No progress data available yet
          </Text>
          <Text style={[styles.emptySubtext, { fontSize: scaleFont(14) }]}>
            {clientId 
              ? 'This client hasn\'t logged any progress yet.' 
              : 'Start logging your daily progress to see charts and trends here.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9']}
        style={[styles.header, { paddingTop: screenWidth * 0.15 }]}
      >
        <MaterialIcons 
          name="trending-up" 
          size={scaleFont(32)} 
          color="#14b8a6" 
          style={{ marginBottom: screenWidth * 0.03 }}
        />
        <Text style={[styles.title, { fontSize: scaleFont(24) }]}>Progress Overview</Text>
        <Text style={[styles.subtitle, { fontSize: scaleFont(14) }]}>
          {clientId ? 'Client Progress Analysis' : 'Your Recovery Journey'}
        </Text>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={[styles.statsContainer, { padding: screenWidth * 0.04 }]}>
        <View style={[styles.statCard, { padding: screenWidth * 0.04 }]}>
          <MaterialIcons name="favorite" size={scaleFont(24)} color="#ef4444" />
          <Text style={[styles.statTitle, { fontSize: scaleFont(12) }]}>Average Pain Level</Text>
          <Text style={[styles.statValue, { fontSize: scaleFont(24) }]}>
            {calculateAverage('pain_level')}/10
          </Text>
          <Text style={[
            styles.statTrend,
            { 
              fontSize: scaleFont(12),
              color: getTrendColor(getLatestTrend('pain_level'), 'pain_level')
            }
          ]}>
            {getLatestTrend('pain_level') === 'down' ? '↓ Improving' : 
             getLatestTrend('pain_level') === 'up' ? '↑ Increasing' : '→ Stable'}
          </Text>
        </View>

        <View style={[styles.statCard, { padding: screenWidth * 0.04 }]}>
          <MaterialIcons name="mood" size={scaleFont(24)} color="#14b8a6" />
          <Text style={[styles.statTitle, { fontSize: scaleFont(12) }]}>Average Mood</Text>
          <Text style={[styles.statValue, { fontSize: scaleFont(24) }]}>
            {calculateAverage('mood_level')}/10
          </Text>
          <Text style={[
            styles.statTrend,
            { 
              fontSize: scaleFont(12),
              color: getTrendColor(getLatestTrend('mood_level'), 'mood_level')
            }
          ]}>
            {getLatestTrend('mood_level') === 'up' ? '↑ Improving' : 
             getLatestTrend('mood_level') === 'down' ? '↓ Declining' : '→ Stable'}
          </Text>
        </View>
      </View>

      {/* Chart */}
      <View style={[styles.chartContainer, { 
        margin: screenWidth * 0.04,
        padding: screenWidth * 0.04
      }]}>
        <Text style={[styles.sectionTitle, { fontSize: scaleFont(18) }]}>
          Pain & Mood Trends (Last 7 Days)
        </Text>
        <View style={[styles.chartWrapper, { height: screenWidth * 0.5 }]}>
          <View style={styles.chartLabels}>
            <Text style={[styles.chartLabel, { fontSize: scaleFont(10) }]}>Pain</Text>
            <Text style={[styles.chartLabel, { fontSize: scaleFont(10) }]}>Mood</Text>
          </View>
          <View style={styles.chartBars}>
            {progressData.slice(-7).map((entry, index) => (
              <View key={entry.id} style={styles.chartDay}>
                <View style={[styles.chartColumn, { height: screenWidth * 0.35 }]}>
                  <View 
                    style={[
                      styles.painBar, 
                      { height: `${(entry.pain_level / 10) * 100}%` }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.moodBar, 
                      { height: `${(entry.mood_level / 10) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={[styles.dayLabel, { fontSize: scaleFont(10) }]}>
                  {new Date(entry.date).toLocaleDateString('en', { weekday: 'short' })}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Recent Entries */}
      <View style={[styles.entriesContainer, { padding: screenWidth * 0.04 }]}>
        <Text style={[styles.sectionTitle, { fontSize: scaleFont(18) }]}>
          Recent Entries ({progressData.length})
        </Text>
        {progressData.slice(-10).reverse().map((entry, index) => (
          <View key={entry.id} style={[
            styles.entryCard, 
            { 
              padding: screenWidth * 0.04,
              marginBottom: screenWidth * 0.03,
              borderRadius: screenWidth * 0.03
            }
          ]}>
            <View style={styles.entryHeader}>
              <Text style={[styles.entryDate, { fontSize: scaleFont(14) }]}>
                {new Date(entry.date).toLocaleDateString()}
              </Text>
              <View style={styles.entryStats}>
                <Text style={[styles.entryStat, { fontSize: scaleFont(12) }]}>
                  Pain: {entry.pain_level}/10
                </Text>
                <Text style={[styles.entryStat, { fontSize: scaleFont(12) }]}>
                  Mood: {entry.mood_level}/10
                </Text>
              </View>
            </View>
            {entry.exercise_notes && (
              <Text style={[styles.entryNotes, { fontSize: scaleFont(14) }]}>
                {entry.exercise_notes}
              </Text>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748b',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statTitle: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  statValue: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1f2937',
    marginTop: 4,
  },
  statTrend: {
    fontWeight: '300',
    fontFamily: 'System',
    marginTop: 4,
  },
  entriesContainer: {
    marginBottom: 90,
  },
  sectionTitle: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1f2937',
    marginBottom: 12,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1f2937',
  },
  entryStats: {
    flexDirection: 'row',
    gap: 12,
  },
  entryStat: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  entryNotes: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#374151',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  emptySubtext: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chartWrapper: {
    flexDirection: 'row',
  },
  chartLabels: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 20,
    marginRight: 8,
  },
  chartLabel: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748b',
    marginBottom: 8,
    transform: [{ rotate: '-90deg' }],
    width: 40,
    textAlign: 'center',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  chartDay: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  chartColumn: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  painBar: {
    backgroundColor: '#ef4444',
    width: '45%',
    borderRadius: 2,
    marginRight: 2,
    minHeight: 4,
  },
  moodBar: {
    backgroundColor: '#14b8a6',
    width: '45%',
    borderRadius: 2,
    minHeight: 4,
  },
  dayLabel: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
});