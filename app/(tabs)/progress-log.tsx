import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Animated, Dimensions, useWindowDimensions, PixelRatio, Platform } from 'react-native';
import { Calendar, Heart, Brain, FileText, Save, TrendingUp, Smile, Frown, Meh } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scaleFont = (size: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Platform.OS === 'ios' ? Math.round(PixelRatio.roundToNearestPixel(newSize)) : Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

export default function ProgressLogScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [painLevel, setPainLevel] = useState(5);
  const [moodLevel, setMoodLevel] = useState(5);
  const [exerciseNotes, setExerciseNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitLog = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      
      const logData = {
        client_id: userProfile.id,
        date: selectedDate,
        pain_level: painLevel,
        mood_level: moodLevel,
        exercise_notes: exerciseNotes.trim() || 'No exercises recorded',
      };

      // Check if log already exists for this date
      const { data: existingLog } = await supabase
        .from('progress_logs')
        .select('id')
        .eq('client_id', userProfile.id)
        .eq('date', selectedDate)
        .single();

      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('progress_logs')
          .update(logData)
          .eq('id', existingLog.id);
          
        if (error) throw error;
        Alert.alert('Success', 'Progress log updated successfully!');
      } else {
        // Create new log
        const { error } = await supabase
          .from('progress_logs')
          .insert(logData);
          
        if (error) throw error;
        Alert.alert('Success', 'Progress log saved successfully!');
      }

      // Reset form
      setPainLevel(5);
      setMoodLevel(5);
      setExerciseNotes('');
      
    } catch (error) {
      console.error('Error saving progress log:', error);
      Alert.alert('Error', 'Failed to save progress log');
    } finally {
      setLoading(false);
    }
  };

  const getPainLevelColor = (level: number): string => {
    if (level <= 3) return '#22c55e'; // Green
    if (level <= 6) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getMoodIcon = (level: number) => {
    if (level <= 3) return <Frown size={20} color="#ef4444" />;
    if (level <= 7) return <Meh size={20} color="#f59e0b" />;
    return <Smile size={20} color="#22c55e" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <ScrollView style={[styles.container, { paddingBottom: screenWidth * 0.18 }]} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={[styles.header, {
          padding: screenWidth * 0.08,
          paddingTop: screenWidth * 0.18,
          borderBottomLeftRadius: screenWidth * 0.07,
          borderBottomRightRadius: screenWidth * 0.07,
        }]}
      >
        <View style={styles.headerIconContainer}>
          <Heart size={scaleFont(28)} color="#ffffff" />
          <TrendingUp size={scaleFont(24)} color="rgba(255, 255, 255, 0.8)" style={styles.trendIcon} />
        </View>
        <Text style={[styles.headerTitle, { fontSize: scaleFont(28) }]}>Daily Progress Log</Text>
        <Text style={[styles.headerSubtitle, { fontSize: scaleFont(16) }]}>Track your healing journey</Text>
      </LinearGradient>

      <View style={[styles.content, { padding: screenWidth * 0.055 }] }>
        {/* Date Selection Card */}
        <View style={[styles.card, { padding: screenWidth * 0.055, borderRadius: screenWidth * 0.045, marginBottom: screenWidth * 0.055 }] }>
          <View style={styles.cardHeader}>
            <Calendar size={scaleFont(24)} color="#667eea" />
            <Text style={[styles.cardTitle, { fontSize: scaleFont(20) }]}>Date</Text>
          </View>
          <TouchableOpacity style={[styles.dateButton, { padding: screenWidth * 0.04, borderRadius: screenWidth * 0.035 }] }>
            <Text style={[styles.dateText, { fontSize: scaleFont(16) }]}>{formatDate(selectedDate)}</Text>
            <View style={[styles.dateBadge, { paddingHorizontal: screenWidth * 0.03, paddingVertical: screenWidth * 0.012, borderRadius: screenWidth * 0.035 }] }>
              <Text style={[styles.dateBadgeText, { fontSize: scaleFont(12) }]}>Today</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pain Level Card */}
        <View style={[styles.card, { padding: screenWidth * 0.055, borderRadius: screenWidth * 0.045, marginBottom: screenWidth * 0.055 }] }>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { width: screenWidth * 0.13, height: screenWidth * 0.13, borderRadius: screenWidth * 0.03 }] }>
              <Heart size={scaleFont(24)} color="#ef4444" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { fontSize: scaleFont(20) }]}>Pain Level</Text>
              <Text style={[styles.cardSubtitle, { fontSize: scaleFont(14) }]}>Rate your current pain (1-10)</Text>
            </View>
          </View>
          
          <View style={styles.levelDisplay}>
            <Text style={[styles.levelNumber, { color: getPainLevelColor(painLevel), fontSize: scaleFont(48) }]}> 
              {painLevel}
            </Text>
            <Text style={[styles.levelLabel, { fontSize: scaleFont(16) }] }>
              {painLevel <= 3 ? 'Mild' : painLevel <= 6 ? 'Moderate' : 'Severe'}
            </Text>
          </View>
          
          <View style={[styles.scaleContainer, { gap: screenWidth * 0.018 }] }>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.scaleButton,
                  { width: screenWidth * 0.12, height: screenWidth * 0.12, borderRadius: screenWidth * 0.06 },
                  painLevel === level && [styles.scaleButtonActive, { backgroundColor: getPainLevelColor(level), transform: [{ scale: 1.13 }] }]
                ]}
                onPress={() => setPainLevel(level)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.scaleButtonText,
                  { fontSize: scaleFont(16) },
                  painLevel === level && styles.scaleButtonTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mood Level Card */}
        <View style={[styles.card, { padding: screenWidth * 0.055, borderRadius: screenWidth * 0.045, marginBottom: screenWidth * 0.055 }] }>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { width: screenWidth * 0.13, height: screenWidth * 0.13, borderRadius: screenWidth * 0.03 }] }>
              <Brain size={scaleFont(24)} color="#8b5cf6" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { fontSize: scaleFont(20) }]}>Mood Level</Text>
              <Text style={[styles.cardSubtitle, { fontSize: scaleFont(14) }]}>How are you feeling today? (1-10)</Text>
            </View>
          </View>
          
          <View style={styles.levelDisplay}>
            <View style={styles.moodDisplay}>
              {getMoodIcon(moodLevel)}
              <Text style={[styles.levelNumber, { color: '#8b5cf6', fontSize: scaleFont(48) }]}> 
                {moodLevel}
              </Text>
            </View>
            <Text style={[styles.levelLabel, { fontSize: scaleFont(16) }] }>
              {moodLevel <= 3 ? 'Low' : moodLevel <= 7 ? 'Okay' : 'Great'}
            </Text>
          </View>
          
          <View style={[styles.scaleContainer, { gap: screenWidth * 0.018 }] }>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.scaleButton,
                  { width: screenWidth * 0.12, height: screenWidth * 0.12, borderRadius: screenWidth * 0.06 },
                  moodLevel === level && [styles.scaleButtonActive, { backgroundColor: '#8b5cf6', transform: [{ scale: 1.13 }] }]
                ]}
                onPress={() => setMoodLevel(level)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.scaleButtonText,
                  { fontSize: scaleFont(16) },
                  moodLevel === level && styles.scaleButtonTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercise Notes Card */}
        <View style={[styles.card, { padding: screenWidth * 0.055, borderRadius: screenWidth * 0.045, marginBottom: screenWidth * 0.055 }] }>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { width: screenWidth * 0.13, height: screenWidth * 0.13, borderRadius: screenWidth * 0.03 }] }>
              <FileText size={scaleFont(24)} color="#10b981" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { fontSize: scaleFont(20) }]}>Exercise Notes</Text>
              <Text style={[styles.cardSubtitle, { fontSize: scaleFont(14) }]}>Document your activities and feelings</Text>
            </View>
          </View>
          <TextInput
            style={[styles.textInput, { fontSize: scaleFont(16), minHeight: scaleFont(120), padding: screenWidth * 0.04, borderRadius: screenWidth * 0.03 }]}
            placeholder="What exercises did you do today? How did your body respond? Any observations?"
            placeholderTextColor="#9ca3af"
            value={exerciseNotes}
            onChangeText={setExerciseNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={[styles.characterCount, { fontSize: scaleFont(12) }] }>
            {exerciseNotes.length} characters
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            loading && styles.submitButtonDisabled,
            { borderRadius: screenWidth * 0.045, marginTop: screenWidth * 0.02, marginBottom: screenWidth * 0.055 }
          ]}
          onPress={handleSubmitLog}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={loading ? ['#9ca3af', '#6b7280'] : ['#667eea', '#764ba2']}
            style={[styles.submitButtonGradient, { paddingVertical: screenWidth * 0.048, paddingHorizontal: screenWidth * 0.06 }]}
          >
            <Save size={scaleFont(22)} color="#ffffff" />
            <Text style={[styles.submitButtonText, { fontSize: scaleFont(18) }] }>
              {loading ? 'Saving Progress...' : 'Save Today\'s Progress'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 90,
  },
  header: {
    padding: 32,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendIcon: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '400',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '400',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  dateBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  levelDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 4,
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scaleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  scaleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  scaleButtonActive: {
    borderColor: 'transparent',
    elevation: 4,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    transform: [{ scale: 1.1 }],
  },
  scaleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6b7280',
  },
  scaleButtonTextActive: {
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    color: '#374151',
    lineHeight: 24,
    fontWeight: '400',
  },
  characterCount: {
    textAlign: 'right',
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '400',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonDisabled: {
    elevation: 2,
    shadowOpacity: 0.1,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
});