import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CircleCheck as CheckCircle, Camera, MapPin, User, Briefcase, Heart, ChevronDown, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

// Predefined condition options for clients
const CONDITIONS = [
  'Stroke Recovery',
  'Autism Spectrum Disorder',
  'Hand/Wrist Injury',
  'Developmental Delays',
  'Sensory Processing Disorder',
  'Cerebral Palsy',
  'Traumatic Brain Injury',
  'Arthritis',
  'Spinal Cord Injury',
  'Mental Health Conditions',
  'Geriatric Care Needs',
  'Post-Surgery Rehabilitation',
  'Other (Please specify)'
];

// Predefined specialty options for therapists
const SPECIALTIES = [
  'Stroke Recovery',
  'Autism Support',
  'Hand Therapy',
  'Pediatric OT',
  'Geriatric Care',
  'Mental Health',
  'Physical Rehabilitation',
  'Cognitive Therapy',
  'Sensory Integration',
  'Neurological Rehabilitation',
  'Work Hardening',
  'Home Health',
  'School-Based OT',
  'Other (Please specify)'
];

type ProfileData = {
  photo_url: string | null;
  location: string;
  condition?: string;
  customCondition?: string;
  bio?: string;
  specialties?: string[];
  customSpecialty?: string;
  credentials?: string;
  experience_years?: number;
  hourly_rate?: string;
};

