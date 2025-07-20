import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Alert 
} from 'react-native';
import { ArrowLeft, Send, Phone, Video, MoreVertical } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { useVideoCall } from '@/contexts/VideoCallContext';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams();
  const { userProfile } = useAuth();
  const { 
    messages, 
    activeConversation, 
    setActiveConversation,
    loadMessages, 
    sendMessage,
    conversations 
  } = useMessaging();
  const { initiateCall, currentSession } = useVideoCall();
  
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (conversationId) {
      initializeConversation();
    }
  }, [conversationId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const initializeConversation = async () => {
    try {
      setLoading(true);
      
      // Find the conversation
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setActiveConversation(conversation);
        await loadMessages(conversationId as string);
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
      Alert.alert('Error', 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      await sendMessage(activeConversation.id, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const startVideoCall = async () => {
    if (!otherUser) {
      Alert.alert('Error', 'Unable to start video call');
      return;
    }

    try {
      const channelName = await initiateCall(otherUser.id, 'video');
      
      // Navigate to video call screen with session info
      (router as any).push(`/video-call/${channelName}?participantName=${encodeURIComponent(otherUser.name || 'User')}&sessionId=${currentSession?.id}`);
    } catch (error) {
      console.error('Failed to start video call:', error);
      Alert.alert('Error', 'Failed to start video call');
    }
  };

  const startAudioCall = async () => {
    if (!otherUser) {
      Alert.alert('Error', 'Unable to start audio call');
      return;
    }

    try {
      const channelName = await initiateCall(otherUser.id, 'audio');
      
      // Navigate to video call screen in audio mode
      (router as any).push(`/video-call/${channelName}?participantName=${encodeURIComponent(otherUser.name || 'User')}&sessionId=${currentSession?.id}&audioOnly=true`);
    } catch (error) {
      console.error('Failed to start audio call:', error);
      Alert.alert('Error', 'Failed to start audio call');
    }
  };

  const getOtherUser = () => {
    if (!activeConversation || !userProfile) return null;
    
    const otherUser = userProfile.id === activeConversation.therapist_id 
      ? activeConversation.client 
      : activeConversation.therapist;
    
    // If other user data is missing, try to get it from recent messages
    if (!otherUser || !otherUser.name) {
      const recentMessage = messages.find(msg => 
        msg.sender_id !== userProfile.id && msg.sender
      );
      
      if (recentMessage && recentMessage.sender) {
        return recentMessage.sender;
      }
    }
    
    return otherUser;
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const otherUser = getOtherUser();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#10B981" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerName}>
              {otherUser?.name || 'User'}
            </Text>
            <Text style={styles.headerRole}>
              {otherUser?.role === 'therapist' ? 'Therapist' : 
               otherUser?.role === 'client' ? 'Client' : 
               'User'}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={startAudioCall}
          >
            <Phone size={20} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={startVideoCall}
          >
            <Video size={20} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <MoreVertical size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => {
          const isOwnMessage = message.sender_id === userProfile?.id;
          const showTime = index === 0 || 
            new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 300000; // 5 minutes

          return (
            <View key={message.id}>
              {showTime && (
                <Text style={styles.timeStamp}>
                  {formatMessageTime(message.created_at)}
                </Text>
              )}
              <View style={[
                styles.messageContainer,
                isOwnMessage ? styles.ownMessage : styles.otherMessage
              ]}>
                <Text style={[
                  styles.messageText,
                  isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                ]}>
                  {message.message}
                </Text>
                {isOwnMessage && (
                  <Text style={styles.readStatus}>
                    {message.read ? 'Read' : 'Sent'}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            newMessage.trim() && styles.sendButtonActive
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Send size={20} color={newMessage.trim() ? '#ffffff' : '#64748b'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerRole: {
    fontSize: 12,
    color: '#6b7280',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeStamp: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6b7280',
    marginVertical: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 2,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#10B981',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#1f2937',
  },
  readStatus: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#10B981',
  },
});