import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Calendar, Heart, Brain, FileText, Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function ProgressLogScreen() {
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

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#10B981', '#0d9488']}
        style={styles.header}
      >
        <Heart size={32} color="#ffffff" />
        <Text style={styles.headerTitle}>Daily Progress Log</Text>
        <Text style={styles.headerSubtitle}>Track your recovery journey</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <TouchableOpacity style={styles.dateButton}>
            <Calendar size={20} color="#10B981" />
            <Text style={styles.dateText}>{selectedDate}</Text>
          </TouchableOpacity>
        </View>

        {/* Pain Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pain Level (1-10)</Text>
          <View style={styles.scaleContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.scaleButton,
                  painLevel === level && styles.scaleButtonActive
                ]}
                onPress={() => setPainLevel(level)}
              >
                <Text style={[
                  styles.scaleButtonText,
                  painLevel === level && styles.scaleButtonTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Mood Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mood Level (1-10)</Text>
          <View style={styles.scaleContainer}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.scaleButton,
                  moodLevel === level && styles.scaleButtonActive
                ]}
                onPress={() => setMoodLevel(level)}
              >
                <Text style={[
                  styles.scaleButtonText,
                  moodLevel === level && styles.scaleButtonTextActive
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Exercise Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercise Notes</Text>
          <TextInput
            style={styles.textInput}
            placeholder="What exercises did you do today? How did you feel?"
            value={exerciseNotes}
            onChangeText={setExerciseNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitLog}
          disabled={loading}
        >
          <LinearGradient
            colors={['#10B981', '#0d9488']}
            style={styles.submitButtonGradient}
          >
            <Save size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : 'Save Progress'}
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
    paddingBottom: 90, // Add padding for tab bar
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  scaleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scaleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  scaleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  scaleButtonTextActive: {
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  submitButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
});