export default function SetupProfileScreen() {
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get params passed from verification
  const params = useLocalSearchParams();
  const { 
    email: paramEmail, 
    name: paramName, 
    role: paramRole, 
    phone: paramPhone, 
    userId: paramUserId, 
    fromVerification 
  } = params;
  
  // Use params data directly (no auth session needed)
  const currentUser = {
    id: paramUserId as string,
    email: paramEmail as string,
    name: paramName as string,
    role: paramRole as 'client' | 'therapist',
    phone: paramPhone as string,
  };

  // State for dropdowns and form data
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    photo_url: null,
    location: '',
    condition: '',
    customCondition: '',
    bio: '',
    specialties: [],
    customSpecialty: '',
    credentials: '',
    experience_years: 0,
    hourly_rate: '',
  });

  useEffect(() => {
    console.log('🎯 Setup Profile Debug Info:');
    console.log('  - From Verification:', fromVerification);
    console.log('  - Current User:', currentUser);
    console.log('  - Has all required data:', !!(paramEmail && paramName && paramRole && paramUserId));
  }, [paramEmail, paramName, paramRole, paramUserId]);

  // Validate we have all required data
  if (!paramEmail || !paramName || !paramRole || !paramUserId) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.stepTitle}>Setup Error</Text>
        <Text style={styles.stepSubtitle}>Missing signup data. Please start over.</Text>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => router.replace('/(auth)/sign-up')}
        >
          <Text style={styles.nextButtonText}>Start Over</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use currentUser for role checking
  const userRole = currentUser.role;
  const totalSteps = userRole === 'client' ? 3 : 4;

  // Validation function
  const validateCurrentStep = (): boolean => {
    console.log('🔍 Validating step:', step, 'for role:', currentUser.role);
    
    switch (step) {
      case 1:
        return !!profileData.location.trim();
      case 2:
        if (currentUser.role === 'client') {
          console.log('✅ Client validation - condition:', profileData.condition);
          return !!profileData.condition && 
                 (profileData.condition !== 'Other (Please specify)' || !!profileData.customCondition?.trim());
        } else if (currentUser.role === 'therapist') {
          console.log('✅ Therapist validation - bio:', profileData.bio);
          return !!profileData.bio?.trim();
        } else {
          console.log('❌ Unknown role - defaulting to false');
          return false;
        }
      case 3:
        if (currentUser.role === 'client') {
          return true; // Photo is optional for clients
        } else if (currentUser.role === 'therapist') {
          return (profileData.specialties && profileData.specialties.length > 0) ||
                 !!profileData.customSpecialty?.trim();
        } else {
          return false;
        }
      case 4:
        if (currentUser.role === 'therapist') {
          return !!profileData.credentials?.trim() && 
                 !!profileData.experience_years && 
                 profileData.experience_years > 0;
        } else {
          return false;
        }
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      console.log('📸 Starting image upload for URI:', uri);
      
      // Create a unique filename
      const fileName = `profile_${currentUser?.id}_${Date.now()}.jpg`;
      
      // Convert URI to blob for proper upload
      const response = await fetch(uri);
      const blob = await response.blob();
      
      console.log('📸 Image converted to blob, size:', blob.size);
      
      // Upload to Supabase Storage using blob (not FormData)
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false // Don't overwrite existing files
        });

      if (error) {
        console.error('📸 Storage upload error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Bucket not found')) {
          console.warn('⚠️ Storage bucket "profile-pictures" does not exist');
          Alert.alert(
            'Upload Unavailable',
            'Photo upload is temporarily unavailable. Your profile will be saved without a photo.',
            [{ text: 'OK' }]
          );
          return null;
        }
        
        if (error.message.includes('row-level security policy') || error.message.includes('Unauthorized')) {
          console.warn('⚠️ Storage bucket has restrictive RLS policies');
          Alert.alert(
            'Upload Permission Issue',
            'Photo upload is currently restricted. Your profile will be saved without a photo.',
            [{ text: 'OK' }]
          );
          return null;
        }
        
        throw error;
      }

      console.log('✅ Image uploaded successfully:', data.path);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(data.path);

      console.log('✅ Public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('💥 Image upload error:', error);
      
      // Don't fail the entire profile setup for image upload issues
      Alert.alert(
        'Photo Upload Failed',
        'Your profile photo could not be uploaded, but your profile will still be saved. You can add a photo later from your profile settings.',
        [{ text: 'Continue' }]
      );
      
      return null;
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    if (specialty === 'Other (Please specify)') {
      setShowSpecialtyDropdown(false);
      return;
    }

    setProfileData(prev => {
      const currentSpecialties = prev.specialties || [];
      const isSelected = currentSpecialties.includes(specialty);
      
      const newSpecialties = isSelected
        ? currentSpecialties.filter(s => s !== specialty)
        : [...currentSpecialties, specialty];
      
      return { ...prev, specialties: newSpecialties };
    });
  };

  const pickImage = async () => {
    try {
      // Request permission to access photo library
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to add a profile picture.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker - compatible with all versions
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images', // Simple string approach
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        console.log('📸 Image selected:', imageUri);
        setProfileData(prev => ({ ...prev, photo_url: imageUri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Enhanced completion handler with detailed debugging
  const handleComplete = async () => {
    console.log('🚀 === PROFILE SETUP COMPLETION STARTED ===');
    console.log('📊 Initial State:', {
      step: step,
      totalSteps: totalSteps,
      userRole: currentUser.role,
      userId: currentUser.id,
      userEmail: currentUser.email,
      userName: currentUser.name,
      fromVerification: fromVerification
    });
    
    setIsLoading(true);
    
    try {
      let uploadedPhotoUrl = null;

      // STEP 1: Handle photo upload if provided
      if (profileData.photo_url) {
        console.log('📸 === PHOTO UPLOAD SECTION ===');
        console.log('📸 Photo URI provided:', profileData.photo_url);
        console.log('📸 Attempting to upload profile photo...');
        
        try {
          uploadedPhotoUrl = await uploadImage(profileData.photo_url);
          
          if (uploadedPhotoUrl) {
            console.log('✅ Photo uploaded successfully:', uploadedPhotoUrl);
          } else {
            console.log('⚠️ Photo upload returned null, continuing without photo');
          }
        } catch (uploadError) {
          console.error('📸 Photo upload failed, but continuing with profile setup:', uploadError);
          console.error('📸 Upload error details:', JSON.stringify(uploadError, null, 2));
          // Continue without photo - don't fail the entire setup
        }
      } else {
        console.log('📸 No photo provided, skipping upload');
      }

      // STEP 2: Prepare user update data
      console.log('💾 === DATABASE UPDATE SECTION ===');
      console.log('💾 Preparing user update data...');
      
      const userUpdateData: any = {
        location: profileData.location,
        photo_url: uploadedPhotoUrl, // Will be null if upload failed/skipped
        updated_at: new Date().toISOString(), // Add timestamp
      };

      // Add role-specific data
      if (currentUser.role === 'client') {
        console.log('👤 Client role detected, adding condition data');
        userUpdateData.condition = profileData.condition === 'Other (Please specify)' 
          ? profileData.customCondition 
          : profileData.condition;
        
        console.log('👤 Client condition:', userUpdateData.condition);
      }

      console.log('💾 Final user update data:', JSON.stringify(userUpdateData, null, 2));
      console.log('💾 Target user ID:', currentUser.id);

      // STEP 3: Check if user exists before update
      console.log('🔍 === USER EXISTENCE CHECK ===');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      console.log('🔍 User existence check result:', {
        userExists: !!existingUser,
        userData: existingUser ? {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          created_at: existingUser.created_at
        } : null,
        checkError: checkError
      });

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking user existence:', checkError);
        throw new Error(`User existence check failed: ${checkError.message}`);
      }

      // STEP 4: Update or create user record
      if (!existingUser) {
        console.log('🔧 === USER CREATION (FALLBACK) ===');
        console.log('🔧 User record not found, creating new record...');
        
        const newUserData = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          role: currentUser.role,
          phone: currentUser.phone,
          ...userUpdateData,
          created_at: new Date().toISOString(),
        };
        
        console.log('🔧 Creating user with data:', JSON.stringify(newUserData, null, 2));
        
        const { data: createResult, error: createError } = await supabase
          .from('users')
          .insert(newUserData)
          .select();

        console.log('🔧 User creation result:', {
          success: !createError,
          data: createResult,
          error: createError
        });

        if (createError) {
          console.error('❌ User creation failed:', createError);
          throw new Error(`User creation failed: ${createError.message}`);
        }
        
        console.log('✅ User record created successfully');
        
      } else {
        console.log('📝 === USER UPDATE ===');
        console.log('📝 User exists, updating record...');
        console.log('📝 Updating user profile in database...');
        
        const { data: updateResult, error: userError } = await supabase
          .from('users')
          .update(userUpdateData)
          .eq('id', currentUser.id)
          .select();

        console.log('📝 User update result:', {
          success: !userError,
          data: updateResult,
          error: userError,
          affectedRows: updateResult?.length || 0
        });

        if (userError) {
          console.error('❌ User update error:', userError);
          console.error('❌ Update error details:', JSON.stringify(userError, null, 2));
          throw userError;
        }
        
        console.log('✅ User profile updated successfully');
      }

      // STEP 5: Create therapist profile if user is a therapist
      if (currentUser.role === 'therapist') {
        console.log('👩‍⚕️ === THERAPIST PROFILE CREATION ===');
        console.log('👩‍⚕️ Creating therapist profile...');
        
        const specialties = profileData.specialties || [];
        if (profileData.customSpecialty?.trim()) {
          specialties.push(profileData.customSpecialty);
          console.log('👩‍⚕️ Added custom specialty:', profileData.customSpecialty);
        }

        const therapistData = {
          user_id: currentUser.id,
          bio: profileData.bio || '',
          specialties: specialties,
          credentials: profileData.credentials || '',
          experience_years: profileData.experience_years || 0,
          hourly_rate: profileData.hourly_rate ? parseFloat(profileData.hourly_rate) : null,
          is_approved: false, // Requires admin approval
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        console.log('👩‍⚕️ Therapist profile data:', JSON.stringify(therapistData, null, 2));

        const { data: therapistResult, error: therapistError } = await supabase
          .from('therapist_profiles')
          .insert(therapistData)
          .select();

        console.log('👩‍⚕️ Therapist profile creation result:', {
          success: !therapistError,
          data: therapistResult,
          error: therapistError
        });

        if (therapistError) {
          console.error('❌ Therapist profile error:', therapistError);
          console.error('❌ Therapist error details:', JSON.stringify(therapistError, null, 2));
          throw therapistError;
        }
        
        console.log('✅ Therapist profile created successfully');
      }

      // STEP 6: Final verification
      console.log('🔍 === FINAL VERIFICATION ===');
      const { data: finalUserCheck, error: finalCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      console.log('🔍 Final user data verification:', {
        userFound: !!finalUserCheck,
        hasLocation: !!finalUserCheck?.location,
        hasCondition: currentUser.role === 'client' ? !!finalUserCheck?.condition : 'N/A',
        hasPhotoUrl: !!finalUserCheck?.photo_url,
        error: finalCheckError
      });

      // Profile complete - redirect to sign-in
      console.log('🎉 === PROFILE SETUP COMPLETED SUCCESSFULLY ===');
      console.log('🎉 Profile setup complete!');
      console.log('🎉 User role:', currentUser.role);
      console.log('🎉 Redirecting to sign-in page...');
      
      Alert.alert(
        'Profile Completed!',
        currentUser.role === 'therapist' 
          ? 'Your therapist profile has been created and is pending approval. Please sign in to access your account.' 
          : 'Your profile is ready! Please sign in to access your account.',
        [
          {
            text: 'Sign In',
            onPress: () => {
              console.log('🔄 Navigating to sign-in with params:', {
                email: currentUser.email,
                profileComplete: 'true'
              });
              
              router.replace({
                pathname: '/(auth)/sign-in',
                params: {
                  email: currentUser.email,
                  profileComplete: 'true'
                }
              });
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('💥 === PROFILE COMPLETION ERROR ===');
      console.error('💥 Profile completion error:', error);
      console.error('💥 Error message:', error.message);
      console.error('💥 Error stack:', error.stack);
      console.error('💥 Full error object:', JSON.stringify(error, null, 2));
      
      // Show specific error messages
      let errorMessage = 'Failed to complete profile setup. Please try again.';
      
      if (error.message?.includes('duplicate key')) {
        errorMessage = 'Profile already exists. Please sign in instead.';
        console.log('🔄 Duplicate key error - redirecting to sign-in');
      } else if (error.message?.includes('not found')) {
        errorMessage = 'User account not found. Please start over.';
        console.log('🔄 User not found error - need to restart signup');
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please check your account settings.';
        console.log('🔄 Permission error - RLS policy issue');
      } else if (error.message?.includes('violates')) {
        errorMessage = 'Data validation error. Please check your input and try again.';
        console.log('🔄 Data validation error - constraint violation');
      }
      
      console.error('💥 Showing error to user:', errorMessage);
      Alert.alert('Setup Error', errorMessage);
      
    } finally {
      console.log('🏁 === PROFILE SETUP PROCESS ENDED ===');
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    console.log('🎨 Rendering step:', step, 'for role:', currentUser.role);
    
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <MapPin size={32} color="#10B981" />
              <Text style={styles.stepTitle}>Where are you located?</Text>
              <Text style={styles.stepSubtitle}>
                This helps us connect you with nearby {currentUser.role === 'client' ? 'therapists' : 'clients'}.
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., New York, NY"
                value={profileData.location}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, location: text }))}
              />
            </View>
          </View>
        );

      case 2:
        if (currentUser.role === 'client') {
          // CLIENT FLOW - Condition Selection
          return (
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Heart size={32} color="#10B981" />
                <Text style={styles.stepTitle}>What brings you here?</Text>
                <Text style={styles.stepSubtitle}>
                  Tell us about your condition so we can match you with the right therapist.
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Condition/Need *</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowConditionDropdown(!showConditionDropdown)}
                >
                  <Text style={[styles.dropdownText, !profileData.condition && styles.placeholderText]}>
                    {profileData.condition || 'Select your condition'}
                  </Text>
                  <ChevronDown size={20} color="#64748b" />
                </TouchableOpacity>

                {showConditionDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll}>
                      {CONDITIONS.map((condition) => (
                        <TouchableOpacity
                          key={condition}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setProfileData(prev => ({ ...prev, condition }));
                            setShowConditionDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{condition}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {profileData.condition === 'Other (Please specify)' && (
                  <TextInput
                    style={[styles.input, { marginTop: 12 }]}
                    placeholder="Please specify your condition"
                    value={profileData.customCondition}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, customCondition: text }))}
                    multiline
                  />
                )}
              </View>
            </View>
          );
        } else if (currentUser.role === 'therapist') {
          // THERAPIST FLOW - Bio
          return (
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <User size={32} color="#10B981" />
                <Text style={styles.stepTitle}>Tell us about yourself</Text>
                <Text style={styles.stepSubtitle}>
                  Share your professional background and approach to therapy.
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Professional Bio *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe your experience, approach, and what makes you unique as a therapist..."
                  value={profileData.bio}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
                  multiline
                  numberOfLines={6}
                />
              </View>
            </View>
          );
        } else {
          // FALLBACK - Unknown role
          return (
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>Loading...</Text>
                <Text style={styles.stepSubtitle}>
                  Setting up your profile...
                </Text>
              </View>
            </View>
          );
        }

      case 3:
        if (currentUser.role === 'client') {
          // CLIENT STEP 3 - Photo Upload
          return (
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Camera size={32} color="#10B981" />
                <Text style={styles.stepTitle}>Add a profile picture</Text>
                <Text style={styles.stepSubtitle}>
                  Help therapists recognize you (optional).
                </Text>
              </View>

              <View style={styles.photoSection}>
                <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                  {profileData.photo_url ? (
                    <Image source={{ uri: profileData.photo_url }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Camera size={32} color="#64748b" />
                      <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        } else {
          // THERAPIST STEP 3 - Specialties
          return (
            <View style={styles.stepContent}>
              <View style={styles.stepHeader}>
                <Briefcase size={32} color="#10B981" />
                <Text style={styles.stepTitle}>Your specialties</Text>
                <Text style={styles.stepSubtitle}>
                  Select the areas you specialize in (choose multiple).
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Specialties *</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowSpecialtyDropdown(!showSpecialtyDropdown)}
                >
                  <Text style={styles.dropdownText}>
                    {profileData.specialties && profileData.specialties.length > 0
                      ? `${profileData.specialties.length} selected`
                      : 'Select specialties'}
                  </Text>
                  <ChevronDown size={20} color="#64748b" />
                </TouchableOpacity>

                {showSpecialtyDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll}>
                      {SPECIALTIES.map((specialty) => (
                        <TouchableOpacity
                          key={specialty}
                          style={[
                            styles.dropdownItem,
                            profileData.specialties?.includes(specialty) && styles.selectedDropdownItem
                          ]}
                          onPress={() => handleSpecialtyToggle(specialty)}
                        >
                          <Text style={[
                            styles.dropdownItemText,
                            profileData.specialties?.includes(specialty) && styles.selectedDropdownItemText
                          ]}>
                            {specialty}
                          </Text>
                          {profileData.specialties?.includes(specialty) && (
                            <CheckCircle size={16} color="#10B981" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Show selected specialties as tags */}
                {profileData.specialties && profileData.specialties.length > 0 && (
                  <View style={styles.selectedSpecialties}>
                    {profileData.specialties.map((specialty) => (
                      <View key={specialty} style={styles.specialtyTag}>
                        <Text style={styles.specialtyTagText}>{specialty}</Text>
                        <TouchableOpacity 
                          onPress={() => handleSpecialtyToggle(specialty)}
                        >
                          <Text style={styles.removeTag}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Custom specialty input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Custom Specialty (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Add a specialty not listed above"
                    value={profileData.customSpecialty}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, customSpecialty: text }))}
                  />
                </View>
              </View>
            </View>
          );
        }

      case 4:
        // THERAPIST STEP 4 - Professional Details
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Briefcase size={32} color="#10B981" />
              <Text style={styles.stepTitle}>Professional details</Text>
              <Text style={styles.stepSubtitle}>
                Complete your professional profile.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Credentials *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., OTR/L, MS, PhD"
                  value={profileData.credentials}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, credentials: text }))}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Years of Experience *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 5"
                  value={profileData.experience_years?.toString()}
                  onChangeText={(text) => setProfileData(prev => ({ 
                    ...prev, 
                    experience_years: parseInt(text) || 0 
                  }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Hourly Rate (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 150"
                  value={profileData.hourly_rate}
                  onChangeText={(text) => setProfileData(prev => ({ ...prev, hourly_rate: text }))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.photoSection}>
                <Text style={styles.label}>Profile Picture (Optional)</Text>
                <TouchableOpacity style={styles.photoContainer} onPress={pickImage}>
                  {profileData.photo_url ? (
                    <Image source={{ uri: profileData.photo_url }} style={styles.profileImage} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Camera size={32} color="#64748b" />
                      <Text style={styles.photoPlaceholderText}>Add photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Step {step} of {totalSteps}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
            </View>
          </View>

          {renderStepContent()}

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            {step > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.nextButton,
                !validateCurrentStep() && styles.disabledButton,
                step === 1 && styles.fullWidthButton
              ]}
              onPress={handleNext}
              disabled={!validateCurrentStep() || isLoading}
            >
              <Text style={styles.nextButtonText}>
                {isLoading 
                  ? 'Saving...' 
                  : step === totalSteps
                    ? 'Complete Setup' 
                    : 'Next'
                }
              </Text>
              {!isLoading && step < totalSteps && (
                <ChevronRight size={20} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  progressContainer: {
    marginBottom: 32,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  stepContent: {
    marginBottom: 32,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    flex: 1,
  },
  placeholderText: {
    color: '#94a3b8',
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDropdownItem: {
    backgroundColor: '#f0fdfa',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    flex: 1,
  },
  selectedDropdownItemText: {
    color: '#10B981',
    fontFamily: 'Inter-Medium',
  },
  selectedSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  specialtyTag: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specialtyTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#ffffff',
  },
  removeTag: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  photoSection: {
    alignItems: 'center',
    gap: 16,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
    marginTop: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidthButton: {
    flex: 2,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
