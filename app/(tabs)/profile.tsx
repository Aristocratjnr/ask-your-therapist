import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Image, Dimensions, useWindowDimensions, PixelRatio, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
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
          colors={["#14b8a6", "#0d9488"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerBg, { paddingHorizontal: screenWidth * 0.06 }]}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              {userProfile?.photo_url ? (
                <Image
                  source={{ uri: userProfile.photo_url }}
                  style={[styles.avatarImg, { 
                    width: screenWidth * 0.28, 
                    height: screenWidth * 0.28, 
                    borderRadius: screenWidth * 0.14,
                    borderWidth: screenWidth * 0.01
                  }]}
                />
              ) : (
                <Image
                  source={{ uri: `https://randomuser.me/api/portraits/${userProfile?.name && userProfile.name.length % 2 === 0 ? 'men' : 'women'}/${(userProfile?.name?.charCodeAt(0) || 50) % 100}.jpg` }}
                  style={[styles.avatarImg, { 
                    width: screenWidth * 0.28, 
                    height: screenWidth * 0.28, 
                    borderRadius: screenWidth * 0.14,
                    borderWidth: screenWidth * 0.01
                  }]}
                />
              )}
              <View style={[styles.roleIndicator, { 
                width: screenWidth * 0.09, 
                height: screenWidth * 0.09, 
                borderRadius: screenWidth * 0.045,
                borderWidth: screenWidth * 0.008
              }]}>
                {isTherapist ? (
                  <MaterialIcons name="medical-services" size={scaleFont(16)} color="#ffffff" />
                ) : (
                  <MaterialIcons name="favorite" size={scaleFont(16)} color="#ffffff" />
                )}
              </View>
            </View>
            <Text style={[styles.userName, { fontSize: scaleFont(24) }]}>{userProfile?.name || 'User'}</Text>
            <Text style={[styles.userRole, { fontSize: scaleFont(16) }]}>
              {isTherapist ? 'Occupational Therapist' : 'Client'}
            </Text>
           
          </View>
        </LinearGradient>

        <View style={[styles.divider, { marginVertical: screenWidth * 0.06 }]} />
        
        <View style={[styles.profileSection, { paddingHorizontal: screenWidth * 0.06 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: scaleFont(18) }]}>Profile Information</Text>
            {!isEditing ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="edit" size={scaleFont(16)} color="#14b8a6" />
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
                  <MaterialIcons name="close" size={scaleFont(16)} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="save" size={scaleFont(16)} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={[styles.profileFields, { gap: screenWidth * 0.05 }]}>
            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <MaterialIcons name="person" size={scaleFont(16)} color="#64748b" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.fieldInput, { fontSize: scaleFont(16) }]}
                    value={editForm.name}
                    onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <Text style={[styles.fieldValue, { fontSize: scaleFont(16) }]}>{userProfile?.name || 'Not set'}</Text>
                )}
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <MaterialIcons name="email" size={scaleFont(16)} color="#64748b" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={[styles.fieldValue, { fontSize: scaleFont(16) }]}>{userProfile?.email}</Text>
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <MaterialIcons name="phone" size={scaleFont(16)} color="#64748b" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.fieldInput, { fontSize: scaleFont(16) }]}
                    value={editForm.phone}
                    onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={[styles.fieldValue, { fontSize: scaleFont(16) }]}>{userProfile?.phone || 'Not set'}</Text>
                )}
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldIcon}>
                <MaterialIcons name="location-on" size={scaleFont(16)} color="#64748b" />
              </View>
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Location</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.fieldInput, { fontSize: scaleFont(16) }]}
                    value={editForm.location}
                    onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                    placeholder="Enter your location"
                  />
                ) : (
                  <Text style={[styles.fieldValue, { fontSize: scaleFont(16) }]}>{userProfile?.location || 'Not set'}</Text>
                )}
              </View>
            </View>

            {isTherapist ? (
              <View style={styles.field}>
                <View style={styles.fieldIcon}>
                  <MaterialIcons name="medical-services" size={scaleFont(16)} color="#64748b" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Specialty</Text>
                  {isEditing ? (
                    <View style={[styles.selectContainer, { marginTop: screenWidth * 0.02 }]}>
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
                    <Text style={[styles.fieldValue, { fontSize: scaleFont(16) }]}>{userProfile?.specialty || 'Not set'}</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.field}>
                <View style={styles.fieldIcon}>
                  <MaterialIcons name="favorite" size={scaleFont(16)} color="#64748b" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Condition</Text>
                  {isEditing ? (
                    <View style={[styles.selectContainer, { marginTop: screenWidth * 0.02 }]}>
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
                    <Text style={[styles.fieldValue, { fontSize: scaleFont(16) }]}>{userProfile?.condition || 'Not set'}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.divider, { marginVertical: screenWidth * 0.06 }]} />
        
        <View style={[styles.actionsSection, { paddingHorizontal: screenWidth * 0.06 }]}>
          <TouchableOpacity style={[styles.actionButton, { paddingVertical: screenWidth * 0.04 }]}>
            <MaterialIcons name="settings" size={scaleFont(20)} color="#64748b" />
            <Text style={[styles.actionButtonText, { fontSize: scaleFont(16) }]}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.signOutButton, { paddingVertical: screenWidth * 0.04 }]} 
            onPress={handleSignOut}
          >
            <MaterialIcons name="logout" size={scaleFont(20)} color="#EF4444" />
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
  },
  scrollView: {
    flex: 1,
  },
  headerBg: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    marginTop: 24, // Added to move the profile image down
  },
  avatarImg: {
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
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#ffffff',
  },
  userName: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#ffffff',
    marginBottom: 4,
  },
  userRole: {
    fontWeight: '200',
    fontFamily: 'System',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  userEmail: {
    fontWeight: '200',
    fontFamily: 'System',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  profileSection: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    paddingVertical: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1e293b',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#14b8a6',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    padding: 8,
  },
  saveButton: {
    backgroundColor: '#14b8a6',
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
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1e293b',
  },
  fieldInput: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
    backgroundColor: '#14b8a6',
    borderColor: '#14b8a6',
  },
  selectOptionText: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  actionsSection: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    paddingVertical: 24,
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButtonText: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1e293b',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signOutButtonText: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#ef4444',
  },
});