import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUser, FaEnvelope, FaUserTag, FaUserShield, FaSave, FaArrowLeft, FaBriefcase, FaMapMarkerAlt, FaGraduationCap, FaCertificate, FaTools } from 'react-icons/fa';
import { Fade } from 'react-reveal';
import "../../CSS/viewProfile.css";
import NavbarBuyer from "../Includes/NavbarBuyer";
import NavbarSeller from "../Includes/NavbarSeller";
import NavbarAdmin from "../Includes/NavbarAdmin";

const UpdateProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    description: '',
    address: '',
    qualification: '',
    expertise: [],
    certificates: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/profile/view/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user profile.');
        }

        const data = await response.json();
        setUser(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          username: data.username || '',
          description: data.description || '',
          address: data.address || '',
          qualification: data.qualification || '',
          expertise: data.expertise || [],
          certificates: data.certificates || []
        });
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (e, field) => {
    const value = e.target.value;
    const array = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [field]: array
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:4000/api/profile/update/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile.');
      }

      setMessage('Profile updated successfully.');
      setTimeout(() => {
        navigate(`/profile`);
      }, 2000);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

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

  return (
    <div className="view-profile-container">
      {renderNavbar()}
      <div className="profile-header">
        <Fade top>
          <h1>
            <FaUser className="me-2" />
            Update Profile
          </h1>
        </Fade>
      </div>

      <div className="profile-content">
        <div className="profile-main">
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-section">
              <h2>Basic Information</h2>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {user?.role === 'Seller' && (
              <div className="profile-section">
                <h2>Seller Details</h2>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="qualification">Qualification</label>
                  <input
                    type="text"
                    id="qualification"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="expertise">Expertise (comma-separated)</label>
                  <input
                    type="text"
                    id="expertise"
                    value={formData.expertise.join(', ')}
                    onChange={(e) => handleArrayChange(e, 'expertise')}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="certificates">Certificates (comma-separated)</label>
                  <input
                    type="text"
                    id="certificates"
                    value={formData.certificates.join(', ')}
                    onChange={(e) => handleArrayChange(e, 'certificates')}
                  />
                </div>
              </div>
            )}

            <div className="profile-actions">
              <button type="submit" className="action-button primary-button">
                <FaSave className="me-2" /> Save Changes
              </button>
              <button type="button" className="action-button secondary-button" onClick={handleGoBack}>
                <FaArrowLeft className="me-2" /> Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default UpdateProfile;
