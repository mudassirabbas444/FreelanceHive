import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import NavbarBuyer from "../Includes/NavbarBuyer";
import NavbarSeller from "../Includes/NavbarSeller";
import { FaVideo, FaClock, FaTrash, FaCopy, FaUsers } from 'react-icons/fa';
import { Fade } from 'react-reveal';
import "../../CSS/chat.css";

const Meeting = () => {
  const [meetings, setMeetings] = useState([]);
  const [topic, setTopic] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [password, setPassword] = useState("");
  const { receiverId } = useParams();
  const user = JSON.parse(sessionStorage.getItem("user"));

  useEffect(() => {
    fetchMeetings();
  }, []);

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const fetchMeetings = async () => {
    const response = await fetch(`http://localhost:4000/api/meetings/all?userId=${user.id}`);
    const data = await response.json();
    setMeetings(data);
  };

  const createMeeting = async (e) => {
    e.preventDefault();
    
    const selectedTime = new Date(startTime);
    const currentTime = new Date();
    
    if (selectedTime < currentTime) {
      alert("Cannot create meetings in the past. Please select a future time.");
      return;
    }

    const response = await fetch("http://localhost:4000/api/meetings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostId: user.id,
        receiverId,
        topic,
        start_time: startTime,
        duration: parseInt(duration),
        password,
      }),
    });

    if (response.ok) {
      alert("Meeting created!");
      setTopic("");
      setStartTime("");
      setDuration("");
      setPassword("");
      fetchMeetings();
    } else {
      alert("Failed to create meeting.");
    }
  };

  const deleteMeeting = async (meetingId) => {
    const response = await fetch(`http://localhost:4000/api/meetings/${meetingId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    if (response.ok) {
      alert("Meeting deleted!");
      fetchMeetings();
    }
  };

  const copyLink = (meetingUrl) => {
    navigator.clipboard.writeText(meetingUrl);
    alert("Meeting link copied!");
  };

  const isMeetingExpired = (startTime, duration) => {
    const meetingStartTime = new Date(startTime);
    const meetingEndTime = new Date(meetingStartTime.getTime() + duration * 60000);
    const currentTime = new Date();
    return currentTime > meetingEndTime;
  };

  const getMeetingStatus = (startTime, duration) => {
    const meetingStartTime = new Date(startTime);
    const meetingEndTime = new Date(meetingStartTime.getTime() + duration * 60000);
    const currentTime = new Date();

    if (currentTime < meetingStartTime) {
      return "upcoming";
    } else if (currentTime > meetingEndTime) {
      return "expired";
    } else {
      return "ongoing";
    }
  };

  const renderNavbar = () => {
    if (user.role === "Buyer") {
      return <NavbarBuyer />;
    } else if (user.role === "Seller") {
      return <NavbarSeller />;
    } else {
      return <div>Invalid Role</div>;
    }
  };

  return (
    <div className="gig-container animate-fade-in">
      {renderNavbar()}
      <div className="page-header">
        <h1>Manage Meetings</h1>
        <p>Schedule and join video meetings with other users</p>
      </div>

      <div className="gig-card">
        <div className="gig-content">
          <form onSubmit={createMeeting} className="meeting-form">
            <div className="form-group">
              <label htmlFor="topic">Meeting Topic</label>
              <input 
                type="text" 
                id="topic"
                placeholder="Enter meeting topic" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input 
                type="datetime-local" 
                id="startTime"
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)}
                min={getMinDateTime()}
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="duration">Duration (minutes)</label>
              <input 
                type="number" 
                id="duration"
                placeholder="Enter duration in minutes" 
                value={duration} 
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Meeting Password</label>
              <input 
                type="text" 
                id="password"
                placeholder="Enter meeting password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="action-button primary-button">
              <FaVideo className="me-2" /> Create Meeting
            </button>
          </form>
        </div>
      </div>

      <div className="gig-stats">
        <p>{meetings.length} meetings found</p>
      </div>

      <div className="gig-grid">
        {meetings.map((meeting) => {
          const status = getMeetingStatus(meeting.start_time, meeting.duration);
          const statusColors = {
            upcoming: "#22c55e",
            ongoing: "#3b82f6",
            expired: "#ef4444"
          };

          return (
            <Fade bottom key={meeting._id}>
              <div className="gig-card">
                <div className="gig-content">
                  <div className="meeting-info">
                    <h3 className="gig-title">{meeting.topic}</h3>
                    <div className="meeting-meta">
                      <div className="meta-item">
                        <FaClock className="meta-icon" />
                        <span>Start: {new Date(meeting.start_time).toLocaleString()}</span>
                      </div>
                      <div className="meta-item">
                        <FaClock className="meta-icon" />
                        <span>Duration: {meeting.duration} minutes</span>
                      </div>
                    </div>
                    <div className="status-badge" style={{ backgroundColor: statusColors[status] }}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  </div>

                  <div className="gig-actions">
                    {status !== "expired" && (
                      <>
                        <a 
                          href={meeting.meetingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="action-button primary-button"
                        >
                          <FaVideo className="me-2" /> Join Meeting
                        </a>
                        <button 
                          onClick={() => copyLink(meeting.meetingUrl)}
                          className="action-button"
                        >
                          <FaCopy className="me-2" /> Copy Link
                        </button>
                      </>
                    )}
                    {meeting.hostId === user.id && (
                      <button 
                        onClick={() => deleteMeeting(meeting._id)}
                        className="action-button danger-button"
                      >
                        <FaTrash className="me-2" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Fade>
          );
        })}
      </div>
    </div>
  );
};

export default Meeting;
