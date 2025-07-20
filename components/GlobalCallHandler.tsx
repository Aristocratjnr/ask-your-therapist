import React from 'react';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useRouter } from 'expo-router';
import CallInvitation from '@/components/CallInvitation';

export default function GlobalCallHandler() {
  const { incomingCall, acceptCall, declineCall, dismissIncomingCall } = useVideoCall();
  const router = useRouter();

  const handleAcceptCall = async () => {
    if (!incomingCall) return;

    try {
      await acceptCall(incomingCall.session_id);
      
      // Navigate to video call screen
      const channelName = `call_${incomingCall.session_id}`;
      (router as any).push(
        `/video-call/${channelName}?participantName=${encodeURIComponent(incomingCall.caller_name)}&sessionId=${incomingCall.session_id}`
      );
      
      dismissIncomingCall();
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleDeclineCall = async () => {
    if (!incomingCall) return;

    try {
      await declineCall(incomingCall.session_id);
      dismissIncomingCall();
    } catch (error) {
      console.error('Failed to decline call:', error);
    }
  };

  if (!incomingCall) {
    return null;
  }

  return (
    <CallInvitation
      visible={!!incomingCall}
      callerName={incomingCall.caller_name}
      callerRole={incomingCall.caller_role}
      callType={incomingCall.call_type}
      onAccept={handleAcceptCall}
      onDecline={handleDeclineCall}
    />
  );
}
