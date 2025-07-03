import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarSeller from "../Includes/NavbarSeller";
import "../../CSS/buyerRequest.css";

const BuyerRequestDetailSeller = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const [requestDetails, setRequestDetails] = useState(null);
    const [gigs, setGigs] = useState([]);
    const [selectedGig, setSelectedGig] = useState("");
    const [price, setPrice] = useState("");
    const [deliveryTime, setDeliveryTime] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [existingProposal, setExistingProposal] = useState(null);
    const user = JSON.parse(sessionStorage.getItem("user")); 

    useEffect(() => {
        fetchRequestDetails();
        fetchSellerGigs();
        checkExistingProposal();
    }, []);

    // Fetch Buyer Request Details
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

    // Fetch Seller's Gigs
    const fetchSellerGigs = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/gigs/seller?sellerId=${user.id}`);
            if (!response.ok) throw new Error("Failed to fetch gigs");
            const data = await response.json();
            setGigs(data);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    // Check if the Seller Already Sent a Proposal
    const checkExistingProposal = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/proposals/check/${user.id}/${requestId}`);
            if (!response.ok) throw new Error("Failed to check existing proposal");
            const data = await response.json();
            setExistingProposal(data);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    // Handle Sending a Proposal
    const handleSubmitProposal = async (e) => {
        e.preventDefault();
        if (!selectedGig || !price || !deliveryTime || !message) {
            alert("Please fill in all fields.");
            return;
        }

        const proposalData = {
            sellerId: user.id,
            buyerRequestId: requestId,
            gigId: selectedGig,
            price,
            deliveryTime,
            message,
            status: "submitted",
        };

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:4000/api/proposals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(proposalData),
            });

            if (!response.ok) throw new Error("Failed to send proposal");
            alert("Proposal sent successfully!");
            checkExistingProposal();
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
                <NavbarSeller />
                <div className="buyer-request-container">
                    <div className="loading-spinner">Loading request details...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <NavbarSeller />
            <div className="buyer-request-container animate-fade-in">
                <div className="page-header">
                    <h1>Buyer Request Details</h1>
                    <p>View request details and submit your proposal</p>
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

                {existingProposal ? (
                    <div className="request-detail" style={{ marginTop: '2rem' }}>
                        <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>Your Proposal</h2>
                        <div className="detail-section">
                            <div className="detail-label">Selected Gig</div>
                            <div className="detail-value">{existingProposal.gigId}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="detail-section">
                                <div className="detail-label">Price</div>
                                <div className="detail-value">${existingProposal.price}</div>
                            </div>
                            <div className="detail-section">
                                <div className="detail-label">Delivery Time</div>
                                <div className="detail-value">{existingProposal.deliveryTime} days</div>
                            </div>
                            <div className="detail-section">
                                <div className="detail-label">Status</div>
                                <div className="detail-value">{existingProposal.status}</div>
                            </div>
                        </div>
                        <div className="detail-section">
                            <div className="detail-label">Message</div>
                            <div className="detail-value">{existingProposal.message}</div>
                        </div>
                    </div>
                ) : (
                    user && requestDetails.status === "open" && (
                        <div className="request-detail" style={{ marginTop: '2rem' }}>
                            <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem' }}>Send a Proposal</h2>
                            <form onSubmit={handleSubmitProposal}>
                                <div className="form-group">
                                    <label className="form-label">Select Gig</label>
                                    <select 
                                        className="form-input"
                                        value={selectedGig} 
                                        onChange={(e) => setSelectedGig(e.target.value)}
                                    >
                                        <option value="">Select a gig</option>
                                        {gigs.map((gig) => (
                                            <option key={gig._id} value={gig._id}>{gig.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label className="form-label">Price ($)</label>
                                        <input 
                                            type="number" 
                                            className="form-input"
                                            value={price} 
                                            onChange={(e) => setPrice(e.target.value)}
                                            min="1"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Delivery Time (days)</label>
                                        <input 
                                            type="number" 
                                            className="form-input"
                                            value={deliveryTime} 
                                            onChange={(e) => setDeliveryTime(e.target.value)}
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Message</label>
                                    <textarea 
                                        className="form-input"
                                        value={message} 
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Describe your proposal..."
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="action-button"
                                    disabled={loading}
                                    style={{ 
                                        backgroundColor: '#3498db',
                                        padding: '0.75rem 2rem',
                                        margin: '1rem 0',
                                        display: 'inline-block'
                                    }}
                                >
                                    {loading ? "Sending..." : "Send Proposal"}
                                </button>

                                <button 
                                    type="button"
                                    onClick={() => navigate("/allBuyerRequests")}
                                    className="action-button"
                                    style={{ 
                                        background: 'transparent',
                                        border: '1px solid #3498db',
                                        color: '#3498db',
                                        padding: '0.75rem 2rem',
                                        marginLeft: '1rem'
                                    }}
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default BuyerRequestDetailSeller;
