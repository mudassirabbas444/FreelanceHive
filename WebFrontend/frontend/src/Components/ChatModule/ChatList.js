import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarBuyer from "../Includes/NavbarBuyer";
import NavbarSeller from "../Includes/NavbarSeller";
import { FaComments, FaUserCircle, FaChevronRight } from 'react-icons/fa';
import { Fade } from 'react-reveal';
import "../../CSS/gig.css";

function ChatsList() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    if (!user) {
      alert("Access denied. Please log in.");
      navigate("/");
    } else {
      fetchChats(user.id);
    }
  }, [navigate]);

  const fetchChats = async (userId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/chats/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (receiverId) => {
    navigate(`/chat/${receiverId}`);
  };

  const groupChatsByUser = () => {
    const userChats = {};

    chats.forEach((chat) => {
      const otherUserId = chat.senderId === user.id ? chat.receiverId : chat.senderId;

      if (!userChats[otherUserId]) {
        userChats[otherUserId] = {
          name: chat.senderId === user.id ? chat.receiverName : chat.senderName,
          id: otherUserId,
        };
      }
    });

    return Object.values(userChats);
  };

  const groupedChats = groupChatsByUser();

  const renderNavbar = () => {
    if (user.role === "Buyer") {
      return <NavbarBuyer />;
    } else if (user.role === "Seller") {
      return <NavbarSeller />;
    } else {
      return <div>Invalid Role</div>;
    }
  };

  if (loading) {
    return (
      <div className="gig-container animate-fade-in">
        {renderNavbar()}
        <div className="loading-skeleton">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gig-container animate-fade-in">
        {renderNavbar()}
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Chats</h2>
          <p>{error}</p>
          <button className="action-button primary-button" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gig-container animate-fade-in">
      {renderNavbar()}
      <div className="page-header">
        <h1>Your Chats</h1>
        <p>Connect with other users</p>
      </div>

      <div className="gig-stats">
        <p>{groupedChats.length} conversations found</p>
      </div>

      <div className="gig-grid">
        {groupedChats.length > 0 ? (
          groupedChats.map((chat) => (
            <Fade bottom key={chat.id}>
              <div className="gig-card" onClick={() => handleChatClick(chat.id)}>
                <div className="gig-content">
                  <div className="chat-avatar">
                    <FaUserCircle className="avatar-icon" />
                  </div>
                  <div className="chat-info">
                    <h3 className="gig-title">{chat.name}</h3>
                    <div className="chat-meta">
                      <FaComments className="meta-icon" />
                      <span>Click to start chatting</span>
                    </div>
                  </div>
                  <div className="gig-actions">
                    <button className="action-button primary-button">
                      <FaChevronRight className="me-2" /> Open Chat
                    </button>
                  </div>
                </div>
              </div>
            </Fade>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h2>No Chats Found</h2>
            <p>Start a conversation with other users</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatsList;
