// Create: app/(tabs)/progress-charts.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { TrendingUp, Heart, Brain } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading progress data...</Text>
      </View>
    );
  }

  if (progressData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TrendingUp size={32} color="#10B981" />
          <Text style={styles.title}>Progress Overview</Text>
          <Text style={styles.subtitle}>
            {clientId ? 'Client Progress Analysis' : 'Your Recovery Journey'}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No progress data available yet.</Text>
          <Text style={styles.emptySubtext}>
            {clientId ? 'This client hasn\'t logged any progress yet.' : 'Start logging your daily progress to see charts and trends here.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TrendingUp size={32} color="#10B981" />
        <Text style={styles.title}>Progress Overview</Text>
        <Text style={styles.subtitle}>
          {clientId ? 'Client Progress Analysis' : 'Your Recovery Journey'}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Heart size={24} color="#ef4444" />
          <Text style={styles.statTitle}>Average Pain Level</Text>
          <Text style={styles.statValue}>{calculateAverage('pain_level')}/10</Text>
          <Text style={styles.statTrend}>
            {getLatestTrend('pain_level') === 'down' ? '↓ Improving' : 
             getLatestTrend('pain_level') === 'up' ? '↑ Increasing' : '→ Stable'}
          </Text>
        </View>

        <View style={styles.statCard}>
          <Brain size={24} color="#10B981" />
          <Text style={styles.statTitle}>Average Mood</Text>
          <Text style={styles.statValue}>{calculateAverage('mood_level')}/10</Text>
          <Text style={styles.statTrend}>
            {getLatestTrend('mood_level') === 'up' ? '↑ Improving' : 
             getLatestTrend('mood_level') === 'down' ? '↓ Declining' : '→ Stable'}
          </Text>
        </View>
      </View>

      {/* Simple Bar Chart Visualization */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Pain & Mood Trends (Last 7 Days)</Text>
        <View style={styles.chartWrapper}>
          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>Pain</Text>
            <Text style={styles.chartLabel}>Mood</Text>
          </View>
          <View style={styles.chartBars}>
            {progressData.slice(-7).map((entry, index) => (
              <View key={entry.id} style={styles.chartDay}>
                <View style={styles.chartColumn}>
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
                <Text style={styles.dayLabel}>
                  {new Date(entry.date).toLocaleDateString('en', { weekday: 'short' })}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.entriesContainer}>
        <Text style={styles.sectionTitle}>Recent Entries ({progressData.length})</Text>
        {progressData.slice(-10).reverse().map((entry, index) => (
          <View key={entry.id} style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryDate}>
                {new Date(entry.date).toLocaleDateString()}
              </Text>
              <View style={styles.entryStats}>
                <Text style={styles.entryStat}>Pain: {entry.pain_level}/10</Text>
                <Text style={styles.entryStat}>Mood: {entry.mood_level}/10</Text>
              </View>
            </View>
            {entry.exercise_notes && (
              <Text style={styles.entryNotes}>{entry.exercise_notes}</Text>
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
    paddingBottom: 90, // Add padding for tab bar
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
  header: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  statTrend: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 4,
  },
  entriesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  entryCard: {
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
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  entryStats: {
    flexDirection: 'row',
    gap: 12,
  },
  entryStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  entryNotes: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  chartContainer: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartWrapper: {
    height: 200,
    flexDirection: 'row',
  },
  chartLabels: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 20,
    marginRight: 8,
  },
  chartLabel: {
    fontSize: 10,
    color: '#6b7280',
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
    height: 120,
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
    backgroundColor: '#10B981',
    width: '45%',
    borderRadius: 2,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
});