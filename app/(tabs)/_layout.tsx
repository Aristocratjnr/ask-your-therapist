import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const { userProfile, loading } = useAuth();
  
  // Don't render tabs until we know if user is authenticated and have their profile
  if (loading || !userProfile) {
    return null;
  }
  
  const isTherapist = userProfile.role === 'therapist';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#14b8a6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          minHeight: 60 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 5,
          borderTopWidth: 1,
          borderTopColor: '#e0e8f0',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        },
        tabBarItemStyle: {
          backgroundColor: 'transparent',
          paddingVertical: 8,
          minHeight: 44,
        },
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '300',
          fontFamily: 'System',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, focused }) => <MaterialIcons name="home" size={size} color={focused ? '#1f2937' : '#6b7280'} />, 
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, focused }) => <MaterialIcons name="search" size={size} color={focused ? '#1f2937' : '#6b7280'} />, 
          // Hide for therapists
          href: isTherapist ? null : undefined,
        }}
      />

      <Tabs.Screen
        name="appointments"
        options={{
          title: 'bookings',
          tabBarIcon: ({ size, focused }) => <MaterialIcons name="calendar-today" size={size} color={focused ? '#1f2937' : '#6b7280'} />, 
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarIcon: ({ size, focused }) => <MaterialIcons name="message" size={size} color={focused ? '#1f2937' : '#6b7280'} />, 
        }}
      />

      <Tabs.Screen
        name="progress-log"
        options={{
          title: 'Progress',
          tabBarIcon: ({ size, focused }) => <MaterialIcons name="favorite" size={size} color={focused ? '#1f2937' : '#6b7280'} />, 
          // Hide for therapists
          href: isTherapist ? null : undefined,
        }}
      />

      <Tabs.Screen
        name="client-management"
        options={{
          title: 'Clients',
          tabBarIcon: ({ size, focused }) => <MaterialIcons name="group" size={size} color={focused ? '#1f2937' : '#6b7280'} />, 
          // Only show for therapists
          href: isTherapist ? undefined : null,
        }}
      />

      <Tabs.Screen
        name="progress-charts"
        options={{
          tabBarIcon: ({ size, focused }) => <MaterialIcons name="insert-chart" size={size} color={focused ? '#1f2937' : '#6b7280'} />, 
          href: null,
        }}
      />

      <Tabs.Screen
        name="booking"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="therapist"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, focused }) => (
            <MaterialIcons name="person" size={size} color={focused ? '#1f2937' : '#6b7280'} />
          ),
        }}
      />
    </Tabs>
  );
}