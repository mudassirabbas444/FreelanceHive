import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { API_URL } from '../config';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioUri, setAudioUri] = useState(null);
  const [sound, setSound] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation();
  const route = useRoute();
  const { receiverId } = route.params;
  const socketRef = useRef(null);
  const recordingRef = useRef(null);

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
        setCurrentUser(user);
        fetchMessages(user.id, receiverId);

        // Initialize Socket.IO connection
        socketRef.current = io(API_URL);

        // Join chat room
        socketRef.current.emit('join_chat', {
          userId: user.id,
          receiverId: receiverId
        });

        // Listen for new messages
        socketRef.current.on('receive_message', (data) => {
          setMessages(prev => [...prev, data]);
        });

        // Listen for new audio messages
        socketRef.current.on('receive_audio', (data) => {
          setMessages(prev => [...prev, data]);
        });

        // Listen for new file messages
        socketRef.current.on('receive_file', (data) => {
          setMessages(prev => [...prev, data]);
        });

        return () => {
          if (socketRef.current) {
            socketRef.current.disconnect();
          }
        };
      } catch (error) {
        console.error('Error checking user:', error);
        Alert.alert('Error', 'Failed to load user data');
      }
    };

    checkUser();
  }, [navigation, receiverId]);

  const fetchMessages = async (userId1, userId2) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/chat/${userId1}/${userId2}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      senderId: currentUser.id,
      receiverId,
      message: newMessage,
      timestamp: new Date(),
      senderName: currentUser.name
    };

    try {
      // Send message through Socket.IO
      socketRef.current.emit('send_message', messageData);

      // Save to database
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setNewMessage('');
      } else {
        Alert.alert('Error', 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        
        const recording = new Audio.Recording();
        await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
        await recording.startAsync();
        recordingRef.current = recording;
        setRecording(true);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      setAudioUri(uri);
      setRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const sendAudioMessage = async () => {
    if (!audioUri) return;

    try {
      const formData = new FormData();
      formData.append('senderId', currentUser.id);
      formData.append('receiverId', receiverId);
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'audio_message.wav'
      });
      formData.append('senderName', currentUser.name);

      const response = await fetch(`${API_URL}/api/chat/audio`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        socketRef.current.emit('send_audio', {
          senderId: currentUser.id,
          receiverId,
          audio: result.audioUrl,
          timestamp: new Date(),
          senderName: currentUser.name
        });
        setAudioUri(null);
      } else {
        Alert.alert('Error', 'Failed to send audio message');
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      Alert.alert('Error', 'Failed to send audio message');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      if (result.type === 'success') {
        const formData = new FormData();
        formData.append('senderId', currentUser.id);
        formData.append('receiverId', receiverId);
        formData.append('file', {
          uri: result.uri,
          type: result.mimeType,
          name: result.name
        });
        formData.append('senderName', currentUser.name);

        const response = await fetch(`${API_URL}/api/chat/file`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const fileResult = await response.json();
          socketRef.current.emit('send_file', {
            senderId: currentUser.id,
            receiverId,
            fileUrl: fileResult.fileUrl,
            fileName: result.name,
            fileType: result.mimeType,
            timestamp: new Date(),
            senderName: currentUser.name
          });
        } else {
          Alert.alert('Error', 'Failed to send file');
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const renderMessage = ({ item }) => {
    const isCurrentUser = item.senderId === currentUser?.id;
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && (
          <Text style={styles.senderName}>{item.senderName}</Text>
        )}
        {item.message && (
          <Text style={styles.messageText}>{item.message}</Text>
        )}
        {item.audio && (
          <TouchableOpacity style={styles.audioButton} onPress={() => playAudio(item.audio)}>
            <FontAwesome name="play" size={20} color="#fff" />
            <Text style={styles.audioText}>Play Audio</Text>
          </TouchableOpacity>
        )}
        {item.fileUrl && (
          <TouchableOpacity style={styles.fileButton} onPress={() => downloadFile(item.fileUrl, item.fileName)}>
            <FontAwesome name="file" size={20} color="#fff" />
            <Text style={styles.fileText}>{item.fileName}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  const playAudio = async (audioUrl) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl });
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const downloadFile = async (fileUrl, fileName) => {
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        FileSystem.documentDirectory + fileName
      );
      const { uri } = await downloadResumable.downloadAsync();
      Alert.alert('Success', `File downloaded to ${uri}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar style="auto" />
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          inverted={false}
          style={styles.messagesList}
        />
      )}
      
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={recording ? stopRecording : startRecording}
        >
          <FontAwesome name={recording ? 'stop' : 'microphone'} size={20} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={pickDocument}
        >
          <FontAwesome name="paperclip" size={20} color="#007AFF" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          multiline
        />

        <TouchableOpacity 
          style={styles.sendButton}
          onPress={audioUri ? sendAudioMessage : handleSendMessage}
        >
          <FontAwesome name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messagesList: {
    flex: 1,
    padding: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#rgba(255,255,255,0.7)',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  input: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 10,
    maxHeight: 100,
  },
  iconButton: {
    padding: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CD964',
    padding: 10,
    borderRadius: 20,
    marginTop: 5,
  },
  audioText: {
    color: '#fff',
    marginLeft: 5,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5856D6',
    padding: 10,
    borderRadius: 20,
    marginTop: 5,
  },
  fileText: {
    color: '#fff',
    marginLeft: 5,
  },
});

export default Chat; 