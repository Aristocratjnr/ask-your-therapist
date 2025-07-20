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
  TextInput,
  Dimensions,
  useWindowDimensions,
  PixelRatio
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scaleFont = (size: number) => {
  const scale = SCREEN_WIDTH / 375;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

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
  const { width: screenWidth } = useWindowDimensions();
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
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Loading your messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with profile image */}
      <LinearGradient
        colors={['#f8fafc', '#f1f5f9']}
        style={[styles.header, { paddingTop: screenWidth * 0.15 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.profileContainer}>
            {userProfile?.photo_url ? (
              <Image
                source={{ uri: userProfile.photo_url }}
                style={[styles.profileImage, {
                  width: screenWidth * 0.22,
                  height: screenWidth * 0.22,
                  borderRadius: screenWidth * 0.11,
                  borderWidth: screenWidth * 0.008
                }]}
              />
            ) : (
              <View style={[styles.profilePlaceholder, {
                width: screenWidth * 0.22,
                height: screenWidth * 0.22,
                borderRadius: screenWidth * 0.11
              }]}>
                <MaterialIcons 
                  name="person" 
                  size={screenWidth * 0.1} 
                  color="#ffffff" 
                />
              </View>
            )}
          </View>
          <Text style={[styles.title, { fontSize: scaleFont(28) }]}>Messages</Text>
          <Text style={[styles.subtitle, { fontSize: scaleFont(16) }]}>
            {userProfile?.role === 'therapist' 
              ? 'Connect with your clients' 
              : 'Chat with your therapists'}
          </Text>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { paddingHorizontal: screenWidth * 0.06 }]}>
        <View style={[styles.searchBox, { padding: screenWidth * 0.04 }]}>
          <MaterialIcons name="search" size={scaleFont(20)} color="#94a3b8" />
          <TextInput
            style={[styles.searchInput, { fontSize: scaleFont(16) }]}
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
            colors={['#14b8a6']} 
            tintColor="#14b8a6"
          />
        }
      >
        {conversations.length === 0 ? (
          <View style={[styles.emptyState, { paddingTop: screenWidth * 0.1 }]}>
            <View style={[styles.emptyIconContainer, {
              width: screenWidth * 0.25,
              height: screenWidth * 0.25,
              borderRadius: screenWidth * 0.125
            }]}>
              <MaterialIcons 
                name="forum" 
                size={screenWidth * 0.12} 
                color="#cbd5e1" 
              />
            </View>
            <Text style={[styles.emptyTitle, { fontSize: scaleFont(20) }]}>No messages yet</Text>
            <Text style={[styles.emptyDescription, { fontSize: scaleFont(16) }]}>
              {userProfile?.role === 'therapist' 
                ? 'When clients message you, conversations will appear here.' 
                : 'Start a conversation with your therapist to get support.'}
            </Text>
            <TouchableOpacity 
              style={[styles.startConversationButton, {
                paddingVertical: screenWidth * 0.04,
                paddingHorizontal: screenWidth * 0.08
              }]}
              onPress={handleNewMessage}
            >
              <Text style={[styles.startConversationButtonText, { fontSize: scaleFont(16) }]}>
                {userProfile?.role === 'therapist' 
                  ? 'Message a Client' 
                  : 'Find a Therapist'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.conversationsContainer, { paddingHorizontal: screenWidth * 0.06 }]}>
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
                    isUnread && styles.unreadConversationCard,
                    { padding: screenWidth * 0.04, marginBottom: screenWidth * 0.03 }
                  ]}
                  onPress={() => handleOpenConversation(conversation)}
                  activeOpacity={0.95}
                >
                  {otherUser?.photo_url ? (
                    <Image 
                      source={{ uri: otherUser.photo_url }} 
                      style={[styles.avatarImage, {
                        width: screenWidth * 0.15,
                        height: screenWidth * 0.15,
                        borderRadius: screenWidth * 0.075
                      }]} 
                    />
                  ) : (
                    <Image
                      source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
                      style={[styles.avatarImage, {
                        width: screenWidth * 0.15,
                        height: screenWidth * 0.15,
                        borderRadius: screenWidth * 0.075
                      }]}
                    />
                  )}

                  <View style={[styles.conversationContent, { marginLeft: screenWidth * 0.04 }]}>
                    <View style={styles.conversationHeader}>
                      <View>
                        <Text style={[styles.userName, { fontSize: scaleFont(16) }]}>
                          {otherUser?.name || 'User'}
                        </Text>
                        <Text style={[styles.userRole, { fontSize: scaleFont(12) }]}>
                          {otherUser?.role === 'therapist' ? 'Therapist' : 'Client'}
                        </Text>
                      </View>
                      <Text style={[
                        styles.timestamp,
                        isUnread && styles.unreadTimestamp,
                        { fontSize: scaleFont(12) }
                      ]}>
                        {lastMessageTime}
                      </Text>
                    </View>

                    <View style={styles.conversationFooter}>
                      <Text 
                        style={[
                          styles.lastMessage,
                          isUnread && styles.unreadMessage,
                          { fontSize: scaleFont(14) }
                        ]}
                        numberOfLines={1}
                      >
                        {conversation.last_message?.message || 'No messages yet'}
                      </Text>
                      
                      <MaterialIcons 
                        name="chevron-right" 
                        size={scaleFont(20)} 
                        color="#cbd5e1" 
                      />
                    </View>
                  </View>

                  {isUnread && (
                    <View style={[styles.unreadBadge, {
                      width: screenWidth * 0.06,
                      height: screenWidth * 0.06,
                      borderRadius: screenWidth * 0.03
                    }]}>
                      <Text style={[styles.unreadCount, { fontSize: scaleFont(12) }]}>
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
        style={[
          styles.newMessageButton,
          {
            backgroundColor: '#f0fdf4',
            borderRadius: 999,
            borderWidth: 2,
            borderColor: '#10B981',
            padding: screenWidth * 0.04,
            position: 'absolute',
            bottom: screenWidth * 0.08,
            right: screenWidth * 0.06,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.10,
            shadowRadius: 8,
            elevation: 8,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
        onPress={handleNewMessage}
        activeOpacity={0.9}
      >
        <MaterialIcons 
          name="add" 
          size={scaleFont(28)} 
          color="#10B981" 
        />
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
    fontWeight: '300',
    fontFamily: 'System',
    color: '#64748b',
    marginTop: 16,
  },
  header: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  profileContainer: {
    marginBottom: 16,
  },
  profileImage: {
    borderColor: '#14b8a6',
    backgroundColor: '#e0f2f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  profilePlaceholder: {
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  title: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748b',
  },
  searchContainer: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
  },
  emptyIconContainer: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyDescription: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  startConversationButton: {
    backgroundColor: '#14b8a6',
    borderRadius: 12,
  },
  startConversationButtonText: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#ffffff',
  },
  conversationsContainer: {
    paddingBottom: 100,
  },
  conversationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
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
    borderLeftColor: '#14b8a6',
  },
  avatarImage: {
    marginRight: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'System',
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
    fontWeight: '300',
    fontFamily: 'System',
    color: '#1e293b',
  },
  userRole: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748b',
    marginTop: 2,
  },
  timestamp: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#94a3b8',
  },
  unreadTimestamp: {
    color: '#14b8a6',
    fontWeight: '300',
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontWeight: '200',
    fontFamily: 'System',
    color: '#64748b',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    fontWeight: '300',
    color: '#1e293b',
  },
  unreadBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#14b8a6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    fontWeight: '300',
    fontFamily: 'System',
    color: '#ffffff',
  },
  newMessageButton: {
    position: 'absolute',
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
});