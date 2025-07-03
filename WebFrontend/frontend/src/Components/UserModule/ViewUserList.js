import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import "../../CSS/viewUserList.css";
import NavbarAdmin from "../Includes/NavbarAdmin";
import { UserPlus, Shield, Search, AlertTriangle, Check, X, Trash2, UserX, UserCheck, FileCheck } from 'lucide-react';

const ViewUserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Admin") {
      alert("Access denied. Please log in as a Admin.");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUserList = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/users/list`);
        if (!response.ok) {
          throw new Error('Failed to fetch user list.');
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserList();
  }, []);

  const showConfirmation = (type, userId) => {
    setActionType(type);
    setSelectedUserId(userId);
    setShowConfirmModal(true);
  };

  const handleBlockUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/users/block/${userId}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to block user.');
      }

      setMessage('User blocked successfully.');
      setUsers(users.map(user => user._id === userId ? { ...user, isBlocked: true } : user));
    } catch (error) {
      setError(error.message);
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/users/unblock/${userId}`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to unblock user.');
      }

      setMessage('User unblocked successfully.');
      setUsers(users.map(user => user._id === userId ? { ...user, isBlocked: false } : user));
    } catch (error) {
      setError(error.message);
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/profile/delete/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user.');
      }

      setMessage('User deleted successfully.');
      setUsers(users.filter(user => user._id !== userId));
    } catch (error) {
      setError(error.message);
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handleConfirmAction = () => {
    if (actionType === 'block') {
      handleBlockUser(selectedUserId);
    } else if (actionType === 'unblock') {
      handleUnblockUser(selectedUserId);
    } else if (actionType === 'delete') {
      handleDeleteUser(selectedUserId);
    }
  };

  const handleRole = () => {
    navigate("/role");
  };
  
  const handleAdmin = () => {
    navigate("/createProfile");
  };

  const handleVerificationRequests = () => {
    navigate("/admin/verification");
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dismissMessage = () => {
    setMessage('');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    
    <> <NavbarAdmin/>
    <div className="user-list-container">
      <div className="admin-header">
        <h1>User Management</h1>
        <div className="admin-actions">
          <button 
            onClick={handleVerificationRequests} 
            className="admin-button verification-button"
          >
            <FileCheck size={18} />
            View Verifications
          </button>
          <button 
            onClick={handleRole} 
            className="admin-button role-button"
          >
            <Shield size={18} />
            Create Role
          </button>
          <button 
            onClick={handleAdmin} 
            className="admin-button admin-button"
          >
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </div>
      
      {message && (
        <div className="message-container">
          <Check size={18} className="message-icon" />
          <span>{message}</span>
          <button onClick={dismissMessage} className="dismiss-button">
            <X size={16} />
          </button>
        </div>
      )}
      
      <div className="search-container">

        <input
          type="text"
          placeholder="Search users by name, email or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      {filteredUsers.length === 0 ? (
        <div className="no-users">
          <p>No users found matching your search criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="action-buttons">
                    {user.isBlocked ? (
                      <button 
                        onClick={() => showConfirmation('unblock', user._id)}
                        className="unblock-button"
                        title="Unblock User"
                      >
                        <UserCheck size={16} />
                        <span>Unblock</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => showConfirmation('block', user._id)}
                        className="block-button"
                        title="Block User"
                      >
                        <UserX size={16} />
                        <span>Block</span>
                      </button>
                    )}
                    <button 
                      onClick={() => showConfirmation('delete', user._id)}
                      className="delete-button"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <AlertTriangle size={48} className="warning-icon" />
            <h3>
              {actionType === 'block' ? 'Block User' : 
               actionType === 'unblock' ? 'Unblock User' : 
               'Delete User'}
            </h3>
            <p>
              {actionType === 'block' ? 'Are you sure you want to block this user? They will no longer be able to access the platform.' : 
               actionType === 'unblock' ? 'Are you sure you want to unblock this user? This will restore their access to the platform.' : 
               'Are you sure you want to delete this user? This action cannot be undone.'}
            </p>
            <div className="modal-buttons">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmAction}
                className={`confirm-button ${actionType === 'delete' ? 'delete' : ''}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default ViewUserList;