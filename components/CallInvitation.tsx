import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ViewStyle,
  TextStyle,
  Animated,
  Vibration,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CallInvitationProps {
  visible: boolean;
  callerName: string;
  callerRole?: string;
  callType?: 'video' | 'audio';
  onAccept: () => void;
  onDecline: () => void;
}

export default function CallInvitation({
  visible,
  callerName,
  callerRole,
  callType = 'video',
  onAccept,
  onDecline,
}: CallInvitationProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start pulsing animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Slide in animation
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      pulse.start();

      // Vibration pattern for incoming call
      const vibrationPattern = [0, 1000, 500, 1000, 500];
      Vibration.vibrate(vibrationPattern, true);

      return () => {
        pulse.stop();
        Vibration.cancel();
      };
    } else {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleAccept = () => {
    Vibration.cancel();
    onAccept();
  };

  const handleDecline = () => {
    Vibration.cancel();
    onDecline();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [600, 0],
              })
            }]
          }
        ]}
      >
        <View style={styles.content}>
          {/* Background Pattern */}
          <View style={styles.backgroundPattern}>
            {Array.from({ length: 20 }).map((_, i) => (
              <View key={i} style={[styles.dot, { opacity: 0.1 + (i * 0.02) }]} />
            ))}
          </View>

          {/* Caller Info */}
          <View style={styles.callerInfo}>
            <Animated.View 
              style={[
                styles.avatar,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              <Text style={styles.avatarText}>
                {callerName.charAt(0).toUpperCase()}
              </Text>
            </Animated.View>
            
            <Text style={styles.callerName}>{callerName}</Text>
            
            {callerRole && (
              <Text style={styles.callerRole}>
                {callerRole === 'therapist' ? 'Therapist' : 'Client'}
              </Text>
            )}
            
            <View style={styles.callTypeContainer}>
              <Ionicons 
                name={callType === 'video' ? 'videocam' : 'call'} 
                size={20} 
                color="rgba(255, 255, 255, 0.8)" 
              />
              <Text style={styles.callLabel}>
                Incoming {callType} call
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={32} color="#fff" style={styles.declineIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={callType === 'video' ? 'videocam' : 'call'} 
                size={32} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="chatbubble" size={20} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.quickActionText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

interface Styles {
  container: ViewStyle;
  content: ViewStyle;
  callerInfo: ViewStyle;
  avatar: ViewStyle;
  avatarText: TextStyle;
  callerName: TextStyle;
  callerRole: TextStyle;
  callTypeContainer: ViewStyle;
  callLabel: TextStyle;
  actions: ViewStyle;
  actionButton: ViewStyle;
  acceptButton: ViewStyle;
  declineButton: ViewStyle;
  declineIcon: TextStyle;
  backgroundPattern: ViewStyle;
  dot: ViewStyle;
  quickActions: ViewStyle;
  quickActionButton: ViewStyle;
  quickActionText: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#10B981',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 400,
    justifyContent: 'space-between',
  },
  callerInfo: {
    alignItems: 'center',
    zIndex: 1,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  callerName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  callerRole: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  callTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  callLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#22c55e',
  },
  declineButton: {
    backgroundColor: '#ef4444',
  },
  declineIcon: {
    transform: [{ rotate: '135deg' }],
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    margin: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 1,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  quickActionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginLeft: 6,
  },
});
