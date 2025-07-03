import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription
} from 'react-native-webrtc';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import io from 'socket.io-client';
import { API_URL } from '../config';

function Meeting() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [peerConnection, setPeerConnection] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();
  const route = useRoute();
  const { receiverId } = route.params;

  useEffect(() => {
    const initializeMeeting = async () => {
      try {
        // Check permissions first
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
          
          if (
            granted['android.permission.CAMERA'] !== PermissionsAndroid.RESULTS.GRANTED ||
            granted['android.permission.RECORD_AUDIO'] !== PermissionsAndroid.RESULTS.GRANTED
          ) {
            Alert.alert('Error', 'Permissions not granted');
            return;
          }
        }

        // Initialize WebRTC
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode: 'user',
          },
        });
        setLocalStream(stream);

        // Initialize Socket.IO
        const newSocket = io(API_URL);
        setSocket(newSocket);

        // Initialize RTCPeerConnection
        const configuration = {
          iceServers: [
            {
              urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
              ],
            },
          ],
        };
        const newPeerConnection = new RTCPeerConnection(configuration);
        setPeerConnection(newPeerConnection);

        // Add local stream to peer connection
        stream.getTracks().forEach(track => {
          newPeerConnection.addTrack(track, stream);
        });

        // Handle incoming stream
        newPeerConnection.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
        };

        // Handle ICE candidates
        newPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            newSocket.emit('ice-candidate', {
              candidate: event.candidate,
              receiverId,
            });
          }
        };

        // Socket event listeners
        newSocket.on('offer', async (data) => {
          try {
            await newPeerConnection.setRemoteDescription(
              new RTCSessionDescription(data.offer)
            );
            const answer = await newPeerConnection.createAnswer();
            await newPeerConnection.setLocalDescription(answer);
            newSocket.emit('answer', {
              answer,
              receiverId: data.senderId,
            });
          } catch (error) {
            console.error('Error handling offer:', error);
          }
        });

        newSocket.on('answer', async (data) => {
          try {
            await newPeerConnection.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
          } catch (error) {
            console.error('Error handling answer:', error);
          }
        });

        newSocket.on('ice-candidate', async (data) => {
          try {
            await newPeerConnection.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } catch (error) {
            console.error('Error handling ICE candidate:', error);
          }
        });

        // Start the call
        const offer = await newPeerConnection.createOffer();
        await newPeerConnection.setLocalDescription(offer);
        newSocket.emit('offer', {
          offer,
          receiverId,
        });

        setLoading(false);

        return () => {
          if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
          }
          if (newPeerConnection) {
            newPeerConnection.close();
          }
          if (newSocket) {
            newSocket.disconnect();
          }
        };
      } catch (error) {
        console.error('Error initializing meeting:', error);
        Alert.alert('Error', 'Failed to start video call');
      }
    };

    initializeMeeting();
  }, [receiverId]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    if (socket) {
      socket.disconnect();
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          {remoteStream && (
            <RTCView
              streamURL={remoteStream.toURL()}
              style={styles.remoteStream}
              objectFit="cover"
            />
          )}
          
          {localStream && (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localStream}
              objectFit="cover"
            />
          )}

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={toggleMute}
            >
              <FontAwesome
                name={isMuted ? 'microphone-slash' : 'microphone'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.endCallButton]}
              onPress={endCall}
            >
              <FontAwesome name="phone" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
              onPress={toggleCamera}
            >
              <FontAwesome
                name={isCameraOff ? 'video-slash' : 'video-camera'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteStream: {
    flex: 1,
  },
  localStream: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 100,
    height: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  controlButtonActive: {
    backgroundColor: '#FF3B30',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
    transform: [{ rotate: '135deg' }],
  },
});

export default Meeting; 