import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Alert, Spinner, Form, Modal } from "react-bootstrap";
import { FaDownload,FaArrowLeft, FaTrash, FaLock, FaComment, FaTag, FaCalendarAlt, FaDollarSign, FaInfoCircle, FaExclamationTriangle, FaUser, FaRegClock, FaComments, FaHandshake, FaCheck, FaUpload } from "react-icons/fa";
import { Fade } from 'react-reveal';
import NavbarBuyer from "../Includes/NavbarBuyer";
import { ToastContainer, Toast } from "react-bootstrap";
import '../../CSS/ideaDetailCustom.css';


const IdeaDetail = () => {
    const { ideaId } = useParams();
    const navigate = useNavigate();
    const [ideaDetails, setIdeaDetails] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const user = JSON.parse(sessionStorage.getItem("user"));
    const [showShareholderModal, setShowShareholderModal] = useState(false);
    const [selectedReply, setSelectedReply] = useState(null);
    const [contributionType, setContributionType] = useState("");
    const [contributionDetails, setContributionDetails] = useState("");
    const [equityRequested, setEquityRequested] = useState("");
    const [showAgreement, setShowAgreement] = useState(false);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [requestData, setRequestData] = useState({
        contributionType: '',
        contributionDetails: '',
        equityRequested: '',
        ideaTitle: '',
        sellerName: ''
    });
    const [shareholderRequests, setShareholderRequests] = useState([]);
    const [acceptedRequest, setAcceptedRequest] = useState(null);
    const [showShareholderAgreement, setShowShareholderAgreement] = useState(false);
    const [agreementPdf, setAgreementPdf] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadDeadline, setUploadDeadline] = useState(null);
    const [agreementUrl, setAgreementUrl] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        contributionType: '',
        contributionDetails: '',
        equityRequested: ''
    });

    useEffect(() => {
        if (!user || user.role !== "Buyer") {
            setError("Access denied. Please log in as a Buyer.");
            navigate("/");
            return;
        }
        fetchData();
        if (user && user.id) {
            fetchShareholderRequests();
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [ideaRes, repliesRes] = await Promise.all([
                fetch(`http://localhost:4000/api/idea/${ideaId}`, {
                    headers: { "Authorization": `Bearer ${sessionStorage.getItem('token')}` }
                }),
                fetch(`http://localhost:4000/api/idea/${ideaId}/replies`, {
                    headers: { "Authorization": `Bearer ${sessionStorage.getItem('token')}` }
                })
            ]);

            if (!ideaRes.ok) throw new Error("Failed to fetch idea details");
            if (!repliesRes.ok) throw new Error("Failed to fetch replies");

            const ideaData = await ideaRes.json();
            const repliesData = await repliesRes.json();

            console.log('Fetched replies:', repliesData); // Debug log

            // Filter replies to only show completed ones
            const completedReplies = repliesData.filter(reply => reply.status === 'completed');

            // Fetch shareholder requests for each reply
            const repliesWithRequests = await Promise.all(completedReplies.map(async (reply) => {
                try {
                    console.log('Fetching request for reply:', reply); // Debug log
                    const requestRes = await fetch(`http://localhost:4000/api/shareholder-request/reply/${reply.replyId}`, {
                        headers: { "Authorization": `Bearer ${sessionStorage.getItem('token')}` }
                    });
                    
                    if (requestRes.ok) {
                        const requestData = await requestRes.json();
                        console.log('Fetched request data:', requestData); // Debug log
                        return { ...reply, shareholderRequest: requestData };
                    }
                    return reply;
                } catch (error) {
                    console.error("Error fetching shareholder request:", error);
                    return reply;
                }
            }));

            console.log('Replies with requests:', repliesWithRequests); // Debug log

            setIdeaDetails(ideaData);
            setReplies(repliesWithRequests);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [ideaId]);

    const fetchShareholderRequests = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/shareholder-request/buyer/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setShareholderRequests(data);
                
                // Check if any request is accepted
                const accepted = data.find(request => request.status === 'accepted' && request.ideaId === ideaId);
                if (accepted) {
                    setAcceptedRequest(accepted);
                    // Only show the reply that was accepted
                    const acceptedReply = replies.find(reply => reply.replyId === accepted.replyId);
                    if (acceptedReply) {
                        setReplies([acceptedReply]);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching shareholder requests:", error);
        }
    };

    const handleAction = async (action) => {
        if (!window.confirm(`Are you sure you want to ${action} this idea?`)) return;

        try {
            setSubmitting(true);
            setError(null);

            const response = await fetch(`http://localhost:4000/api/idea/${action}/${ideaId}`, {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Failed to ${action} idea`);
            }

            navigate("/ideas", {
                state: { message: `Idea ${action}d successfully`, type: "success" }
            });
        } catch (error) {
            console.error("Error:", error);
            setError(error.message || "An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleShareholderRequest = (reply) => {
        setSelectedReply(reply);
        setShowModal(true);
        setError('');
    };

    const handleModalClose = () => {
        setShowModal(false);
        setFormData({
            contributionType: '',
            contributionDetails: '',
            equityRequested: ''
        });
        setError('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitShareholderRequest = async (e) => {
        e.preventDefault();
        try {
            if (!formData.contributionType || !formData.contributionDetails || !formData.equityRequested) {
                setError('All fields are required');
                return;
            }

            const requestData = {
                buyerId: user._id,
                sellerId: selectedReply.userId,
                ideaId: ideaDetails._id,
                replyId: selectedReply.replyId,
                ideaTitle: ideaDetails.title,
                contributionType: formData.contributionType,
                contributionDetails: formData.contributionDetails,
                equityRequested: formData.equityRequested,
                buyerName: user.name,
                sellerName: selectedReply.sellerName
            };

            const response = await fetch('http://localhost:4000/api/shareholder-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error sending shareholder request');
            }

            setShowToast(true);
            setToastMessage('Shareholder request sent successfully! Please review and download the agreement.');
            setToastVariant('success');
            setShowModal(false);
            setShowAgreement(true);
            setAgreementUrl(data.agreementPdf);
            setUploadDeadline(new Date(Date.now() + 24 * 60 * 60 * 1000));
            
            // Refresh the data
            fetchData();
        } catch (error) {
            console.error('Error details:', error);
            setError(error.message || 'Error sending shareholder request');
            setShowToast(true);
            setToastMessage(error.message || 'Error sending shareholder request');
            setToastVariant('danger');
        }
    };

    const handleDownloadAgreement = () => {
        if (agreementUrl) {
            window.open(`http://localhost:4000${agreementUrl}`, '_blank');
        }
    };

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUploadSignedAgreement = async (requestId) => {
        try {
            if (!selectedFile) {
                setError('Please select a file to upload');
                setShowToast(true);
                setToastMessage('Please select a file to upload');
                setToastVariant('warning');
                return;
            }

            if (selectedFile.type !== 'application/pdf') {
                setError('Only PDF files are allowed');
                setShowToast(true);
                setToastMessage('Only PDF files are allowed');
                setToastVariant('warning');
                return;
            }

            // Show loading toast
            setShowToast(true);
            setToastMessage('Uploading signed agreement...');
            setToastVariant('info');

            const formData = new FormData();
            formData.append('pdf', selectedFile);
            formData.append('requestId', requestId);
            formData.append('userId', user.id);
            formData.append('role', 'Buyer');

            const response = await fetch('http://localhost:4000/api/shareholder-request/upload-pdf', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error uploading signed agreement');
            }

            // Show success message
            setShowToast(true);
            setToastMessage(
                <div>
                    <strong>Success!</strong>
                    <br />
                    Your signed agreement has been uploaded successfully.
                    <br />
                    Waiting for the seller to review and upload their signed agreement.
                </div>
            );
            setToastVariant('success');
            
            // Reset state
            setSelectedFile(null);
            
            // Refresh data
            await fetchData();
        } catch (error) {
            console.error('Upload error:', error);
            setError(error.message);
            setShowToast(true);
            setToastMessage(
                <div>
                    <strong>Error!</strong>
                    <br />
                    {error.message}
                    <br />
                    <small>Please try again or contact support if the problem persists.</small>
                </div>
            );
            setToastVariant('danger');
        }
    };

    const getStatusBadgeVariant = (status) => {
        switch(status?.toLowerCase()) {
            case "open": return "status-badge open";
            case "rejected": return "status-badge rejected";
            case "closed": return "status-badge closed";
            default: return "status-badge default";
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        if (!user || !user.id || !user.name) {
            setError("User information is missing. Please log in again.");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const requestBody = {
                buyerId: user.id,
                buyerName: user.name,
                sellerId: ideaDetails.sellerId,
                sellerName: ideaDetails.sellerName,
                ideaId: ideaId,
                ideaTitle: ideaDetails.title,
                contributionType: requestData.contributionType,
                contributionDetails: requestData.contributionDetails,
                equityRequested: parseFloat(requestData.equityRequested),
                status: 'pending'
            };

            const response = await fetch('http://localhost:4000/api/shareholder-request', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit request");
            }

            setShowRequestForm(false);
            setRequestData({
                contributionType: '',
                contributionDetails: '',
                equityRequested: '',
                ideaTitle: '',
                sellerName: ''
            });
            alert("Shareholder request submitted successfully!");
        } catch (error) {
            console.error("Error details:", error);
            setError(error.message || "Failed to submit request. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleShowRequestForm = () => {
        setRequestData({
            ...requestData,
            ideaTitle: ideaDetails.title,
            sellerName: ideaDetails.sellerName
        });
        setShowRequestForm(true);
    };

    const handleCompleteRequest = async (requestId) => {
        try {
            setShowToast(true);
            setToastMessage('Processing request completion...');
            setToastVariant('info');

            const response = await fetch(`http://localhost:4000/api/shareholder-request/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'finalized' })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error completing request');
            }

            setShowToast(true);
            setToastMessage('Request completed successfully!');
            setToastVariant('success');

            // Refresh data
            await fetchData();
        } catch (error) {
            console.error('Error completing request:', error);
            setShowToast(true);
            setToastMessage(error.message || 'Error completing request');
            setToastVariant('danger');
        }
    };

    const handleCancelRequest = async (requestId) => {
        try {
            if (!window.confirm('Are you sure you want to cancel this request?')) {
                return;
            }

            setShowToast(true);
            setToastMessage('Processing request cancellation...');
            setToastVariant('info');

            const response = await fetch(`http://localhost:4000/api/shareholder-request/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'cancelled' })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error cancelling request');
            }

            setShowToast(true);
            setToastMessage('Request cancelled successfully');
            setToastVariant('success');

            // Refresh data
            await fetchData();
        } catch (error) {
            console.error('Error cancelling request:', error);
            setShowToast(true);
            setToastMessage(error.message || 'Error cancelling request');
            setToastVariant('danger');
        }
    };

    return (
        <>
            <NavbarBuyer />
        <div className="idea-detail-container">
           
            
            <div className="idea-detail-header">
                <h1 className="idea-detail-title">Idea Details</h1>
                <p className="idea-detail-subtitle">View and manage your business idea</p>
            </div>

            {error && (
                <div className="idea-error-message">
                    <FaExclamationTriangle className="error-icon" />
                        {error}
                </div>
            )}

            {loading ? (
                <div className="idea-loading">
                    <div className="idea-spinner"></div>
                    <span>Loading...</span>
                </div>
            ) : ideaDetails ? (
                <Fade bottom>
                    <div className="idea-detail-card">
                        <div className="idea-detail-nav">
                            <button 
                                className="idea-back-button"
                                    onClick={() => navigate("/ideas")}
                                >
                                <FaArrowLeft /> Back to Ideas
                            </button>
                            <span className={`idea-status-badge ${ideaDetails.status.toLowerCase()}`}>
                                    {ideaDetails.status}
                                </span>
                            </div>

                        <div className="idea-category-tag">
                            <FaTag />
                                    {ideaDetails.category}
                                </div>
                                
                        <h2 className="idea-title">{ideaDetails.title}</h2>
                                
                        <div className="idea-meta-info">
                            <div className="idea-meta-item">
                                <FaUser />
                                <span>Created by {ideaDetails.buyerName}</span>
                                    </div>
                            <div className="idea-meta-item">
                                <FaRegClock />
                                <span>Created on {new Date(ideaDetails.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                                            
                        <div className="idea-description">
                                    <h3 className="section-title">
                                <FaInfoCircle /> Description
                                    </h3>
                            <p>{ideaDetails.description}</p>
                                </div>

                                {replies.length > 0 && (
                            <div className="idea-replies-section">
                                        <h3 className="section-title">
                                    <FaComment /> Replies ({replies.length})
                                        </h3>
                                <div className="idea-replies-list">
                                    {replies.map((reply, index) => (
                                        <div key={index} className="idea-reply-card">
                                            <div className="idea-reply-header">
                                                <FaUser />
                                                <span className="idea-reply-author">{reply.sellerName}</span>
                                                <span className="idea-reply-date">
                                                                {new Date(reply.createdAt).toLocaleDateString()}
                                                            </span>
                                                <button 
                                                    className="idea-action-button primary"
                                                    onClick={() => navigate(`/chat/${reply.userId}`)}
                                                            >
                                                    <FaComments /> Chat with Seller
                                                </button>
                                                        </div>
                                            <p className="idea-reply-content">{reply.content}</p>
                                            
                                            {/* Agreement section */}
                                                                {reply.agreementPdf && (
                                                <div className="idea-agreement-section">
                                                    <h4 className="idea-agreement-title">Agreement Documents</h4>
                                                                        <a 
                                                                            href={`http://localhost:4000${reply.agreementPdf}`}
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                        className="idea-agreement-link"
                                                                        >
                                                        <FaDownload /> View Agreement
                                                                        </a>
                                                                    </div>
                                                                )}

                                            {/* Shareholder Request Button */}
                                            {ideaDetails.status === "open" && 
                                             !reply.shareholderRequest && 
                                             !acceptedRequest && (
                                                <div className="idea-action-buttons">
                                                    <button 
                                                        className="idea-action-button primary"
                                                        onClick={() => handleShareholderRequest(reply)}
                                                        disabled={!reply.agreementPdf}
                                                    >
                                                        <FaHandshake />
                                                        {!reply.agreementPdf 
                                                            ? "Waiting for Seller's Signed Agreement" 
                                                            : "Send Shareholder Request"
                                                        }
                                                    </button>
                                                        </div>
                                            )}

                                            {/* Show Shareholder Request Status if exists */}
                                            {reply.shareholderRequest && (
                                                <div className="idea-shareholder-details">
                                                    <div className="idea-shareholder-status">
                                                        <div className={`idea-status-badge ${reply.shareholderRequest.status.toLowerCase()}`}>
                                                            <FaHandshake />
                                                            {reply.shareholderRequest.status === 'agreementPending' ? 'Agreement Pending' : 
                                                             reply.shareholderRequest.status === 'uploadSigned' ? 'Agreement Uploaded' :
                                                             reply.shareholderRequest.status === 'completed' ? 'Completed' :
                                                             reply.shareholderRequest.status === 'rejected' ? 'Rejected' : 'Pending'}
                                                        </div>
                                                    </div>

                                                    <div className="idea-agreement-details">
                                                                <h4>Shareholder Agreement Details</h4>
                                                        <p><strong>Contribution Type:</strong> {reply.shareholderRequest.contributionType}</p>
                                                        <p><strong>Contribution Details:</strong> {reply.shareholderRequest.contributionDetails}</p>
                                                        <p><strong>Equity Requested:</strong> {reply.shareholderRequest.equityRequested}%</p>
                                                        
                                                        {/* Initial Agreement Download */}
                                                        {reply.shareholderRequest.agreementPdf && (
                                                            <div className="idea-agreement-section">
                                                                <h5>Initial Agreement</h5>
                                                                        <a 
                                                                    href={`http://localhost:4000${reply.shareholderRequest.agreementPdf}`}
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                    className="idea-agreement-link"
                                                                        >
                                                                    <FaDownload /> Download Agreement
                                                                        </a>
                                                                    </div>
                                                                )}

                                                        {/* Agreement Upload Section */}
                                                        {reply.shareholderRequest.status === 'agreementPending' && 
                                                         !reply.shareholderRequest.buyerSignedAgreementPdf && (
                                                            <div className="idea-agreement-upload">
                                                                <h5>Upload Signed Agreement</h5>
                                                                <p className="idea-upload-note">
                                                                    Please upload your signed agreement within 24 hours
                                                                </p>
                                                                <div className="idea-upload-form">
                                                                    <input
                                                                                type="file"
                                                                                accept=".pdf"
                                                                        onChange={handleFileChange}
                                                                        className="idea-file-input"
                                                                            />
                                                                    <button
                                                                        className="idea-action-button primary"
                                                                        onClick={() => handleUploadSignedAgreement(reply.shareholderRequest._id)}
                                                                        disabled={!selectedFile}
                                                                    >
                                                                        <FaUpload /> Upload Signed Agreement
                                                                    </button>
                                                                </div>
                                                                    </div>
                                                                )}

                                                        {/* Buyer's Signed Agreement */}
                                                        {reply.shareholderRequest.buyerSignedAgreementPdf && (
                                                            <div className="idea-agreement-section">
                                                                        <h5>Your Signed Agreement</h5>
                                                                <p className="idea-agreement-date">
                                                                    Signed on: {new Date(reply.shareholderRequest.buyerSignedAt).toLocaleString()}
                                                                            </p>
                                                                            <a 
                                                                    href={`http://localhost:4000${reply.shareholderRequest.buyerSignedAgreementPdf}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                    className="idea-agreement-link"
                                                                            >
                                                                    <FaDownload /> View Your Signed Agreement
                                                                            </a>
                                                                    </div>
                                                                )}

                                                        {/* Seller's Final Signed Agreement */}
                                                        {reply.shareholderRequest.sellerSignedAgreementPdf && (
                                                            <div className="idea-agreement-section">
                                                                        <h5>Seller's Final Signed Agreement</h5>
                                                                <p className="idea-agreement-date">
                                                                    Signed on: {new Date(reply.shareholderRequest.sellerSignedAt).toLocaleString()}
                                                                            </p>
                                                                            <a 
                                                                    href={`http://localhost:4000${reply.shareholderRequest.sellerSignedAgreementPdf}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                    className="idea-agreement-link"
                                                                            >
                                                                    <FaDownload /> View Seller's Final Agreement
                                                                            </a>
                                                                    </div>
                                                                )}

                                                        {/* Agreement Status Message */}
                                                        {reply.shareholderRequest.status === 'agreementPending' && 
                                                         reply.shareholderRequest.buyerSignedAgreementPdf && (
                                                            <div className="idea-status-message info">
                                                                <FaInfoCircle />
                                                                Waiting for seller to review and upload their signed agreement
                                                                    </div>
                                                                )}
                                                            </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                    ))}
                                        </div>
                                    </div>
                                )}

                        <div className="idea-action-buttons">
                                    {ideaDetails.status === "open" && (
                                <button 
                                    className="idea-action-button primary"
                                            onClick={() => handleAction("close")} 
                                            disabled={submitting}
                                        >
                                    <FaLock />
                                            {submitting ? "Processing..." : "Close Idea"}
                                </button>
                                    )}
                                    {ideaDetails.status !== "deleted" && (
                                <button 
                                    className="idea-action-button danger"
                                            onClick={() => handleAction("delete")} 
                                            disabled={submitting}
                                        >
                                    <FaTrash />
                                            {submitting ? "Processing..." : "Delete Idea"}
                                </button>
                                    )}
                        </div>
                    </div>
                </Fade>
            ) : (
                <div className="idea-empty-state">
                    <div className="empty-icon">❌</div>
                    <h2>Idea Not Found</h2>
                    <p>The idea you're looking for doesn't exist or has been removed.</p>
                    <button 
                        className="idea-back-button"
                        onClick={() => navigate("/ideas")}
                    >
                        <FaArrowLeft /> Back to Ideas
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="idea-modal-overlay">
                    <div className="idea-modal">
                        <div className="idea-modal-header">
                            <h3 className="idea-modal-title">Send Shareholder Request</h3>
                            <button 
                                className="idea-modal-close"
                                onClick={handleModalClose}
                            >
                                ×
                            </button>
                        </div>
                        
                        {error && <div className="idea-error-message">{error}</div>}
                        
                        <form onSubmit={handleSubmitShareholderRequest} className="idea-modal-form">
                            <div className="idea-form-group">
                                <label className="idea-form-label">Contribution Type</label>
                                <input
                                type="text"
                                    name="contributionType"
                                    className="idea-form-input"
                                    value={formData.contributionType}
                                    onChange={handleInputChange}
                                placeholder="e.g., Financial, Technical, Marketing"
                            />
                            </div>
                            
                            <div className="idea-form-group">
                                <label className="idea-form-label">Contribution Details</label>
                                <textarea
                                    name="contributionDetails"
                                    className="idea-form-input idea-form-textarea"
                                    value={formData.contributionDetails}
                                    onChange={handleInputChange}
                                placeholder="Describe your contribution in detail"
                            />
                            </div>
                            
                            <div className="idea-form-group">
                                <label className="idea-form-label">Equity Requested (%)</label>
                                <input
                                type="number"
                                    name="equityRequested"
                                    className="idea-form-input"
                                    value={formData.equityRequested}
                                    onChange={handleInputChange}
                                placeholder="Enter percentage"
                                    min="0"
                                    max="100"
                                />
                            </div>

                            <div className="idea-modal-actions">
                                <button 
                                    type="button" 
                                    className="idea-modal-button secondary"
                                    onClick={handleModalClose}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="idea-modal-button primary"
                                >
                                    Send Request
                                </button>
                    </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast */}
            {showToast && (
                <div className="idea-toast-container">
                    <div className={`idea-toast ${toastVariant}`}>
                        <span>{toastMessage}</span>
                        <button 
                            className="idea-toast-close"
                            onClick={() => setShowToast(false)}
                        >
                            ×
                        </button>
        </div>
                </div>
            )}
        </div>
        </>
    );
};

export default IdeaDetail;