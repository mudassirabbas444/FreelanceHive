import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaIdCard, FaCamera, FaFileInvoice, FaEnvelope, FaUpload, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import '../../CSS/verification.css';
import NavbarBuyer from "../Includes/NavbarBuyer";
import NavbarSeller from "../Includes/NavbarSeller"; 
import NavbarAdmin from "../Includes/NavbarAdmin";

const VerificationForm = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [formData, setFormData] = useState({
    governmentId: null,
    selfieWithId: null,
    addressProof: null,
    digitalSignature: null,
    emailVerification: null
  });
  const [previewUrls, setPreviewUrls] = useState({
    governmentId: null,
    selfieWithId: null,
    addressProof: null,
    digitalSignature: null,
    emailVerification: null
  });

  useEffect(() => {
    // Get user data from session storage
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    // Check current verification status
    fetchVerificationStatus(parsedUser.id);
  }, [navigate]);

  const fetchVerificationStatus = async (userId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/verification/status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch verification status');
      }
      
      const status = await response.json();
      setVerificationStatus(status);
    } catch (error) {
      console.error('Error fetching verification status:', error);
      setError('Failed to fetch verification status');
    }
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

  const handleFileChange = (event, documentType) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(`File too large. Maximum size is 5MB.`);
      return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError(`Invalid file type. Please upload JPEG, PNG or PDF.`);
      return;
    }
    
    // Update form data
    setFormData({
      ...formData,
      [documentType]: file
    });
    
    // Create preview URL for images (not PDFs)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls({
          ...previewUrls,
          [documentType]: reader.result
        });
      };
      reader.readAsDataURL(file);
    } else {
      // For PDFs, just show a placeholder
      setPreviewUrls({
        ...previewUrls,
        [documentType]: 'pdf'
      });
    }
    
    // Clear any previous errors
    setError(null);
  };

  // Function to trigger file input click
  const triggerFileInput = (documentType) => {
    document.getElementById(`${documentType}-input`).click();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    // Validation
    const requiredDocs = ['governmentId', 'selfieWithId', 'addressProof'];
    const missingDocs = requiredDocs.filter(doc => !formData[doc]);
    
    if (missingDocs.length > 0) {
      setError(`Please upload all required documents: ${missingDocs.join(', ')}`);
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Debug user data
      console.log('Current user data:', user);
      
      if (!user || !user.id) {
        throw new Error('User data is not available. Please log in again.');
      }
      
      const submitData = new FormData();
      
      // Add user ID and role to form data
      submitData.append('userId', user.id);
      submitData.append('role', user.role);
      
      // Debug form data
      console.log('Form data being sent:', {
        userId: user.id,
        role: user.role,
        documents: Object.keys(formData).filter(key => formData[key])
      });
      
      // Append all files to form data
      Object.entries(formData).forEach(([docType, file]) => {
        if (file) {
          submitData.append(docType, file);
        }
      });
      
      // Determine if this is a new submission or resubmission
      const isResubmission = verificationStatus && 
                            verificationStatus.status === 'Rejected' && 
                            verificationStatus.attemptCount > 0;
      
      const endpoint = isResubmission 
        ? `http://localhost:4000/api/verification/resubmit/${user.id}`
        : `http://localhost:4000/api/verification/submit`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: submitData,
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit verification request');
      }
      
      const result = await response.json();
      setSuccess(isResubmission 
        ? 'Verification documents resubmitted successfully!' 
        : 'Verification request submitted successfully!');
      
      // Refresh verification status
      fetchVerificationStatus(user.id);
    } catch (error) {
      console.error('Error submitting verification:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = () => {
    if (!verificationStatus) return null;
    
    let badgeClass, icon, text;
    
    switch (verificationStatus.status) {
      case 'Approved':
        badgeClass = 'status-badge approved';
        icon = <FaCheckCircle />;
        text = 'Approved';
        break;
      case 'Rejected':
        badgeClass = 'status-badge rejected';
        icon = <FaTimesCircle />;
        text = 'Rejected';
        break;
      case 'Pending':
        badgeClass = 'status-badge pending';
        icon = <FaExclamationTriangle />;
        text = 'Pending Review';
        break;
      default:
        badgeClass = 'status-badge not-submitted';
        icon = <FaInfoCircle />;
        text = 'Not Submitted';
    }
    
    return (
      <div className={badgeClass}>
        {icon} <span>{text}</span>
      </div>
    );
  };

  // If user is already verified, show a message
  if (verificationStatus && verificationStatus.status === 'Approved') {
    return (
      <div className="verification-container">
        <div className="verification-card">
          <div className="verification-header">
            <h2>Account Verification</h2>
            {renderStatusBadge()}
          </div>
          <div className="verification-success">
            <FaCheckCircle size={50} color="#4CAF50" />
            <h3>Your account is verified!</h3>
            <p>You have successfully completed the verification process.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If verification is pending, show status message
  if (verificationStatus && verificationStatus.status === 'Pending') {
    return (
      <div className="verification-container">
        <div className="verification-card">
          <div className="verification-header">
            <h2>Account Verification</h2>
            {renderStatusBadge()}
          </div>
          <div className="verification-pending">
            <FaExclamationTriangle size={50} color="#FF9800" />
            <h3>Verification In Progress</h3>
            <p>Your verification request is currently being reviewed.</p>
            <p>Please check back later for updates.</p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user has reached maximum attempts
  if (verificationStatus && verificationStatus.attemptCount >= 3 && verificationStatus.status === 'Rejected') {
    return (
      <div className="verification-container">
        <div className="verification-card">
          <div className="verification-header">
            <h2>Account Verification</h2>
            {renderStatusBadge()}
          </div>
          <div className="verification-max-attempts">
            <FaTimesCircle size={50} color="#F44336" />
            <h3>Maximum Attempts Reached</h3>
            <p>You have reached the maximum number of verification attempts (3).</p>
            <p>Please contact customer support for assistance.</p>
            <button onClick={() => navigate('/contact')} className="btn-primary">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
    {renderNavbar()}
    <div className="verification-container">
        
      <div className="verification-card">
        <div className="verification-header">
          <h2>Account Verification</h2>
          {renderStatusBadge()}
        </div>
        
        {verificationStatus && verificationStatus.status === 'Rejected' && (
          <div className="rejection-message">
            <FaTimesCircle /> 
            <div>
              <h4>Verification Rejected</h4>
              <p>{verificationStatus.rejectionReason || 'Your verification was rejected. Please resubmit with the correct documents.'}</p>
              <p>Attempt {verificationStatus.attemptCount} of 3</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <FaTimesCircle /> {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            <FaCheckCircle /> {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="verification-form">
          <div className="form-section">
            <h3>Required Documents</h3>
            <p className="form-note">
              <FaInfoCircle /> Please upload clear, legible copies of your documents
            </p>
            
            <div className="document-upload-container">
              <div className="document-upload-item">
                <label className="document-label">
                  <FaIdCard /> Government-issued ID*
                </label>
                <div className="document-upload-box">
                  {previewUrls.governmentId ? (
                    <div className="preview-container">
                      {previewUrls.governmentId === 'pdf' ? (
                        <div className="pdf-placeholder">PDF Document</div>
                      ) : (
                        <img src={previewUrls.governmentId} alt="ID Preview" className="document-preview" />
                      )}
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaUpload />
                      <span>Upload ID</span>
                    </div>
                  )}
                  <div className="upload-button" onClick={() => triggerFileInput('governmentId')}>Choose File</div>
                  <input
                    type="file"
                    id="governmentId-input"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => handleFileChange(e, 'governmentId')}
                    className="file-input"
                  />
                </div>
                <p className="document-helper-text">Passport, Driver's License, or National ID</p>
              </div>
              
              <div className="document-upload-item">
                <label className="document-label">
                  <FaCamera /> Selfie with ID*
                </label>
                <div className="document-upload-box">
                  {previewUrls.selfieWithId ? (
                    <div className="preview-container">
                      {previewUrls.selfieWithId === 'pdf' ? (
                        <div className="pdf-placeholder">PDF Document</div>
                      ) : (
                        <img src={previewUrls.selfieWithId} alt="Selfie Preview" className="document-preview" />
                      )}
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaUpload />
                      <span>Upload Selfie</span>
                    </div>
                  )}
                  <div className="upload-button" onClick={() => triggerFileInput('selfieWithId')}>Choose File</div>
                  <input
                    type="file"
                    id="selfieWithId-input"
                    accept="image/jpeg,image/png"
                    onChange={(e) => handleFileChange(e, 'selfieWithId')}
                    className="file-input"
                  />
                </div>
                <p className="document-helper-text">A photo of yourself holding your ID</p>
              </div>
              
              <div className="document-upload-item">
                <label className="document-label">
                  <FaFileInvoice /> Address Proof*
                </label>
                <div className="document-upload-box">
                  {previewUrls.addressProof ? (
                    <div className="preview-container">
                      {previewUrls.addressProof === 'pdf' ? (
                        <div className="pdf-placeholder">PDF Document</div>
                      ) : (
                        <img src={previewUrls.addressProof} alt="Address Proof Preview" className="document-preview" />
                      )}
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaUpload />
                      <span>Upload Document</span>
                    </div>
                  )}
                  <div className="upload-button" onClick={() => triggerFileInput('addressProof')}>Choose File</div>
                  <input
                    type="file"
                    id="addressProof-input"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => handleFileChange(e, 'addressProof')}
                    className="file-input"
                  />
                </div>
                <p className="document-helper-text">Utility Bill or Bank Statement (within last 3 months)</p>
              </div>
              
              <div className="document-upload-item">
                <label className="document-label">
                  <FaCamera /> Profile Picture
                </label>
                <div className="document-upload-box">
                  {previewUrls.digitalSignature ? (
                    <div className="preview-container">
                      <img src={previewUrls.digitalSignature} alt="Profile Picture Preview" className="document-preview" />
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaUpload />
                      <span>Upload Picture</span>
                    </div>
                  )}
                  <div className="upload-button" onClick={() => triggerFileInput('digitalSignature')}>Choose File</div>
                  <input
                    type="file"
                    id="digitalSignature-input"
                    accept="image/jpeg,image/png"
                    onChange={(e) => handleFileChange(e, 'digitalSignature')}
                    className="file-input"
                  />
                </div>
                <p className="document-helper-text">Upload a clear profile picture</p>
              </div>
            </div>
          </div>
          
          <div className="verification-form-footer">
            <p>* Required documents</p>
            <div className="form-buttons">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigate('/profile')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : (verificationStatus && verificationStatus.status === 'Rejected' ? 'Resubmit Documents' : 'Submit for Verification')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
};

export default VerificationForm; 