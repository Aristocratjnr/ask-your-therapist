// Create: contexts/MessagingContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Alert } from 'react-native';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'appointment_request';
  is_system_message: boolean;
  read: boolean;
  created_at: string;
  edited_at?: string;
  sender?: any;
  receiver?: any;
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: string;
  message_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
}

interface Conversation {
  id: string;
  therapist_id: string;
  client_id: string;
  is_active: boolean;
  last_message_at: string;
  therapist?: any;
  client?: any;
  unread_count: number;
  last_message?: Message;
}

interface MessagingContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sendMessage: (conversationId: string, message: string, messageType?: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  setActiveConversation: (conversation: Conversation | null) => void;
  createConversation: (otherUserId: string) => Promise<string>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

interface MessagingProviderProps {
  children: ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      loadConversations();
      const cleanup = setupRealTimeSubscriptions();
      return cleanup;
    }
  }, [userProfile]);

  const setupRealTimeSubscriptions = () => {
    if (!userProfile) return () => {};

    // Create unique channel names to avoid conflicts
    const messageChannelName = `messages-${userProfile.id}-${Date.now()}`;
    const updateChannelName = `message-updates-${userProfile.id}-${Date.now()}`;

    // Subscribe to new messages
    const messageSubscription = supabase
      .channel(messageChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userProfile.id}`,
        },
        (payload) => {
          console.log('New message received:', payload.new);
          // Add new message to current messages if it's for the active conversation
          const newMessage = payload.new as Message;
          const conversationKey = [userProfile.id, newMessage.sender_id].sort().join('_');
          const expectedConversationId = `conv_${conversationKey}`;
          
          if (activeConversation && activeConversation.id === expectedConversationId) {
            setMessages(prev => [...prev, newMessage]);
          }
          loadConversations(); // Refresh conversations list
        }
      )
      .subscribe();

    // Subscribe to message read status updates
    const readStatusSubscription = supabase
      .channel(updateChannelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userProfile.id}`,
        },
        (payload) => {
          console.log('Message read status updated:', payload.new);
          const updatedMessage = payload.new as Message;
          
          if (activeConversation) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === updatedMessage.id ? { ...msg, read: updatedMessage.read } : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      readStatusSubscription.unsubscribe();
    };
  };

  const loadConversations = async () => {
    if (!userProfile) return;

    try {
      setLoading(true);

      // Get all messages where user is sender or receiver
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, name, photo_url, role),
          receiver:users!receiver_id(id, name, photo_url, role)
        `)
        .or(`sender_id.eq.${userProfile.id},receiver_id.eq.${userProfile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group messages by conversation partners
      const conversationsMap = new Map();
      
      (messagesData || []).forEach((message) => {
        const otherUser = message.sender_id === userProfile.id ? message.receiver : message.sender;
        const conversationKey = [userProfile.id, otherUser.id].sort().join('_');
        
        if (!conversationsMap.has(conversationKey)) {
          conversationsMap.set(conversationKey, {
            id: `conv_${conversationKey}`,
            therapist_id: otherUser.role === 'therapist' ? otherUser.id : userProfile.id,
            client_id: otherUser.role === 'client' ? otherUser.id : userProfile.id,
            therapist: otherUser.role === 'therapist' ? otherUser : { id: userProfile.id, name: userProfile.name, photo_url: userProfile.photo_url },
            client: otherUser.role === 'client' ? otherUser : { id: userProfile.id, name: userProfile.name, photo_url: userProfile.photo_url },
            is_active: true,
            last_message_at: message.created_at,
            last_message: message,
            unread_count: 0,
            messages: []
          });
        }
        
        const conversation = conversationsMap.get(conversationKey);
        conversation.messages.push(message);
        
        // Update last message if this one is more recent
        if (new Date(message.created_at) > new Date(conversation.last_message_at)) {
          conversation.last_message_at = message.created_at;
          conversation.last_message = message;
        }
        
        // Count unread messages
        if (message.receiver_id === userProfile.id && !message.read) {
          conversation.unread_count++;
        }
      });

      // Convert map to array and sort by last message time
      const conversationsArray = Array.from(conversationsMap.values())
        .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

      setConversations(conversationsArray);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);

      // Extract user IDs from conversation ID
      const conversationKey = conversationId.replace('conv_', '');
      const userIds = conversationKey.split('_');
      
      if (userIds.length !== 2) {
        throw new Error('Invalid conversation ID');
      }

      const otherUserId = userIds.find(id => id !== userProfile?.id);
      
      if (!otherUserId) {
        throw new Error('Could not find other user');
      }

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id(id, name, photo_url),
          receiver:users!receiver_id(id, name, photo_url)
        `)
        .or(`and(sender_id.eq.${userProfile?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userProfile?.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);

      // Mark unread messages as read
      const unreadMessages = data?.filter(msg => 
        msg.receiver_id === userProfile?.id && !msg.read
      );

      if (unreadMessages && unreadMessages.length > 0) {
        await Promise.all(
          unreadMessages.map(msg => markAsRead(msg.id))
        );
      }

    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (conversationId: string, message: string, messageType: string = 'text') => {
    if (!userProfile || !activeConversation) return;

    try {
      const receiverId = userProfile.id === activeConversation.therapist_id 
        ? activeConversation.client_id 
        : activeConversation.therapist_id;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: userProfile.id,
          receiver_id: receiverId,
          message: message.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local messages
      setMessages(prev => [...prev, data]);

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        )
      );

    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const createConversation = async (otherUserId: string): Promise<string> => {
    if (!userProfile) throw new Error('User not authenticated');

    try {
      // Create a deterministic conversation ID from the two user IDs (matching loadConversations format)
      const sortedIds = [userProfile.id, otherUserId].sort();
      const conversationKey = sortedIds.join('_');
      const conversationId = `conv_${conversationKey}`;

      // First, get the other user's information
      const { data: otherUserData, error: userError } = await supabase
        .from('users')
        .select('id, name, photo_url, role')
        .eq('id', otherUserId)
        .single();

      if (userError) {
        console.error('Error fetching other user:', userError);
        throw userError;
      }

      // Check if conversation already exists
      const existingConversation = conversations.find(c => c.id === conversationId);
      if (existingConversation) {
        return conversationId;
      }

      // Create a virtual conversation entry if it doesn't exist
      // This will be populated properly when the first message is sent
      const newConversation: Conversation = {
        id: conversationId,
        therapist_id: otherUserData.role === 'therapist' ? otherUserId : userProfile.id,
        client_id: otherUserData.role === 'client' ? otherUserId : userProfile.id,
        therapist: otherUserData.role === 'therapist' ? otherUserData : { 
          id: userProfile.id, 
          name: userProfile.name, 
          photo_url: userProfile.photo_url,
          role: userProfile.role 
        },
        client: otherUserData.role === 'client' ? otherUserData : { 
          id: userProfile.id, 
          name: userProfile.name, 
          photo_url: userProfile.photo_url,
          role: userProfile.role 
        },
        is_active: true,
        last_message_at: new Date().toISOString(),
        unread_count: 0
      };

      // Add to conversations list temporarily
      setConversations(prev => [newConversation, ...prev]);

      return conversationId;

    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  const value: MessagingContextType = {
    conversations,
    activeConversation,
    messages,
    loading,
    sendMessage,
    markAsRead,
    loadConversations,
    loadMessages,
    setActiveConversation,
    createConversation,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
};