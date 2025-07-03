import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarBuyer from "../Includes/NavbarBuyer";
import "../../CSS/buyerRequest.css";

const BuyerRequests = () => {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));
    const [buyerRequests, setBuyerRequests] = useState([]);

    useEffect(() => {
        if (!user) {
            alert("Access denied. Please log in.");
            navigate("/");
        } else {
            fetchBuyerRequests();
        }
    }, [user, navigate]);

    const fetchBuyerRequests = async () => {
        try {
            const response = await fetch(`http://localhost:4000/api/buyer-requests/${user.id}`);
            if (!response.ok) throw new Error("Failed to fetch buyer requests");
            const data = await response.json();
            setBuyerRequests(data);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    const getStatusClass = (status) => {
        const statusMap = {
            pending: "status-pending",
            active: "status-active",
            completed: "status-completed"
        };
        return statusMap[status.toLowerCase()] || "status-default";
    };

    return (
        <div>
            <NavbarBuyer />
            <div className="buyer-request-container animate-fade-in">
                <div className="page-header">
                    <h1>My Buyer Requests</h1>
                    <p>Manage your posted buyer requests</p>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <button 
                        className="action-button"
                        style={{backgroundColor:"blue"}}
                        onClick={() => navigate("/createBuyerRequest")}
                    >
                        Create New Request
                    </button>
                </div>

                {buyerRequests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <h2>No Buyer Requests</h2>
                        <p>You haven't posted any requests yet.</p>
                    </div>
                ) : (
                    <div className="requests-grid">
                        {buyerRequests.map((request) => (
                            <div key={request.requestId} className="request-card">
                                <div className="request-card-header">
                                    <h2 className="request-title">{request.title}</h2>
                                    <span className={`status-badge ${getStatusClass(request.status)}`}>
                                        {request.status}
                                    </span>
                                </div>

                                <div className="request-description">
                                    {request.description.length > 150
                                        ? `${request.description.substring(0, 150)}...`
                                        : request.description}
                                </div>

                                <div className="request-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Category:</span>
                                        <span className="meta-value">{request.category}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Budget:</span>
                                        <span className="meta-value">${request.price}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Delivery:</span>
                                        <span className="meta-value">{request.deliveryTime} days</span>
                                    </div>
                                </div>

                                <button 
                                    className="view-details-button"
                                    onClick={() => navigate(`/buyerRequest/${request.requestId}`)}
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuyerRequests;