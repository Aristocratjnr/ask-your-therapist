import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface CallSession {
  id: string;
  channel_name: string;
  caller_id: string;
  callee_id: string;
  status: 'pending' | 'active' | 'ended' | 'declined' | 'missed';
  call_type: 'video' | 'audio';
  created_at: string;
  started_at?: string;
  ended_at?: string;
  caller?: {
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
  };
  callee?: {
    id: string;
    name: string;
    role: string;
    avatar_url?: string;
  };
}

export interface CallNotification {
  id: string;
  session_id: string;
  type: 'incoming_call' | 'call_ended' | 'call_declined' | 'call_missed';
  caller_name: string;
  caller_role: string;
  call_type: 'video' | 'audio';
  created_at: string;
}

interface VideoCallContextType {
  // Session Management
  currentSession: CallSession | null;
  activeSessions: CallSession[];
  callHistory: CallSession[];
  
  // Notifications
  incomingCall: CallNotification | null;
  notifications: CallNotification[];
  
  // Call Actions
  initiateCall: (calleeId: string, callType: 'video' | 'audio') => Promise<string>;
  acceptCall: (sessionId: string) => Promise<void>;
  declineCall: (sessionId: string) => Promise<void>;
  endCall: (sessionId: string) => Promise<void>;
  
  // Session Queries
  loadCallHistory: () => Promise<void>;
  getActiveSession: (userId: string) => CallSession | null;
  
  // Utilities
  generateUniqueChannelName: () => string;
  clearNotifications: () => void;
  dismissIncomingCall: () => void;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export function VideoCallProvider({ children }: { children: ReactNode }) {
  const { userProfile } = useAuth();
  const [currentSession, setCurrentSession] = useState<CallSession | null>(null);
  const [activeSessions, setActiveSessions] = useState<CallSession[]>([]);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);
  const [incomingCall, setIncomingCall] = useState<CallNotification | null>(null);
  const [notifications, setNotifications] = useState<CallNotification[]>([]);
  const subscriptionsRef = useRef<any[]>([]);

  useEffect(() => {
    if (userProfile) {
      // For simulation, we'll skip real-time subscriptions
      loadCallHistory();
    }
    
    // Cleanup subscriptions on unmount
    return () => {
      subscriptionsRef.current.forEach((subscription: any) => {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      });
      subscriptionsRef.current = [];
    };
  }, [userProfile]);

  const setupRealtimeSubscriptions = () => {
    // Temporarily disabled for simulation
    // Real implementation would set up Supabase subscriptions here
    console.log('Video call subscriptions setup (simulated)');
  };

  const handleIncomingCall = async (session: CallSession) => {
    // Create incoming call notification
    const notification: CallNotification = {
      id: `${session.id}_incoming`,
      session_id: session.id,
      type: 'incoming_call',
      caller_name: session.caller?.name || 'Unknown',
      caller_role: session.caller?.role || 'User',
      call_type: session.call_type,
      created_at: new Date().toISOString(),
    };

    setIncomingCall(notification);
    setNotifications(prev => [notification, ...prev]);

    // Auto-decline after 30 seconds
    setTimeout(() => {
      if (incomingCall?.session_id === session.id) {
        declineCall(session.id);
      }
    }, 30000);
  };

  const handleSessionUpdate = (session: CallSession) => {
    setActiveSessions(prev => 
      prev.map(s => s.id === session.id ? session : s)
    );

    if (currentSession?.id === session.id) {
      setCurrentSession(session);
    }

    if (session.status === 'ended' || session.status === 'declined') {
      setActiveSessions(prev => prev.filter(s => s.id !== session.id));
      if (currentSession?.id === session.id) {
        setCurrentSession(null);
      }
    }
  };

  const generateUniqueChannelName = (): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `call_${timestamp}_${random}`;
  };

  const initiateCall = async (calleeId: string, callType: 'video' | 'audio'): Promise<string> => {
    if (!userProfile) throw new Error('User not authenticated');

    const channelName = generateUniqueChannelName();
    
    // Create session in database
    const session: CallSession = {
      id: `session_${Date.now()}`,
      channel_name: channelName,
      caller_id: userProfile.id,
      callee_id: calleeId,
      status: 'pending',
      call_type: callType,
      created_at: new Date().toISOString(),
      caller: {
        id: userProfile.id,
        name: userProfile.name || 'Unknown',
        role: userProfile.role || 'user',
      },
    };

    setCurrentSession(session);
    setActiveSessions(prev => [...prev, session]);

    return channelName;
  };

  const acceptCall = async (sessionId: string): Promise<void> => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedSession: CallSession = {
      ...session,
      status: 'active',
      started_at: new Date().toISOString(),
    };

    setCurrentSession(updatedSession);
    setActiveSessions(prev => 
      prev.map(s => s.id === sessionId ? updatedSession : s)
    );
    
    setIncomingCall(null);
  };

  const declineCall = async (sessionId: string): Promise<void> => {
    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) return;

    const updatedSession: CallSession = {
      ...session,
      status: 'declined',
      ended_at: new Date().toISOString(),
    };

    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    setCallHistory(prev => [updatedSession, ...prev]);
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
    
    setIncomingCall(null);
  };

  const endCall = async (sessionId: string): Promise<void> => {
    const session = activeSessions.find(s => s.id === sessionId) || currentSession;
    if (!session) return;

    const updatedSession: CallSession = {
      ...session,
      status: 'ended',
      ended_at: new Date().toISOString(),
    };

    setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    setCallHistory(prev => [updatedSession, ...prev]);
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(null);
    }
  };

  const loadCallHistory = async (): Promise<void> => {
    // In a real implementation, this would fetch from Supabase
    // For simulation, we'll keep the existing history
  };

  const getActiveSession = (userId: string): CallSession | null => {
    return activeSessions.find(s => 
      (s.caller_id === userId || s.callee_id === userId) && 
      s.status === 'active'
    ) || null;
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const dismissIncomingCall = () => {
    setIncomingCall(null);
  };

  const value: VideoCallContextType = {
    currentSession,
    activeSessions,
    callHistory,
    incomingCall,
    notifications,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    loadCallHistory,
    getActiveSession,
    generateUniqueChannelName,
    clearNotifications,
    dismissIncomingCall,
  };

  return (
    <VideoCallContext.Provider value={value}>
      {children}
    </VideoCallContext.Provider>
  );
}

export function useVideoCall() {
  const context = useContext(VideoCallContext);
  if (context === undefined) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
}
