import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  Image,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { MessageCircle, Search, User, Clock, Plus, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { router } from 'expo-router';

interface ConversationUser {
  id: string;
  name: string;
  photo_url?: string;
  role: 'client' | 'therapist';
}

interface LastMessage {
  id: string;
  message: string;
  created_at: string;
}

interface ConversationData {
  id: string;
  therapist_id: string;
  client_id: string;
  last_message_at: string;
  unread_count: number;
  last_message?: LastMessage;
  therapist?: ConversationUser;
  client?: ConversationUser;
}

export default function MessagesScreen() {
  const { userProfile } = useAuth();
  const { 
    conversations, 
    loading, 
    loadConversations,
    createConversation 
  } = useMessaging();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (userProfile) {
      loadConversations();
    }
  }, [userProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).toLowerCase();
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleOpenConversation = (conversation: ConversationData) => {
    router.push({
      pathname: '/chat/[conversationId]',
      params: { conversationId: conversation.id }
    });
  };

  const handleNewMessage = () => {
    if (userProfile?.role === 'therapist') {
      router.push('/client-selection');
    } else {
      router.push('/therapist-selection');
    }
  };

  const getOtherUser = (conversation: ConversationData): ConversationUser | undefined => {
    const otherUser = userProfile?.id === conversation.therapist_id 
      ? conversation.client 
      : conversation.therapist;
    
    if (!otherUser || !otherUser.name) {
      return {
        id: userProfile?.id === conversation.therapist_id ? conversation.client_id : conversation.therapist_id,
        name: 'User',
        role: userProfile?.id === conversation.therapist_id ? 'client' : 'therapist'
      };
    }
    
    return otherUser;
  };

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading your messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with solid background */}
      <View style={styles.headerSolid}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
            style={styles.profileImage}
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>
            {userProfile?.role === 'therapist' 
              ? 'Connect with your clients' 
              : 'Chat with your therapists'
            }
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Conversations List */}
      <ScrollView
        style={styles.conversationsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#10B981']} 
            tintColor="#10B981"
          />
        }
      >
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MessageCircle size={48} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyDescription}>
              {userProfile?.role === 'therapist' 
                ? 'When clients message you, conversations will appear here.' 
                : 'Start a conversation with your therapist to get support.'}
            </Text>
            <TouchableOpacity 
              style={styles.startConversationButton}
              onPress={handleNewMessage}
            >
              <Text style={styles.startConversationButtonText}>
                {userProfile?.role === 'therapist' 
                  ? 'Message a Client' 
                  : 'Find a Therapist'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.conversationsContainer}>
            {conversations.map((conversation) => {
              const otherUser = getOtherUser(conversation);
              const lastMessageTime = conversation.last_message 
                ? formatTime(conversation.last_message.created_at)
                : formatTime(conversation.last_message_at);
              
              const isUnread = conversation.unread_count > 0;

              return (
                <TouchableOpacity
                  key={conversation.id}
                  style={[
                    styles.conversationCard,
                    isUnread && styles.unreadConversationCard
                  ]}
                  onPress={() => handleOpenConversation(conversation)}
                  activeOpacity={0.95}
                >
                  {otherUser?.photo_url ? (
                    <Image 
                      source={{ uri: otherUser.photo_url }} 
                      style={styles.avatarImage} 
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>
                        {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}

                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <View>
                        <Text style={styles.userName}>{otherUser?.name || 'User'}</Text>
                        <Text style={styles.userRole}>
                          {otherUser?.role === 'therapist' ? 'Therapist' : 'Client'}
                        </Text>
                      </View>
                      <Text style={[
                        styles.timestamp,
                        isUnread && styles.unreadTimestamp
                      ]}>
                        {lastMessageTime}
                      </Text>
                    </View>

                    <View style={styles.conversationFooter}>
                      <Text 
                        style={[
                          styles.lastMessage,
                          isUnread && styles.unreadMessage
                        ]}
                        numberOfLines={1}
                      >
                        {conversation.last_message?.message || 'No messages yet'}
                      </Text>
                      
                      <ChevronRight size={20} color="#cbd5e1" />
                    </View>
                  </View>

                  {isUnread && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {conversation.unread_count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.newMessageButton}
        onPress={handleNewMessage}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#10B981', '#059669']}
          style={styles.newMessageButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Plus size={24} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
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
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginTop: 16,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1e293b',
    marginLeft: 8,
  },
  conversationsList: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyDescription: {
    fontSize: 16,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  startConversationButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  startConversationButtonText: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#14b8a6',
  },
  conversationsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  conversationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unreadConversationCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
  },
  userRole: {
    fontSize: 12,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#94a3b8',
  },
  unreadTimestamp: {
    color: '#14b8a6',
    fontWeight: '400',
    fontFamily: 'System',
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    fontWeight: '400',
    fontFamily: 'System',
    color: '#1e293b',
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#10B981',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'System',
    color: '#ffffff',
  },
  newMessageButton: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  newMessageButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSolid: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: '#f8fafc',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#14b8a6',
    backgroundColor: '#e0f2f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
});