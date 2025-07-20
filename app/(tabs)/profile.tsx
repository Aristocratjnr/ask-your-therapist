import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image, Dimensions, useWindowDimensions, PixelRatio, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, LogOut, CreditCard as Edit, Save, X, Heart, Stethoscope, MapPin, Phone, Mail } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scaleFont = (size: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Platform.OS === 'ios' ? Math.round(PixelRatio.roundToNearestPixel(newSize)) : Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

export default function ProfileScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { userProfile, signOut, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    location: userProfile?.location || '',
    condition: userProfile?.condition || '',
    specialty: userProfile?.specialty || '',
  });

  const isTherapist = userProfile?.role === 'therapist';

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editForm);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/welcome');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        },
      ]
    );
  };

  const conditions = [
    'Stroke Recovery',
    'Autism Spectrum',
    'Hand Injury',
    'Brain Injury',
    'Spinal Cord Injury',
    'Arthritis',
    'Multiple Sclerosis',
    'Parkinson\'s Disease',
    'Other',
  ];

  const specialties = [
    'Stroke Recovery',
    'Autism Support',
    'Hand Therapy',
    'Pediatric OT',
    'Geriatric Care',
    'Mental Health',
    'Physical Rehabilitation',
    'Cognitive Therapy',
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#10B981", "#059669"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerBg, { paddingHorizontal: screenWidth * 0.06 }]}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              {userProfile?.photo_url ? (
                <Image
                  source={{ uri: userProfile.photo_url }}
                  style={[styles.avatarImg, { width: screenWidth * 0.28, height: screenWidth * 0.28, borderRadius: (screenWidth * 0.28) / 2 }]}
                />
              ) : (
                <Image
                  source={{ uri: `https://randomuser.me/api/portraits/${userProfile?.name && userProfile.name.length % 2 === 0 ? 'men' : 'women'}/${(userProfile?.name?.charCodeAt(0) || 50) % 100}.jpg` }}
                  style={[styles.avatarImg, { width: screenWidth * 0.28, height: screenWidth * 0.28, borderRadius: (screenWidth * 0.28) / 2 }]}
                />
              )}
              <View style={[styles.roleIndicator, { width: screenWidth * 0.09, height: screenWidth * 0.09, borderRadius: (screenWidth * 0.09) / 2 }] }>
                {isTherapist ? (
                  <Stethoscope size={scaleFont(16)} color="#ffffff" />
                ) : (
                  <Heart size={scaleFont(16)} color="#ffffff" />
                )}
              </View>
            </View>
            <Text style={[styles.userName, { fontSize: scaleFont(24) }]}>{userProfile?.name || 'User'}</Text>
            <Text style={[styles.userRole, { fontSize: scaleFont(16) }] }>
              {isTherapist ? 'Occupational Therapist' : 'Client'}
            </Text>
            <Text style={[styles.userEmail, { fontSize: scaleFont(14) }]}>{userProfile?.email}</Text>
          </View>
        </LinearGradient>

        <View style={styles.divider} />
        <View style={[styles.profileSection, { paddingHorizontal: screenWidth * 0.06 }] }>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: scaleFont(18) }]}>Profile Information</Text>
            {!isEditing ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.7}
              >
                <Edit size={scaleFont(16)} color="#10B981" />
                <Text style={[styles.editButtonText, { fontSize: scaleFont(14) }]}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsEditing(false);
                    setEditForm({
                      name: userProfile?.name || '',
                      phone: userProfile?.phone || '',
                      location: userProfile?.location || '',
                      condition: userProfile?.condition || '',
                      specialty: userProfile?.specialty || '',
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <X size={scaleFont(16)} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  activeOpacity={0.7}
                >
                  <Save size={scaleFont(16)} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.profileFields}>
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <User size={scaleFont(16)} color="#64748b" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={editForm.name}
                    onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{userProfile?.name || 'Not set'}</Text>
                )}
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Mail size={scaleFont(16)} color="#64748b" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.fieldValue}>{userProfile?.email}</Text>
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <Phone size={scaleFont(16)} color="#64748b" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={editForm.phone}
                    onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{userProfile?.phone || 'Not set'}</Text>
                )}
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <MapPin size={scaleFont(16)} color="#64748b" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Location</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.fieldInput}
                    value={editForm.location}
                    onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                    placeholder="Enter your location"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{userProfile?.location || 'Not set'}</Text>
                )}
              </View>
            </View>

            {isTherapist ? (
              <View style={styles.field}>
                <View style={styles.fieldIcon}>
                  <Stethoscope size={scaleFont(16)} color="#64748b" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Specialty</Text>
                  {isEditing ? (
                    <View style={styles.selectContainer}>
                      {specialties.map((specialty) => (
                        <TouchableOpacity
                          key={specialty}
                          style={[
                            styles.selectOption,
                            editForm.specialty === specialty && styles.selectedOption
                          ]}
                          onPress={() => setEditForm({ ...editForm, specialty })}
                        >
                          <Text style={[
                            styles.selectOptionText,
                            editForm.specialty === specialty && styles.selectedOptionText
                          ]}>
                            {specialty}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.fieldValue}>{userProfile?.specialty || 'Not set'}</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.field}>
                <View style={styles.fieldIcon}>
                  <Heart size={scaleFont(16)} color="#64748b" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Condition</Text>
                  {isEditing ? (
                    <View style={styles.selectContainer}>
                      {conditions.map((condition) => (
                        <TouchableOpacity
                          key={condition}
                          style={[
                            styles.selectOption,
                            editForm.condition === condition && styles.selectedOption
                          ]}
                          onPress={() => setEditForm({ ...editForm, condition })}
                        >
                          <Text style={[
                            styles.selectOptionText,
                            editForm.condition === condition && styles.selectedOptionText
                          ]}>
                            {condition}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.fieldValue}>{userProfile?.condition || 'Not set'}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.divider} />
        <View style={[styles.actionsSection, { paddingHorizontal: screenWidth * 0.06 }] }>
          <TouchableOpacity style={styles.actionButton}>
            <Settings size={scaleFont(20)} color="#64748b" />
            <Text style={[styles.actionButtonText, { fontSize: scaleFont(16) }]}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={scaleFont(20)} color="#EF4444" />
            <Text style={[styles.signOutButtonText, { fontSize: scaleFont(16) }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 90, // Add padding for tab bar
  },
  scrollView: {
    flex: 1,
  },
  headerBg: {
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roleIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
  },
  profileSection: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 24,
    marginHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 8,
  },
  profileFields: {
    gap: 20,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fieldIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  fieldInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectOption: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedOption: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  selectOptionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  actionsSection: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  signOutButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#EF4444',
  },
});
