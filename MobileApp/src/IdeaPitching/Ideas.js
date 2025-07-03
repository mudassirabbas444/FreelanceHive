import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  RefreshControl,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { API_URL } from '../config';

const Ideas = () => {
  const navigation = useNavigation();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 3000;

  const fetchIdeas = useCallback(async () => {
    if (!user || !user.id) {
      setError("User information not found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ideas/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setIdeas([]);
          return;
        }
        const data = await response.json();
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setIdeas(data);
      setRetryCount(0);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message.includes("Failed to fetch")
        ? "Connection failed. Please check your internet connection."
        : error.message
      );

      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        setTimeout(fetchIdeas, RETRY_DELAY);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, retryCount]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (!userData) {
          Alert.alert('Access Denied', 'Please log in first.');
          navigation.navigate('Login');
          return;
        }

        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'Buyer') {
          Alert.alert('Access Denied', 'Please log in as a Buyer.');
          navigation.navigate('Login');
          return;
        }

        setUser(parsedUser);
      } catch (error) {
        console.error("Error loading user:", error);
        Alert.alert('Error', 'Failed to load user data');
      }
    };

    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchIdeas();
      }
    }, [user, fetchIdeas])
  );

  const handleRetry = () => {
    setRetryCount(0);
    fetchIdeas();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchIdeas();
  }, [fetchIdeas]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#ffc107';
      case 'approved':
        return '#28a745';
      case 'rejected':
        return '#dc3545';
      case 'closed':
        return '#6c757d';
      case 'deleted':
        return '#343a40';
      default:
        return '#17a2b8';
    }
  };

  const filteredIdeas = ideas.filter(idea => showDeleted ? true : idea.status !== 'deleted');

  const renderIdeaCard = ({ item: idea }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('IdeaDetail', { ideaId: idea.ideaId })}
    >
      <View style={styles.cardContent}>
        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{idea.category}</Text>
        </View>

        <Text style={styles.title}>{idea.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {idea.description}
        </Text>

        <View style={styles.metaInfo}>
          <View style={styles.statusContainer}>
            <Text style={styles.metaLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(idea.status) }]}>
              <Text style={styles.statusText}>{idea.status}</Text>
            </View>
          </View>

          <View style={styles.dateContainer}>
            <Text style={styles.metaLabel}>Created</Text>
            <View style={styles.dateWrapper}>
              <FontAwesome name="calendar" size={12} color="#666" />
              <Text style={styles.dateText}>
                {new Date(idea.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.viewDetailsContainer}>
          <FontAwesome name="chevron-right" size={14} color="#007bff" />
          <Text style={styles.viewDetailsText}>View Details</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>💡</Text>
      <Text style={styles.emptyTitle}>No Ideas Found</Text>
      <Text style={styles.emptyText}>
        {showDeleted ? "No deleted ideas found." : "Click 'Create New Idea' to get started!"}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>My Ideas</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateIdea')}
        >
          <FontAwesome name="plus" size={16} color="#fff" />
          <Text style={styles.createButtonText}>Create New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerBottom}>
        <Text style={styles.ideaCount}>{filteredIdeas.length} ideas found</Text>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Show deleted</Text>
          <Switch
            value={showDeleted}
            onValueChange={setShowDeleted}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={showDeleted ? '#007bff' : '#f4f3f4'}
          />
        </View>
      </View>
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={50} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <FlatList
        data={filteredIdeas}
        renderItem={renderIdeaCard}
        keyExtractor={item => item.ideaId.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: '500',
  },
  ideaCount: {
    color: '#666',
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    marginRight: 8,
    color: '#666',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 15,
  },
  categoryPill: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryText: {
    color: '#495057',
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
  },
  description: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 15,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flex: 1,
  },
  dateContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  dateWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewDetailsText: {
    color: '#007bff',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
  },
  emptyText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default Ideas; 