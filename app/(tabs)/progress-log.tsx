import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Dimensions, useWindowDimensions, PixelRatio, Platform, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
    if (level <= 3) return <MaterialIcons name="sentiment-very-dissatisfied" size={24} color="#ef4444" />;
    if (level <= 7) return <MaterialIcons name="sentiment-neutral" size={24} color="#f59e0b" />;
    return <MaterialIcons name="sentiment-very-satisfied" size={24} color="#22c55e" />;
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
      <View
        style={[styles.header, {
          backgroundColor: '#f8fafc',
          padding: screenWidth * 0.08,
          paddingTop: screenWidth * 0.18,
          borderBottomLeftRadius: screenWidth * 0.012,
          borderBottomRightRadius: screenWidth * 0.02,
        }]}
      >
        <View style={styles.headerIconContainer}>
          <MaterialIcons name="monitor-heart" size={scaleFont(28)} color="#1f2937" />
          <MaterialIcons name="trending-up" size={scaleFont(24)} color="rgba(31, 41, 55, 0.8)" style={styles.trendIcon} />
        </View>
        <Text style={[styles.headerTitle, { fontSize: scaleFont(28) }]}>Daily Progress Log</Text>
        <Text style={[styles.headerSubtitle, { fontSize: scaleFont(16) }]}>Track your healing journey</Text>
      </View>

      <View style={[styles.content, { padding: screenWidth * 0.055 }]}>
        {/* Date Selection Card */}
        <View style={[styles.card, { padding: screenWidth * 0.055, borderRadius: screenWidth * 0.045, marginBottom: screenWidth * 0.055 }]}>
          <View style={styles.cardHeader}>

            <Text style={[styles.cardTitle, { fontSize: scaleFont(20) }]}>Date</Text>
          </View>
          <TouchableOpacity style={[styles.dateButton, { padding: screenWidth * 0.04, borderRadius: screenWidth * 0.035 }]}>
            <Text style={[styles.dateText, { fontSize: scaleFont(16) }]}>{formatDate(selectedDate)}</Text>
            <View style={[styles.dateBadge, { paddingHorizontal: screenWidth * 0.03, paddingVertical: screenWidth * 0.012, borderRadius: screenWidth * 0.035 }]}>
              <Text style={[styles.dateBadgeText, { fontSize: scaleFont(12) }]}>Today</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Pain Level Card */}
        <View style={[styles.card, { padding: screenWidth * 0.055, borderRadius: screenWidth * 0.045, marginBottom: screenWidth * 0.055 }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { width: screenWidth * 0.13, height: screenWidth * 0.13, borderRadius: screenWidth * 0.03 }]}>
              <MaterialIcons name="favorite" size={scaleFont(24)} color="#ef4444" />
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
            <Text style={[styles.levelLabel, { fontSize: scaleFont(16) }]}>
              {painLevel <= 3 ? 'Mild' : painLevel <= 6 ? 'Moderate' : 'Severe'}
            </Text>
          </View>
          
          <View style={[styles.scaleContainer, { gap: screenWidth * 0.018 }]}>
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
        <View style={[styles.card, { padding: screenWidth * 0.055, borderRadius: screenWidth * 0.045, marginBottom: screenWidth * 0.055 }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { width: screenWidth * 0.13, height: screenWidth * 0.13, borderRadius: screenWidth * 0.03 }]}>
              <MaterialIcons name="psychology" size={scaleFont(24)} color="#8b5cf6" />
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
            <Text style={[styles.levelLabel, { fontSize: scaleFont(16) }]}>
              {moodLevel <= 3 ? 'Low' : moodLevel <= 7 ? 'Okay' : 'Great'}
            </Text>
          </View>
          
          <View style={[styles.scaleContainer, { gap: screenWidth * 0.018 }]}>
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
        <View style={[styles.card, { padding: screenWidth * 0.055, borderRadius: screenWidth * 0.045, marginBottom: screenWidth * 0.055 }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { width: screenWidth * 0.13, height: screenWidth * 0.13, borderRadius: screenWidth * 0.03 }]}>
              <MaterialIcons name="notes" size={scaleFont(24)} color="#10b981" />
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
          <Text style={[styles.characterCount, { fontSize: scaleFont(12) }]}>
            {exerciseNotes.length} characters
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.bookButton,
            styles.bookButtonSolid,
            loading && styles.submitButtonDisabled,
            { borderRadius: screenWidth * 0.045, marginTop: screenWidth * 0.02, marginBottom: screenWidth * 0.055 }
          ]}
          onPress={handleSubmitLog}
          disabled={loading}
          activeOpacity={0.8}
        >
          <MaterialIcons name="save" size={scaleFont(20)} color="#14b8a6" />
          <Text style={styles.bookButtonText}>
            {loading ? 'Saving Progress...' : 'Save Today\'s Progress'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
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
    fontWeight: '400',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'System',
  },
  headerSubtitle: {
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '300',
    fontFamily: 'System',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontWeight: '400',
    color: '#1f2937',
    marginBottom: 2,
    fontFamily: 'System',
  },
  cardSubtitle: {
    color: '#6b7280',
    fontWeight: '300',
    fontFamily: 'System',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateText: {
    color: '#374151',
    fontWeight: '300',
    flex: 1,
    fontFamily: 'System',
  },
  dateBadge: {
    backgroundColor: '#14b8a6',
  },
  dateBadgeText: {
    color: '#ffffff',
    fontWeight: '400',
    fontFamily: 'System',
  },
  levelDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  levelNumber: {
    fontWeight: '300',
    marginBottom: 4,
    fontFamily: 'System',
  },
  levelLabel: {
    fontWeight: '300',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'System',
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
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
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
  },
  scaleButtonText: {
    fontWeight: '300',
    color: '#6b7280',
    fontFamily: 'System',
  },
  scaleButtonTextActive: {
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#374151',
    lineHeight: 24,
    fontWeight: '300',
    fontFamily: 'System',
  },
  characterCount: {
    textAlign: 'right',
    color: '#9ca3af',
    fontWeight: '300',
    fontFamily: 'System',
  },
  submitButton: {
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#14b8a6',
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
  },
  submitButtonText: {
    fontWeight: '300',
    color: '#ffffff',
    marginLeft: 12,
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  // Add styles from search.tsx for bookButton, bookButtonSolid, and bookButtonText
  bookButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonSolid: {
    backgroundColor: 'rgba(20,184,166,0.12)',
    borderWidth: 1,
    borderColor: '#14b8a6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
    marginLeft: 8,
  },
});