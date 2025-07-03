import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaSave, FaArrowLeft } from 'react-icons/fa';
import { Fade } from 'react-reveal';
import "../../CSS/createProfile.css";
import NavbarAdmin from "../Includes/NavbarAdmin";

const CreateRole = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    roleName: '',
    description: '',
    permissions: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, value]
        : prev.permissions.filter(permission => permission !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create role.');
      }

      setMessage('Role created successfully!');
      setTimeout(() => {
        navigate('/admin/roles');
      }, 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const availablePermissions = [
    'view_profile',
    'edit_profile',
    'delete_profile',
    'create_gig',
    'edit_gig',
    'delete_gig',
    'view_gigs',
    'create_order',
    'edit_order',
    'delete_order',
    'view_orders',
    'manage_users',
    'manage_roles',
    'manage_categories',
    'view_analytics'
  ];

  return (
    <><NavbarAdmin />
    <div className="create-profile-container">
      <div className="create-profile-form">
        <div className="form-header">
          <Fade top>
            <h1>
              <FaUserShield className="me-2" />
              Create New Role
            </h1>
          </Fade>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>Role Information</h2>
            <div className="form-group">
              <label htmlFor="roleName">Role Name</label>
              <input
                type="text"
                id="roleName"
                name="roleName"
                value={formData.roleName}
                onChange={handleChange}
                required
                placeholder="Enter role name (e.g., Admin, Moderator)"
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the role and its responsibilities"
                rows="4"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Permissions</h2>
            <div className="permissions-grid">
              {availablePermissions.map((permission) => (
                <div key={permission} className="checkbox-group">
                  <input
                    type="checkbox"
                    id={permission}
                    value={permission}
                    checked={formData.permissions.includes(permission)}
                    onChange={handlePermissionChange}
                  />
                  <label htmlFor={permission}>
                    {permission.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="action-button primary-button" disabled={loading}>
              <FaSave className="me-2" /> {loading ? 'Creating...' : 'Create Role'}
            </button>
            <button type="button" className="action-button secondary-button" onClick={handleGoBack}>
              <FaArrowLeft className="me-2" /> Cancel
            </button>
          </div>
        </form>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
    </>
  );
};

export default CreateRole;
