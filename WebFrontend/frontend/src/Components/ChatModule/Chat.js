import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import NavbarBuyer from "../Includes/NavbarBuyer"; 
import NavbarSeller from "../Includes/NavbarSeller";
import { FaMicrophone, FaStop, FaPaperclip, FaFileAlt, FaPlay, FaVideo, FaPaperPlane } from 'react-icons/fa';
import { Fade } from 'react-reveal';
import "../../CSS/chat.css";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState({});
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();
  const recorderRef = useRef(null);
  const audioUrlRef = useRef(null);
  const socketRef = useRef();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { receiverId } = useParams();
  const user = JSON.parse(sessionStorage.getItem("user"));
  
  // Redirect if no user is logged in
  if (!user) {
    alert("Access denied. Please log in.");
    navigate("/");
  }
  
  // Helper function to check if a message is sent by the current user
  const isMessageFromCurrentUser = (messageId) => {
    return messageId && user.id && messageId.toString() === user.id.toString();
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (!user) {
      alert("Access denied. Please log in.");
      navigate("/");
    } else if (!receiverId) {
      console.log("receiverId is missing in URL params");
    } else {
      setCurrentUser(user);
      fetchMessages(user.id, receiverId);

      // Initialize Socket.IO connection
      socketRef.current = io("http://localhost:4000");

      // Join chat room
      socketRef.current.emit("join_chat", {
        userId: user.id,
        receiverId: receiverId
      });

      // Listen for new messages
      socketRef.current.on("receive_message", (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
      });

      // Listen for new audio messages
      socketRef.current.on("receive_audio", (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
      });

      // Listen for new file messages
      socketRef.current.on("receive_file", (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [navigate, receiverId]);
  
  const fetchMessages = async (userId1, userId2) => {
    try {
      const response = await fetch(`http://localhost:4000/api/chat/${userId1}/${userId2}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageData = {
      senderId: user.id,
      receiverId,
      message: newMessage,
      timestamp: new Date(),
      senderName: user.name
    };

    try {
      // Send message through Socket.IO
      socketRef.current.emit("send_message", messageData);

      // Also save to database
      const response = await fetch("http://localhost:4000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setNewMessage(""); // Clear input field
      } else {
        console.log("Message failed to send");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const startRecording = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          recorderRef.current = mediaRecorder;
          const chunks = [];
          mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: 'audio/wav' });
            setAudioBlob(audioBlob);
            const audioUrl = URL.createObjectURL(audioBlob);
            audioUrlRef.current = audioUrl;
          };

          mediaRecorder.start();
          setRecording(true);
        })
        .catch((err) => {
          console.log("Error accessing the microphone:", err);
        });
    } else {
      alert("Your browser does not support audio recording.");
    }
  };

  const stopRecording = () => {
    recorderRef.current.stop();
    setRecording(false);
  };

  const sendAudioMessage = async () => {
    if (!audioBlob) return;

    const formData = new FormData();
    formData.append("senderId", user.id);
    formData.append("receiverId", receiverId);
    formData.append("audio", audioBlob, "audio_message.wav");
    formData.append("senderName", user.name);

    try {
      const response = await fetch("http://localhost:4000/api/chat/audio", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Emit audio message through Socket.IO
        socketRef.current.emit("send_audio", {
          senderId: user.id,
          receiverId,
          audio: result.audioUrl,
          timestamp: new Date(),
          senderName: user.name
        });

        setAudioBlob(null);
      } else {
        console.log("Audio message failed to send");
      }
    } catch (error) {
      console.error("Error sending audio message:", error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        alert('Please select only PDF, PPT, or DOC files');
        event.target.value = null;
      }
    }
  };

  const sendFile = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("senderId", user.id);
    formData.append("receiverId", receiverId);
    formData.append("file", selectedFile);
    formData.append("senderName", user.name);

    try {
      const response = await fetch("http://localhost:4000/api/chat/file", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Emit file message through Socket.IO
        socketRef.current.emit("send_file", {
          senderId: user.id,
          receiverId,
          fileUrl: result.fileUrl,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          timestamp: new Date(),
          senderName: user.name
        });

        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = null;
        }
      } else {
        console.log("File failed to send");
      }
    } catch (error) {
      console.error("Error sending file:", error);
    }
  };

  // Render Navbar based on user role
  const renderNavbar = () => {
    if (user.role === "Buyer") {
      return <NavbarBuyer />;
    } else if (user.role === "Seller") {
      return <NavbarSeller />;
    } else {
      return <div>Invalid Role</div>;
    }
  };

  const handleStartMeeting = () => {
    navigate(`/meeting/${receiverId}`);
  };

  // Add this function at the top of your component, after the state declarations
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) {
      return '📄';
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return '📊';
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return '📝';
    }
    return '📎';
  };

  return (
    <div className="chat-container animate-fade-in">
      {renderNavbar()}
      <div className="chat-header">
        <div className="chat-header-content">
          <h1>Chat with {currentUser.name}</h1>
          <button className="action-button primary-button" onClick={handleStartMeeting}>
            <FaVideo className="me-2" /> Start Meeting
          </button>
        </div>
      </div>

      <div className="chat-messages-container">
        <div className="messages-wrapper">
          {messages.map((msg) => {
            const isSender = isMessageFromCurrentUser(msg.senderId);
            return (
              <Fade key={msg._id} direction={isSender ? "right" : "left"}>
                <div className={`message ${isSender ? 'sent' : 'received'}`}>
                  <div className="message-content">
                    <div className="message-sender">
                      {isSender ? "You" : msg.senderName}
                    </div>
                    {msg.message && (
                      <div className="message-text">{msg.message}</div>
                    )}
                    {msg.audio && (
                      <div className="audio-message">
                        <FaPlay className="audio-icon" />
                        <audio controls>
                          <source src={`http://localhost:4000${msg.audio}`} type="audio/wav" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                    {msg.fileUrl && (
                      <div className="file-message">
                        <FaFileAlt className="file-icon" />
                        <div className="file-info">
                          <div className="file-name">{msg.fileName}</div>
                          <a
                            href={`http://localhost:4000${msg.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="file-download"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    )}
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </Fade>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="message-input"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
        </div>

        <div className="chat-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.ppt,.pptx"
            className="file-input"
          />
          <button
            className="action-button"
            onClick={() => fileInputRef.current.click()}
          >
            <FaPaperclip className="me-2" /> Attach File
          </button>
          {selectedFile && (
            <button
              className="action-button success-button"
              onClick={sendFile}
            >
              <FaFileAlt className="me-2" /> Send File
            </button>
          )}
          <button className="action-button primary-button" onClick={handleSendMessage}>
            <FaPaperPlane className="me-2" /> Send Message
          </button>
          {recording ? (
            <button className="action-button danger-button" onClick={stopRecording}>
              <FaStop className="me-2" /> Stop Recording
            </button>
          ) : (
            <button className="action-button" onClick={startRecording}>
              <FaMicrophone className="me-2" /> Record Voice
            </button>
          )}
          {audioBlob && !recording && (
            <button className="action-button success-button" onClick={sendAudioMessage}>
              <FaPlay className="me-2" /> Send Voice Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
