import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaComment, FaTag, FaInfoCircle, FaExclamationTriangle, FaUser, FaRegClock, FaCheck, FaHandshake, FaDownload, FaUpload, FaFilePdf } from "react-icons/fa";
import { Fade } from 'react-reveal';
import NavbarSeller from "../Includes/NavbarSeller";
import ShareholderAgreement from "./ShareholderAgreement";
import '../../../src/CSS/ideaDetailSellerCustom.css';

const IdeaDetailSeller = () => {
    const { ideaId } = useParams();
    const navigate = useNavigate();
    const [ideaDetails, setIdeaDetails] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [newReply, setNewReply] = useState("");
    const [user, setUser] = useState(null);
    const [hasReplied, setHasReplied] = useState(false);
    const [shareholderRequests, setShareholderRequests] = useState([]);
    const [showShareholderAgreement, setShowShareholderAgreement] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [toastMessage, setToastMessage] = useState({ type: '', message: '' });
    const [showToast, setShowToast] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [toastVariant, setToastVariant] = useState('info');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [ideaRes, repliesRes] = await Promise.all([
                fetch(`http://localhost:4000/api/idea/${ideaId}`),
                fetch(`http://localhost:4000/api/idea/${ideaId}/replies`)
            ]);

            if (!ideaRes.ok) throw new Error("Failed to fetch idea details");
            if (!repliesRes.ok) throw new Error("Failed to fetch replies");

            const [ideaData, repliesData] = await Promise.all([
                ideaRes.json(),
                repliesRes.json()
            ]);

            setIdeaDetails(ideaData);
            setReplies(repliesData);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load data. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [ideaId]);

    const fetchShareholderRequests = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            const response = await fetch(`http://localhost:4000/api/shareholder-request/seller/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setShareholderRequests(data);
            }
        } catch (error) {
            console.error("Error fetching shareholder requests:", error);
        }
    }, [user]);

    useEffect(() => {
        const userData = JSON.parse(sessionStorage.getItem("user"));
        if (!userData || userData.role !== "Seller") {
            setError("Access denied. Please log in as a Seller.");
            navigate("/");
            return;
        }
        setUser(userData);
        fetchData();
    }, [fetchData, navigate]);

    useEffect(() => {
        if (user?.id) {
            fetchShareholderRequests();
        }
    }, [user, fetchShareholderRequests]);

    const checkIfSellerHasReplied = useCallback(() => {
        if (replies && user) {
            const hasAlreadyReplied = replies.some(reply => reply.userId === user.id);
            setHasReplied(hasAlreadyReplied);
            if (hasAlreadyReplied) {
                setNewReply("");
            }
        }
    }, [replies, user]);

    useEffect(() => {
        checkIfSellerHasReplied();
    }, [checkIfSellerHasReplied]);

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!newReply.trim() || hasReplied) return;
        if (!user || !user.id || !user.name) {
            setError("User information is missing. Please log in again.");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const requestData = {
                sellerId: user.id,
                sellerName: user.name,
                content: newReply
            };

            const response = await fetch(`http://localhost:4000/api/idea/${ideaId}/reply`, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit reply");
            }

            setReplies(prev => [...prev, data.reply]);
            setNewReply("");
            setHasReplied(true);
            setToastMessage("Reply submitted successfully. Please download, sign, and upload the agreement within 24 hours.");
            setShowToast(true);
        } catch (error) {
            console.error("Error details:", error);
            setError(error.message || "Failed to submit reply. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAgreementUpload = async (replyId, file) => {
        try {
            const formData = new FormData();
            formData.append('agreement', file);

            const response = await fetch(`http://localhost:4000/api/idea/${ideaId}/reply/${replyId}/agreement`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to upload agreement");
            }

            setToastMessage("Agreement uploaded successfully!");
            setShowToast(true);
            fetchData(); // Refresh the data to show updated status
        } catch (error) {
            console.error("Error uploading agreement:", error);
            setError(error.message || "Failed to upload agreement. Please try again.");
        }
    };

    const downloadAgreement = () => {
        if (!ideaDetails?.agreementUrl) {
            setError("Agreement not found. Please try again later.");
            return;
        }
        window.open(`http://localhost:4000${ideaDetails.agreementUrl}`, '_blank');
    };

    // Ensure this function is defined before use
    const getStatusBadgeVariant = (status) => {
        switch(status?.toLowerCase()) {
            case "open": return "status-badge open";
            case "rejected": return "status-badge rejected";
            case "closed": return "status-badge closed";
            default: return "status-badge default";
        }
    };

    const handleAcceptShareholderRequest = async (request) => {
        try {
            setLoading(true);
            setError(null);

            // Show loading toast
            setShowToast(true);
            setToastMessage("Shareholder request accepted successfully. Please download, sign, and upload the agreement.");
            setToastVariant('info');

            const response = await fetch(`http://localhost:4000/api/shareholder-request/${request._id}/accept`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error accepting shareholder request');
            }

            // Show success message
            setShowToast(true);
            setToastMessage(
                <div>
                    <strong>Success!</strong>
                    <br />
                    Shareholder request accepted.
                    <br />
                    Please download, sign, and upload the agreement.
                </div>
            );
            setToastVariant('success');

            // Refresh data to show updated status and agreement
            await fetchData();
        } catch (error) {
            console.error('Error accepting request:', error);
            setError(error.message);
            setShowToast(true);
            setToastMessage(
                <div>
                    <strong>Error!</strong>
                    <br />
                    {error.message}
                </div>
            );
            setToastVariant('danger');
        } finally {
            setLoading(false);
        }
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

            // Check file size (10MB limit)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError('File size should not exceed 10MB');
                setShowToast(true);
                setToastMessage('File size should not exceed 10MB');
                setToastVariant('warning');
                return;
            }

            // Show loading toast
            setShowToast(true);
            setToastMessage("Your final signed agreement has been uploaded successfully.");
            setToastVariant('info');

            const formData = new FormData();
            formData.append('pdf', selectedFile);
            formData.append('requestId', requestId);
            formData.append('userId', user.id);
            formData.append('role', 'Seller');

            const response = await fetch('http://localhost:4000/api/shareholder-request/upload-pdf', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Error uploading signed agreement');
            }

            // Show success message
            setShowToast(true);
            setToastMessage(
                <div>
                    <strong>Success!</strong>
                    <br />
                    Your final signed agreement has been uploaded.
                    <br />
                    The agreement process is now complete.
                </div>
            );
            setToastVariant('success');
            
            // Reset state
            setSelectedFile(null);
            
            // Refresh data
            await fetchShareholderRequests();
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

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleRejectShareholderRequest = async (requestId) => {
        try {
            setLoading(true);
            setError(null);

            // Show loading toast
            setShowToast(true);
            setToastMessage("Shareholder request rejected successfully.");
            setToastVariant('info');

            const response = await fetch(`http://localhost:4000/api/shareholder-request/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: 'rejected' })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error rejecting shareholder request');
            }

            // Show success message
            setShowToast(true);
            setToastMessage(
                <div>
                    <strong>Success!</strong>
                    <br />
                    Shareholder request rejected successfully.
                </div>
            );
            setToastVariant('success');

            // Refresh data to show updated status
            await fetchData();
        } catch (error) {
            console.error('Error rejecting request:', error);
            setError(error.message);
            setShowToast(true);
            setToastMessage(
                <div>
                    <strong>Error!</strong>
                    <br />
                    {error.message}
                </div>
            );
            setToastVariant('danger');
        } finally {
            setLoading(false);
        }
    };

    const handleShareholderAgreementAccept = async (requestId) => {
        try {
            setLoading(true);
            setError(null);

            // Show loading toast
            setShowToast(true);
            setToastMessage("Agreement accepted successfully. Please download, sign, and upload the agreement.");
            setToastVariant('info');

            const response = await fetch(`http://localhost:4000/api/shareholder-request/${requestId}/accept`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error accepting agreement');
            }

            // Show success message
            setShowToast(true);
            setToastMessage(
                <div>
                    <strong>Success!</strong>
                    <br />
                    Agreement accepted successfully.
                    <br />
                    Please download, sign, and upload the agreement.
                </div>
            );
            setToastVariant('success');

            // Close the agreement modal
            setShowShareholderAgreement(false);
            setSelectedRequest(null);

            // Refresh data to show updated status
            await fetchData();
        } catch (error) {
            console.error('Error accepting agreement:', error);
            setError(error.message);
            setShowToast(true);
            setToastMessage(
                <div>
                    <strong>Error!</strong>
                    <br />
                    {error.message}
                </div>
            );
            setToastVariant('danger');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
         <NavbarSeller />

        <div className="seller-gig-container animate-fade-in">
           
            
            <div className="seller-page-header">
                <h1>Idea Details</h1>
                <p>View and respond to business ideas</p>
            </div>

            {error && (
                <div className="seller-error-container">
                    <FaExclamationTriangle />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="seller-loading-container">
                    <div className="seller-loading-spinner" />
                </div>
            ) : ideaDetails ? (
                <Fade bottom>
                    <div className="seller-gig-card">
                        <div className="seller-detail-header">
                            <button 
                                className="seller-back-button"
                                onClick={() => navigate("/allIdeas")}
                            >
                                <FaArrowLeft /> Back to Ideas
                            </button>
                            <span className={`seller-status-badge ${ideaDetails.status.toLowerCase()}`}>
                                {ideaDetails.status}
                            </span>
                        </div>

                        <div className="seller-category-pill">
                            <FaTag />
                            {ideaDetails.category}
                        </div>
                        
                        <h2 className="seller-gig-title">{ideaDetails.title}</h2>
                        
                        <div className="seller-detail-meta">
                            <div className="seller-meta-item">
                                <FaUser />
                                <span>Created by {ideaDetails.buyerName}</span>
                            </div>
                            <div className="seller-meta-item">
                                <FaRegClock />
                                <span>Created on {new Date(ideaDetails.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="seller-detail-section">
                            <h3 className="seller-section-title">
                                <FaInfoCircle />
                                Description
                            </h3>
                            <p className="seller-section-content">{ideaDetails.description}</p>
                        </div>

                        <div className="seller-detail-section">
                            <h3 className="seller-section-title">
                                <FaComment />
                                Replies ({replies.length})
                            </h3>
                            <div className="seller-replies-list">
                                {ideaDetails.status === "open" && !hasReplied && (
                                    <form onSubmit={handleReplySubmit} className="seller-reply-form">
                                        <div className="seller-reply-section">
                                            <h2>Your Reply</h2>
                                            <textarea
                                                className="seller-reply-textarea"
                                                value={newReply}
                                                onChange={(e) => setNewReply(e.target.value)}
                                                placeholder="Enter your detailed reply..."
                                                rows={6}
                                                disabled={hasReplied || submitting}
                                            />
                                            <button 
                                                type="submit" 
                                                className="seller-submit-button"
                                                disabled={submitting || !newReply.trim() || hasReplied}
                                            >
                                                {submitting ? 'Submitting...' : hasReplied ? 'Already Replied' : 'Submit Reply'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {replies.map((reply, index) => (
                                    <div key={index} className="seller-reply-item">
                                        <div className="seller-reply-header">
                                            <FaUser />
                                            <strong>{reply.sellerName}</strong>
                                            <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                                            <span className={`seller-status-badge ${reply.status}`}>
                                                {reply.status === 'pending_agreement' ? 'Pending Agreement' : 
                                                 reply.status === 'completed' ? 'Completed' : reply.status}
                                            </span>
                                        </div>
                                        <p className="seller-reply-content">{reply.content}</p>
                                        
                                        {reply.status === 'pending_agreement' && (
                                            <div className="seller-agreement-section">
                                                <div className="seller-agreement-info">
                                                    <FaFilePdf />
                                                    <span>Agreement deadline: {new Date(reply.agreementDeadline).toLocaleString()}</span>
                                                </div>
                                                <div className="seller-agreement-actions">
                                                    <button 
                                                        className="seller-action-button"
                                                        onClick={downloadAgreement}
                                                    >
                                                        <FaDownload /> Download Agreement
                                                    </button>
                                                    <label className="seller-action-button primary">
                                                        <FaUpload /> Upload Signed Agreement
                                                        <input
                                                            type="file"
                                                            accept=".pdf"
                                                            onChange={(e) => handleAgreementUpload(reply.replyId, e.target.files[0])}
                                                            style={{ display: 'none' }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        )}

                                        {reply.agreementPdf && (
                                            <div className="seller-agreement-pdf-link">
                                                <a 
                                                    href={`http://localhost:4000${reply.agreementPdf}`}
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                >
                                                    <FaFilePdf />
                                                    View Your Initial Signed Agreement
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {hasReplied && (
                            <div className="seller-info-message">
                                <FaInfoCircle />
                                You have already replied to this idea.
                            </div>
                        )}

                        {shareholderRequests.length > 0 && (
                            <div className="seller-detail-section">
                                <h3 className="seller-section-title">
                                    <FaHandshake />
                                    Shareholder Requests
                                </h3>
                                <div className="seller-shareholder-requests-list">
                                    {shareholderRequests.map((request) => (
                                        <div key={request._id} className="seller-shareholder-request-card">
                                            <div className="seller-request-header">
                                                <h4>Shareholder Request</h4>
                                                <span className={`seller-status-badge ${request.status}`}>
                                                    {request.status}
                                                </span>
                                            </div>
                                            <div className="seller-request-details">
                                                <p><strong>Buyer:</strong> {request.buyerName}</p>
                                                <p><strong>Idea:</strong> {request.ideaTitle}</p>
                                                <p><strong>Contribution Type:</strong> {request.contributionType}</p>
                                                <p><strong>Contribution Details:</strong> {request.contributionDetails}</p>
                                                <p><strong>Equity Requested:</strong> {request.equityRequested}%</p>
                                                <p><strong>Date:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
                                            </div>

                                            <div className="seller-all-agreements-section">
                                                <h5>Agreement Documents</h5>
                                                <div className="seller-agreements-grid">
                                                    {request.agreementPdf && (
                                                        <div className="seller-agreement-card">
                                                            <h6>Initial Agreement</h6>
                                                            <p>{new Date(request.createdAt).toLocaleString()}</p>
                                                            <a 
                                                                href={`http://localhost:4000${request.agreementPdf}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="seller-action-button"
                                                            >
                                                                <FaDownload /> View Initial Agreement
                                                            </a>
                                                        </div>
                                                    )}

                                                    {request.buyerSignedAgreementPdf && (
                                                        <div className="seller-agreement-card">
                                                            <h6>Buyer's Signed Agreement</h6>
                                                            <p>{new Date(request.buyerSignedAt).toLocaleString()}</p>
                                                            <a 
                                                                href={`http://localhost:4000${request.buyerSignedAgreementPdf}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="seller-action-button"
                                                            >
                                                                <FaDownload /> View Buyer's Signed Agreement
                                                            </a>
                                                        </div>
                                                    )}

                                                    {request.sellerSignedAgreementPdf && (
                                                        <div className="seller-agreement-card">
                                                            <h6>Your Final Signed Agreement</h6>
                                                            <p>{new Date(request.sellerSignedAt).toLocaleString()}</p>
                                                            <a 
                                                                href={`http://localhost:4000${request.sellerSignedAgreementPdf}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="seller-action-button"
                                                            >
                                                                <FaDownload /> View Your Final Agreement
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>

                                                {request.status === 'agreementPending' && request.buyerSignedAgreementPdf && !request.sellerSignedAgreementPdf && (
                                                    <div className="seller-upload-section">
                                                        <h5>Upload Your Final Signed Agreement</h5>
                                                        <input
                                                            type="file"
                                                            accept=".pdf"
                                                            onChange={handleFileChange}
                                                            className="seller-file-input"
                                                        />
                                                        <button
                                                            className="seller-action-button primary"
                                                            onClick={() => handleUploadSignedAgreement(request._id)}
                                                        >
                                                            Upload Final Signed Agreement
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {request.status === 'pending' && (
                                                <div className="seller-agreement-actions">
                                                    <button
                                                        className="seller-action-button primary"
                                                        onClick={() => handleAcceptShareholderRequest(request)}
                                                        disabled={loading}
                                                    >
                                                        {loading ? 'Processing...' : 'Accept Request'}
                                                    </button>
                                                    <button
                                                        className="seller-action-button danger"
                                                        onClick={() => handleRejectShareholderRequest(request._id)}
                                                        disabled={loading}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Fade>
            ) : (
                <div className="seller-empty-state">
                    <div className="empty-icon">❌</div>
                    <h2>Idea Not Found</h2>
                    <p>The idea you're looking for doesn't exist or has been removed.</p>
                    <button 
                        className="seller-back-button"
                        onClick={() => navigate("/allIdeas")}
                    >
                        <FaArrowLeft /> Back to Ideas
                    </button>
                </div>
            )}

            {showShareholderAgreement && selectedRequest && (
                <ShareholderAgreement
                    show={showShareholderAgreement}
                    onHide={() => {
                        setShowShareholderAgreement(false);
                        setSelectedRequest(null);
                    }}
                    onAccept={handleShareholderAgreementAccept}
                    requestData={{
                        buyerName: selectedRequest.buyerName,
                        sellerName: user.name,
                        ideaTitle: selectedRequest.ideaTitle,
                        contributionType: selectedRequest.contributionType,
                        contributionDetails: selectedRequest.contributionDetails,
                        equityRequested: selectedRequest.equityRequested
                    }}
                    isBuyer={false}
                    existingAgreement={selectedRequest.agreementPdf}
                />
            )}

            <div className="seller-toast-container">
                {showToast && (
                    <div className={`seller-toast ${toastVariant}`}>
                        {typeof toastMessage === 'string' ? toastMessage : toastMessage.message}
                        <button 
                            className="seller-toast-close"
                            onClick={() => setShowToast(false)}
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
        </div>
        </>
    );
};

export default IdeaDetailSeller;
