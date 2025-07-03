import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarAdmin from "../Includes/NavbarAdmin";
import "../../CSS/buyerRequest.css";

const BuyerRequestDetailAdmin = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const [requestDetails, setRequestDetails] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rejectionFeedback, setRejectionFeedback] = useState("");

    useEffect(() => {
        fetchRequestDetails();
        fetchProposals();
    }, []);

    const fetchRequestDetails = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/buyerRequest/${requestId}`);
            if (!response.ok) throw new Error("Failed to fetch request details");
            const data = await response.json();
            setRequestDetails(data);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const fetchProposals = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/proposals/${requestId}`);
            if (!response.ok) throw new Error("Failed to fetch proposals");
            const data = await response.json();
            setProposals(data);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const handleAction = async (action) => {
        if (action === "reject" && !rejectionFeedback.trim()) {
            alert("Please provide feedback for rejection.");
            return;
        }

        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:4000/api/buyerRequest/${action}/${requestId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ feedback: action === "reject" ? rejectionFeedback : null })
            });
           
            if (!response.ok) throw new Error(`Failed to ${action} request`);

            alert(`Request ${action}d successfully`);
            navigate("/allBuyerRequests");
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!requestDetails) {
        return (
            <div>
                <NavbarAdmin />
                <div className="buyer-request-container">
                    <div className="loading-spinner">Loading request details...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <NavbarAdmin />
            <div className="buyer-request-container animate-fade-in">
                <div className="page-header">
                    <h1>Buyer Request Details</h1>
                    <p>Review and manage buyer request</p>
                </div>

                <div className="request-detail">
                    <div className="detail-header">
                        <h2 className="detail-title">{requestDetails.title}</h2>
                        <span className={`status-badge ${requestDetails.status.toLowerCase()}`}>
                            {requestDetails.status}
                        </span>
                    </div>

                    <div className="detail-section">
                        <div className="detail-label">Description</div>
                        <div className="detail-value">{requestDetails.description}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div className="detail-section">
                            <div className="detail-label">Category</div>
                            <div className="detail-value">{requestDetails.category}</div>
                        </div>

                        <div className="detail-section">
                            <div className="detail-label">Budget</div>
                            <div className="detail-value">${requestDetails.price}</div>
                        </div>

                        <div className="detail-section">
                            <div className="detail-label">Delivery Time</div>
                            <div className="detail-value">{requestDetails.deliveryTime} days</div>
                        </div>
                    </div>

                    {requestDetails.status === "pending" && (
                        <div style={{ marginTop: '2rem' }}>
                            <div className="form-group">
                                <label className="form-label">Feedback (required for rejection)</label>
                                <textarea
                                    className="form-input"
                                    value={rejectionFeedback}
                                    onChange={(e) => setRejectionFeedback(e.target.value)}
                                    placeholder="Enter feedback for rejection"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button 
                                    className="action-button"
                                    onClick={() => handleAction("approve")}
                                    disabled={loading}
                                    style={{ backgroundColor: '#27ae60' }}
                                >
                                    {loading ? "Processing..." : "Approve Request"}
                                </button>
                                <button 
                                    className="action-button"
                                    onClick={() => handleAction("reject")}
                                    disabled={loading || !rejectionFeedback.trim()}
                                    style={{ backgroundColor: '#e74c3c' }}
                                >
                                    {loading ? "Processing..." : "Reject Request"}
                                </button>
                            </div>
                        </div>
                    )}

                    <button 
                        className="action-button"
                        onClick={() => navigate("/allBuyerRequests")}
                        style={{ 
                            background: 'transparent',
                            border: '1px solid #3498db',
                            color: '#3498db',
                            marginTop: '1.5rem'
                        }}
                    >
                        Back to All Requests
                    </button>
                </div>

                <div className="request-detail" style={{ marginTop: '2rem' }}>
                    <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>Proposals</h2>
                    
                    {proposals.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
                            No proposals yet.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {proposals.map((proposal) => (
                                <div 
                                    key={proposal._id} 
                                    style={{
                                        backgroundColor: '#f8f9fa',
                                        padding: '1.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid #e1e8ed'
                                    }}
                                >
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                        <div>
                                            <div className="detail-label">Seller ID</div>
                                            <div className="detail-value">{proposal.sellerId}</div>
                                        </div>
                                        <div>
                                            <div className="detail-label">Price</div>
                                            <div className="detail-value">${proposal.price}</div>
                                        </div>
                                        <div>
                                            <div className="detail-label">Delivery Time</div>
                                            <div className="detail-value">{proposal.deliveryTime} days</div>
                                        </div>
                                        <div>
                                            <div className="detail-label">Status</div>
                                            <div className="detail-value">{proposal.status}</div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <div className="detail-label">Message</div>
                                        <div className="detail-value">{proposal.message}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuyerRequestDetailAdmin;
