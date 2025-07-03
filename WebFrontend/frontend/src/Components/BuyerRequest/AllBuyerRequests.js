import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarSeller from "../Includes/NavbarSeller";
import NavbarAdmin from "../Includes/NavbarAdmin";
import "../../CSS/buyerRequest.css";

const AllBuyerRequests = () => {
    const navigate = useNavigate();
    const [buyerRequests, setBuyerRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const user = JSON.parse(sessionStorage.getItem("user"));

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (!user) {
                    navigate("/");
                    return;
                }
                fetchBuyerRequests();
            } catch (error) {
                console.error("Auth error:", error);
                navigate("/");
            }
        };
        checkAuth();
    }, [user, navigate]);

    const fetchBuyerRequests = async () => {
        try {
            const response = await fetch("http://localhost:4000/api/buyer-requests");
            if (!response.ok) throw new Error("Failed to fetch buyer requests");
            const data = await response.json();

            if (user.role === "Seller") {
                setBuyerRequests(data.filter(request => request.status === "open"));
            } else {
                setBuyerRequests(data);
            }
        } catch (error) {
            setError("Failed to load buyer requests. Please try again later.");
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status) => {
        const statusMap = {
            pending: "status-pending",
            approved: "status-approved",
            rejected: "status-rejected",
            completed: "status-completed",
            closed: "status-closed"
        };
        return statusMap[status.toLowerCase()] || "status-default";
    };

    const handleRedirect = (requestId) => {
        if (user.role === "Admin") {
            navigate(`/buyerRequestAdmin/${requestId}`);
        } else if (user.role === "Seller") {
            navigate(`/buyerRequestSeller/${requestId}`);
        }
    };

    if (loading) {
        return (
            <div>
                <NavbarSeller />
                <div className="buyer-request-container">
                    <div className="loading-spinner">Loading buyer requests...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <NavbarSeller />
                <div className="buyer-request-container">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {user.role === "Admin" ? <NavbarAdmin /> : <NavbarSeller />}
            <div className="buyer-request-container animate-fade-in">
                <div className="page-header">
                    <h1>All Buyer Requests</h1>
                    <p>Browse and respond to buyer requests</p>
                </div>
            </div>
            {buyerRequests.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h2>No Buyer Requests</h2>
                    <p>There are currently no buyer requests available.</p>
                </div>
            ) : (
                <div className="requests-grid">
                    {buyerRequests.map((request) => (
                        <div key={request._id} className="request-card">
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
                                onClick={() => handleRedirect(request.requestId)}
                            >
                                View Details
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AllBuyerRequests;
