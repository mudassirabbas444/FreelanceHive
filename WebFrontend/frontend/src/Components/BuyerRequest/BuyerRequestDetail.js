import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarBuyer from "../Includes/NavbarBuyer";
import "../../CSS/buyerRequest.css";

const BuyerRequestDetail = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const [requestDetails, setRequestDetails] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(false);

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
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:4000/api/buyerRequest/${action}/${requestId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) throw new Error(`Failed to ${action} request`);

            alert(`Request ${action}d successfully`);
            navigate("/buyerRequests");
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleProposalAction = async (proposalId, status) => {
        try {
            const response = await fetch(`http://localhost:4000/api/proposals/status/${proposalId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) throw new Error("Failed to update proposal status");
            alert(`Proposal ${status} successfully!`);
            fetchProposals();
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred while updating proposal status.");
        }
    };

    const startChatWithSeller = (sellerId) => {
        navigate(`/chat/${sellerId}`);
    };

    if (!requestDetails) {
        return (
            <div>
                <NavbarBuyer />
                <div className="buyer-request-container">
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                        Loading...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <NavbarBuyer />
            <div className="buyer-request-container animate-fade-in">
                <div className="request-detail">
                    <div className="detail-header">
                        <h1 className="detail-title">{requestDetails.title}</h1>
                        <span className={`request-status ${requestDetails.status.toLowerCase()}`}>
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

                    {requestDetails.status === "rejected" && requestDetails.feedback && (
                        <div className="detail-section" style={{ backgroundColor: '#fff3cd', padding: '1rem', borderRadius: '8px' }}>
                            <div className="detail-label">Feedback</div>
                            <div className="detail-value">{requestDetails.feedback}</div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        {requestDetails.status === "open" && (
                            <button 
                                className="action-button" style={{backgroundColor:"yellow"}}
                                onClick={() => handleAction("close")} 
                                disabled={loading}
                            >
                                {loading ? "Processing..." : "Close Request"}
                            </button>
                        )}

                        {requestDetails.status !== "deleted" && (
                            <button 
                                className="action-button"
                                onClick={() => handleAction("delete")} 
                                disabled={loading}
                                style={{ backgroundColor: '#e74c3c' }}
                            >
                                {loading ? "Processing..." : "Delete Request"}
                            </button>
                        )}

                        <button 
                            className="action-button"
                            onClick={() => navigate("/buyerRequests")}
                            style={{ 
                                border: '1px solid #3498db',
                                color: '#3498db'
                            }}
                        >
                            Back to My Requests
                        </button>
                    </div>
                </div>

                {requestDetails.status !== "rejected" && (
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

                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                            {proposal.status === "submitted" && (
                                                <>
                                                    <button 
                                                        className="action-button"
                                                        onClick={() => handleProposalAction(proposal._id, "accepted")}
                                                        style={{ backgroundColor: '#27ae60' }}
                                                    >
                                                        Accept
                                                    </button>
                                                    <button 
                                                        className="action-button"
                                                        onClick={() => handleProposalAction(proposal._id, "rejected")}
                                                        style={{ backgroundColor: '#e74c3c' }}
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            <button 
                                                className="action-button"
                                                onClick={() => startChatWithSeller(proposal.sellerId)}
                                                style={{ 
                                                    backgroundColor: '#3498db',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <i className="fas fa-comments"></i>
                                                Chat with Seller
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuyerRequestDetail;
