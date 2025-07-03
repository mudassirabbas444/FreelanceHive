import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { API_URL } from '../config';

function ChatList() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (!userStr) {
          Alert.alert('Error', 'Please login first');
          navigation.navigate('Login');
          return;
        }
        const user = JSON.parse(userStr);
        fetchChats(user.id);
      } catch (error) {
        console.error('Error checking user:', error);
        Alert.alert('Error', 'Failed to load user data');
      }
    };

    checkUser();
  }, [navigation]);

  const fetchChats = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/chats/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      const groupedChats = groupChatsByUser(data);
      setChats(groupedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const groupChatsByUser = (chatData) => {
    const userChats = {};
    const currentUser = JSON.parse(AsyncStorage.getItem('user'));

    chatData.forEach((chat) => {
      const otherUserId = chat.senderId === currentUser?.id ? chat.receiverId : chat.senderId;

      if (!userChats[otherUserId]) {
        userChats[otherUserId] = {
          name: chat.senderId === currentUser?.id ? chat.receiverName : chat.senderName,
          id: otherUserId,
          lastMessage: chat.message,
          timestamp: chat.timestamp,
        };
      } else if (new Date(chat.timestamp) > new Date(userChats[otherUserId].timestamp)) {
        userChats[otherUserId].lastMessage = chat.message;
        userChats[otherUserId].timestamp = chat.timestamp;
      }
    });

    return Object.values(userChats).sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  };

  const handleChatPress = (receiverId) => {
    navigation.navigate('Chat', { receiverId });
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => handleChatPress(item.id)}
    >
      <View style={styles.avatarContainer}>
        <FontAwesome name="user-circle" size={50} color="#007AFF" />
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName}>{item.name}</Text>
        {item.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        )}
        {item.timestamp && (
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome name="exclamation-triangle" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => {
            const user = JSON.parse(AsyncStorage.getItem('user'));
            if (user) fetchChats(user.id);
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <Text style={styles.headerSubtitle}>
          {chats.length} {chats.length === 1 ? 'conversation' : 'conversations'}
        </Text>
      </View>

      {chats.length > 0 ? (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.chatList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome name="comments-o" size={60} color="#C7C7CC" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Start chatting with sellers to discuss your projects
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  chatList: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 15,
    color: '#8E8E93',
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 17,
    color: '#FF3B30',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default ChatList; 