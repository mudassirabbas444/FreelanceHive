import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaUserTag, FaUserShield, FaEdit, FaTrash, FaArrowLeft, FaBriefcase, FaMapMarkerAlt, FaGraduationCap, FaCertificate, FaTools, FaUserEdit, FaIdCard, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Fade } from 'react-reveal';
import "../../CSS/viewProfile.css";
import NavbarBuyer from "../Includes/NavbarBuyer";
import NavbarSeller from "../Includes/NavbarSeller"; 
import NavbarAdmin from "../Includes/NavbarAdmin";

const ViewProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = JSON.parse(sessionStorage.getItem("user"))?.id;
        if (!userId) {
          throw new Error('User ID not found in session storage.');
        }

        const response = await fetch(`http://localhost:4000/api/profile/view/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user profile.');
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleUpdateRedirect = () => {
    navigate(`/profile/update/${user._id}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/profile/delete/${user._id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete profile.');
      }
      setMessage('Profile deleted successfully.');
      setUser(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoBack = () => {
    navigate(-1); // Navigate to the previous page
  };

  // Render Navbar based on user role
  const renderNavbar = () => {
    if (user?.role === "Buyer") {
      return <NavbarBuyer />;
    } else if (user?.role === "Seller") {
      return <NavbarSeller />;
    } 
    else if (user?.role === "Admin") {
      return <NavbarAdmin />;
    } 
    else {
      return <div>Invalid Role</div>;
    }
  };

  if (loading) {
    return (
      <div className="view-profile-container">
        {renderNavbar()}
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-profile-container">
        {renderNavbar()}
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Profile</h2>
          <p>{error}</p>
          <button className="action-button primary-button" onClick={handleGoBack}>
            <FaArrowLeft className="me-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="view-profile-container">
        {renderNavbar()}
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <h2>Profile Not Found</h2>
          <p>The profile you're looking for doesn't exist or has been removed.</p>
          <button className="action-button primary-button" onClick={handleGoBack}>
            <FaArrowLeft className="me-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
    {renderNavbar()}
    <div className="view-profile-container" style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '2rem'
    }}>
     
      <div className="profile-header" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '2rem'
      }}>
        <Fade top>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#2d3436',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <FaUser size={40} color="#1dbf73" />
            User Profile
          </h1>
        </Fade>
        <div className="profile-actions" style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {user?.role !== "Admin" && (
            <button 
              className="action-button primary-button"
              onClick={() => navigate('/verification')}
              style={{
                backgroundColor: '#1dbf73',
                color: 'white',
                padding: '0.8rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1rem',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#19a463'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#1dbf73'}
            >
              <FaIdCard /> Request Verification
            </button>
          )}
          <button 
            className="action-button primary-button"
            onClick={() => navigate(`/profile/update/${user._id}`)}
            style={{
              backgroundColor: '#1dbf73',
              color: 'white',
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#19a463'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#1dbf73'}
          >
            <FaUserEdit /> Edit Profile
          </button>
          <button 
            className="action-button danger-button"
            onClick={handleDelete}
            style={{
              backgroundColor: '#ff7675',
              color: 'white',
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#d63031'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ff7675'}
          >
            <FaTrash /> Delete Profile
          </button>
        </div>
      </div>

      <div className="profile-content" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
      }}>
        <div className="profile-main">
          <div className="profile-section" style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#2d3436',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FaUserShield color="#1dbf73" /> Basic Information
            </h2>
            <div className="profile-info" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              <div className="info-item" style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <span className="info-label" style={{
                  display: 'block',
                  color: '#636e72',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}>Name</span>
                <span className="info-value" style={{
                  color: '#2d3436',
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}>{user.name}</span>
              </div>
              <div className="info-item" style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <span className="info-label" style={{
                  display: 'block',
                  color: '#636e72',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}>Email</span>
                <span className="info-value" style={{
                  color: '#2d3436',
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}>{user.email}</span>
              </div>
              <div className="info-item" style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <span className="info-label" style={{
                  display: 'block',
                  color: '#636e72',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}>Username</span>
                <span className="info-value" style={{
                  color: '#2d3436',
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}>{user.username}</span>
              </div>
              <div className="info-item" style={{
                padding: '1rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <span className="info-label" style={{
                  display: 'block',
                  color: '#636e72',
                  fontSize: '0.9rem',
                  marginBottom: '0.5rem'
                }}>Role</span>
                <span className="info-value" style={{
                  color: '#2d3436',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {user.role}
                  {user.isVerified ? (
                    <FaCheckCircle color="#1dbf73" title="Verified User" />
                  ) : (
                    <FaTimesCircle color="#ff7675" title="Unverified User" />
                  )}
                </span>
              </div>
            </div>
          </div>

          {user.role === 'Seller' && (
            <div className="profile-section" style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                color: '#2d3436',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FaBriefcase color="#1dbf73" /> Seller Details
              </h2>
              <div className="profile-info" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                <div className="info-item" style={{
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <span className="info-label" style={{
                    display: 'block',
                    color: '#636e72',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                  }}>Description</span>
                  <span className="info-value" style={{
                    color: '#2d3436',
                    fontSize: '1.1rem',
                    fontWeight: '500'
                  }}>{user.description || 'N/A'}</span>
                </div>
                <div className="info-item" style={{
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <span className="info-label" style={{
                    display: 'block',
                    color: '#636e72',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                  }}>Address</span>
                  <span className="info-value" style={{
                    color: '#2d3436',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaMapMarkerAlt color="#1dbf73" />
                    {user.address || 'N/A'}
                  </span>
                </div>
                <div className="info-item" style={{
                  padding: '1rem',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <span className="info-label" style={{
                    display: 'block',
                    color: '#636e72',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                  }}>Qualification</span>
                  <span className="info-value" style={{
                    color: '#2d3436',
                    fontSize: '1.1rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FaGraduationCap color="#1dbf73" />
                    {user.qualification || 'N/A'}
                  </span>
                </div>
              </div>

              {user.expertise && user.expertise.length > 0 && (
                <div className="info-item" style={{
                  marginTop: '1.5rem'
                }}>
                  <span className="info-label" style={{
                    display: 'block',
                    color: '#636e72',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                  }}>Expertise</span>
                  <div className="expertise-tags" style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    {user.expertise.map((skill, index) => (
                      <span key={index} className="expertise-tag" style={{
                        backgroundColor: '#e8f5e9',
                        color: '#1dbf73',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <FaTools size={14} />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user.certificates && user.certificates.length > 0 && (
                <div className="info-item" style={{
                  marginTop: '1.5rem'
                }}>
                  <span className="info-label" style={{
                    display: 'block',
                    color: '#636e72',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                  }}>Certificates</span>
                  <div className="expertise-tags" style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    {user.certificates.map((cert, index) => (
                      <span key={index} className="expertise-tag" style={{
                        backgroundColor: '#e8f5e9',
                        color: '#1dbf73',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <FaCertificate size={14} />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="profile-sidebar" style={{
          position: 'sticky',
          top: '2rem',
          display: 'none' // Hide the sidebar since we removed its content
        }}>
        </div>
      </div>

      {message && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: '#1dbf73',
          color: 'white',
          padding: '1rem 2rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {message}
        </div>
      )}
    </div>
    </div>
  );
};

export default ViewProfile;
