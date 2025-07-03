import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaFilter,
  FaEye,
  FaIdCard,
  FaCamera,
  FaFileInvoice,
  FaSignature,
  FaExclamationTriangle,
  FaUser,
  FaUserTie
} from 'react-icons/fa';
import '../../CSS/admin-verification.css';
import NavbarAdmin from "../Includes/NavbarAdmin";

const VerificationRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState({
    status: '',
    role: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || user.role !== 'Admin') {
      navigate('/login');
      return;
    }

    fetchVerificationRequests();
  }, [navigate, filter]);

  const fetchVerificationRequests = async () => {
    try {
      setLoading(true);
      
      // Build query params
      const queryParams = new URLSearchParams();
      if (filter.status) queryParams.append('status', filter.status);
      if (filter.role) queryParams.append('role', filter.role);
      
      const response = await fetch(`http://localhost:4000/api/verification/all?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch verification requests');
      }
      
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      setError('Failed to fetch verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleProcessRequest = async (action) => {
    try {
      setIsProcessing(true);
      
      if (action === 'reject' && !rejectionReason) {
        alert('Please provide a reason for rejection');
        setIsProcessing(false);
        return;
      }
      
      const response = await fetch(`http://localhost:4000/api/verification/${selectedRequest._id}/update-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
          adminId: JSON.parse(sessionStorage.getItem('user')).id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }
      
      // Close modal and update requests
      setShowModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchVerificationRequests();
    } catch (error) {
      console.error('Error processing verification request:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && requests.length === 0) {
    return (
      <div className="verification-admin-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading verification requests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verification-admin-container">
        <div className="error-state">
          <FaTimesCircle size={50} color="#F44336" />
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={fetchVerificationRequests}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderNavbar = () => {
    return <NavbarAdmin />;
  };

  return (
    <div>
{renderNavbar()}

    
    <div className="verification-admin-container">
      
      <div className="verification-admin-header">
        <h2>Verification Requests</h2>
        
        <div className="filters-container">
          <div className="filter-group">
            <label><FaFilter /> Filter by:</label>
            
            <select 
              value={filter.status} 
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
            
            <select 
              value={filter.role} 
              onChange={(e) => setFilter({ ...filter, role: e.target.value })}
            >
              <option value="">All Roles</option>
              <option value="Buyer">Buyers</option>
              <option value="Seller">Sellers</option>
            </select>
            
            <button 
              className="btn-secondary"
              onClick={() => setFilter({ status: '', role: '' })}
            >
              Reset Filters
            </button>
          </div>
          
          <div className="count-badge">
            {requests.length} {filter.status || 'Total'} Requests
          </div>
        </div>
      </div>
      
      {requests.length === 0 ? (
        <div className="empty-state">
          <FaExclamationTriangle size={50} color="#FF9800" />
          <h3>No Verification Requests Found</h3>
          <p>There are no verification requests matching your filters.</p>
        </div>
      ) : (
        <div className="verification-requests-table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Submitted On</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id} className={`status-${request.status.toLowerCase()}`}>
                  <td>
                    <div className="user-cell">
                      {request.role === 'Buyer' ? <FaUser /> : <FaUserTie />}
                      <div>
                        <span className="user-name">{request.user.name}</span>
                        <span className="user-email">{request.user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{request.role}</td>
                  <td>{formatDate(request.submittedAt)}</td>
                  <td>
                    <span className={`status-badge ${request.status.toLowerCase()}`}>
                      {request.status === 'Approved' && <FaCheckCircle />}
                      {request.status === 'Rejected' && <FaTimesCircle />}
                      {request.status === 'Pending' && <FaExclamationTriangle />}
                      {request.status}
                    </span>
                  </td>
                  <td className="attempts-cell">
                    {request.attemptCount} / 3
                    {request.attemptCount > 1 && (
                      <span className="multiple-attempts">Multiple</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="action-button view-button"
                      onClick={() => handleViewRequest(request)}
                    >
                      <FaEye /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal for viewing verification details */}
      {showModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="verification-detail-modal">
            <div className="modal-header">
              <h3>Verification Request Details</h3>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-content">
              <div className="request-info">
                <div className="info-section">
                  <h4>User Information</h4>
                  <div className="info-group">
                    <div className="info-item">
                      <span className="label">Name:</span>
                      <span className="value">{selectedRequest.user.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Email:</span>
                      <span className="value">{selectedRequest.user.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Role:</span>
                      <span className="value">{selectedRequest.role}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Status:</span>
                      <span className={`value status-text ${selectedRequest.status.toLowerCase()}`}>
                        {selectedRequest.status}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Submitted:</span>
                      <span className="value">{formatDate(selectedRequest.submittedAt)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Attempt:</span>
                      <span className="value">{selectedRequest.attemptCount} of 3</span>
                    </div>
                  </div>
                </div>
                
                {selectedRequest.rejectionReason && (
                  <div className="rejection-reason">
                    <h4>Rejection Reason</h4>
                    <p>{selectedRequest.rejectionReason}</p>
                  </div>
                )}
                
                <div className="documents-section">
                  <h4>Verification Documents</h4>
                  
                  <div className="documents-grid">
                    <div className="document-item">
                      <div className="document-header">
                        <FaIdCard /> Government ID
                      </div>
                      <div className="document-preview">
                        {selectedRequest.documents.governmentId ? (
                          selectedRequest.documents.governmentId.endsWith('.pdf') ? (
                            <a href={`http://localhost:4000${selectedRequest.documents.governmentId}`} target="_blank" rel="noopener noreferrer" className="pdf-link">
                              View PDF Document
                            </a>
                          ) : (
                            <img 
                              src={`http://localhost:4000${selectedRequest.documents.governmentId}`} 
                              alt="Government ID" 
                              className="document-image"
                            />
                          )
                        ) : (
                          <div className="not-provided">Not provided</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="document-item">
                      <div className="document-header">
                        <FaCamera /> Selfie with ID
                      </div>
                      <div className="document-preview">
                        {selectedRequest.documents.selfieWithId ? (
                          selectedRequest.documents.selfieWithId.endsWith('.pdf') ? (
                            <a href={`http://localhost:4000${selectedRequest.documents.selfieWithId}`} target="_blank" rel="noopener noreferrer" className="pdf-link">
                              View PDF Document
                            </a>
                          ) : (
                            <img 
                              src={`http://localhost:4000${selectedRequest.documents.selfieWithId}`} 
                              alt="Selfie with ID" 
                              className="document-image"
                            />
                          )
                        ) : (
                          <div className="not-provided">Not provided</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="document-item">
                      <div className="document-header">
                        <FaFileInvoice /> Address Proof
                      </div>
                      <div className="document-preview">
                        {selectedRequest.documents.addressProof ? (
                          selectedRequest.documents.addressProof.endsWith('.pdf') ? (
                            <a href={`http://localhost:4000${selectedRequest.documents.addressProof}`} target="_blank" rel="noopener noreferrer" className="pdf-link">
                              View PDF Document
                            </a>
                          ) : (
                            <img 
                              src={`http://localhost:4000${selectedRequest.documents.addressProof}`} 
                              alt="Address Proof" 
                              className="document-image"
                            />
                          )
                        ) : (
                          <div className="not-provided">Not provided</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="document-item">
                      <div className="document-header">
                        <FaSignature /> Digital Signature
                      </div>
                      <div className="document-preview">
                        {selectedRequest.documents.digitalSignature ? (
                          selectedRequest.documents.digitalSignature.endsWith('.pdf') ? (
                            <a href={`http://localhost:4000${selectedRequest.documents.digitalSignature}`} target="_blank" rel="noopener noreferrer" className="pdf-link">
                              View PDF Document
                            </a>
                          ) : (
                            <img 
                              src={`http://localhost:4000${selectedRequest.documents.digitalSignature}`} 
                              alt="Digital Signature" 
                              className="document-image"
                            />
                          )
                        ) : (
                          <div className="not-provided">Not provided</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedRequest.status === 'Pending' && (
                <div className="action-section">
                  <h4>Process Request</h4>
                  
                  <div className="rejection-form">
                    <label>Rejection Reason (required if rejecting):</label>
                    <textarea
                      rows="3"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason for rejection..."
                    ></textarea>
                  </div>
                  
                  <div className="action-buttons">
                    <button 
                      className="btn-danger"
                      onClick={() => handleProcessRequest('reject')}
                      disabled={isProcessing}
                    >
                      <FaTimesCircle /> Reject
                    </button>
                    <button 
                      className="btn-success"
                      onClick={() => handleProcessRequest('approve')}
                      disabled={isProcessing}
                    >
                      <FaCheckCircle /> Approve
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default VerificationRequests;