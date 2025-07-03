import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarBuyer from "../Includes/NavbarBuyer";
import { 
  ShoppingBag, 
  FileText, 
  Truck, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Star, 
  MessageSquare, 
  Package, 
  Edit, 
  Download 
} from "lucide-react";
import { FaExclamationTriangle } from "react-icons/fa";
import "../../CSS/viewOrderDetailsBuyer.css";

function ViewOrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Buyer") {
      alert("Access denied. Please log in as a Buyer.");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchOrderAndGigDetails = async () => {
      try {
        const orderResponse = await fetch(`http://localhost:4000/api/orders/${id}`);
        if (!orderResponse.ok) throw new Error("Failed to fetch order details.");
        const orderData = await orderResponse.json();

        const gigResponse = await fetch(`http://localhost:4000/api/gigs/${orderData.gigId}`);
        if (!gigResponse.ok) throw new Error("Failed to fetch gig details.");
        const gigData = await gigResponse.json();

        setData({ order: orderData, gig: gigData });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndGigDetails();
  }, [id]);

  const handleRespondToModification = async (accept) => {
    try {
      const response = await fetch(`http://localhost:4000/api/orders/${id}/modificationResponse`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept, buyerId: data.order.buyerId }),
      });

      if (!response.ok) throw new Error("Failed to respond to modification.");
      const result = await response.json();
      
      // Use a custom toast notification instead of alert
      showToast(result.message, accept ? "success" : "info");

      if (accept) {
        setData((prev) => ({
          ...prev,
          order: {
            ...prev.order,
            status: "In Progress",
            price: data.order.modificationRequests[0]?.price || data.order.price,
            deliveryTime:
              data.order.modificationRequests[0]?.deliveryTime || data.order.deliveryTime,
            modificationRequests: [],
          },
        }));
      } else {
        setData((prev) => ({
          ...prev,
          order: { ...prev.order, status: "Active", modificationRequests: [] },
        }));
      }
    } catch (err) {
      console.error(err.message);
      showToast(err.message, "error");
    }
  };

  const handleReviewSubmit = async () => {
    if (!input.review || !input.rating) {
      showToast("Please provide both review and rating.", "warning");
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/orders/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: data.order.buyerId,
          role: "Buyer",
          rating: input.rating,
          reviewText: input.review,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review.");
      const result = await response.json();
      showToast(result.message, "success");
      
      // Clear the form after submission
      setInput({...input, review: "", rating: ""});
    } catch (err) {
      console.error(err.message);
      showToast(err.message, "error");
    }
  };

  const handleRequest = async (endpoint, method = "POST", body = null) => {
    try {
      const options = {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body && { body: JSON.stringify(body) }),
      };

      const response = await fetch(`http://localhost:4000/api${endpoint}`, options);
      if (!response.ok) throw new Error(`Failed to ${method} at ${endpoint}`);
      const result = await response.json();
      showToast(result.message, "success");
      return result;
    } catch (err) {
      console.error(err.message);
      showToast(err.message, "error");
    }
  };

  const handleStatusUpdate = async (status, extraUpdates = {}) => {
    await handleRequest(`/orders/${id}/status`, "POST", { status, extraUpdates });
    setData((prev) => ({
      ...prev,
      order: { ...prev.order, status, ...extraUpdates },
    }));
  };

  const handleOpenDispute = async () => {
    if (!input.reason) {
      showToast("Please provide a reason for the dispute.", "warning");
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:4000/api/orders/${id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeDetails: input.reason,
          userId: data.order.buyerId,
        }),
      });
  
      if (!response.ok) throw new Error("Failed to open dispute.");
      const result = await response.json();
      showToast(result.message, "success");
  
      setData((prev) => ({
        ...prev,
        order: { ...prev.order, status: "Disputed", disputeDetails: input.reason },
      }));
      
      // Clear the form after submission
      setInput({...input, reason: ""});
    } catch (err) {
      console.error(err.message);
      showToast(err.message, "error");
    }
  };
  
  const handleCloseDispute = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/orders/${id}/close-dispute`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.order.buyerId }),
      });
  
      if (!response.ok) throw new Error("Failed to close dispute.");
      const result = await response.json();
      showToast(result.message, "success");
  
      setData((prev) => ({
        ...prev,
        order: { ...prev.order, status: "Active", disputeDetails: null },
      }));
    } catch (err) {
      console.error(err.message);
      showToast(err.message, "error");
    }
  };

  const handleInputChange = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };
  
  
  // Toast notification function
  const showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        ${type === "success" ? '<CheckCircle />' : 
          type === "error" ? '<XCircle />' : 
          type === "warning" ? '<AlertTriangle />' : '<MessageSquare />'}
      </div>
      <div class="toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    }, 100);
  };
  
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case "Active": return "status-badge active";
      case "In Progress": return "status-badge progress";
      case "Delivered": return "status-badge delivered";
      case "Completed": return "status-badge completed";
      case "Disputed": return "status-badge disputed";
      case "Cancel Request": return "status-badge cancel";
      default: return "status-badge";
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading order details...</p>
    </div>
  );
  
  if (error) return (
    <div className="error-container">
      <AlertTriangle size={48} />
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );
  
  if (!data) return (
    <div className="not-found-container">
      <FileText size={48} />
      <h2>No Details Found</h2>
      <p>The requested order details could not be found.</p>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  const { order, gig } = data;

  return (
    <div className="buyer-order-details-page">
      <NavbarBuyer />
      
      <div className="buyer-page-header">
        <h1><ShoppingBag size={28} /> Order Details</h1>
        <div className={`buyer-status-badge ${order.status.toLowerCase()}`}>
          {order.status === "In Progress" ? <Clock size={16} /> : 
           order.status === "Delivered" ? <Truck size={16} /> :
           order.status === "Completed" ? <CheckCircle size={16} /> :
           order.status === "Disputed" ? <AlertTriangle size={16} /> :
           <FileText size={16} />}
          {order.status}
        </div>
      </div>
      
      <div className="buyer-order-id-banner">
        <FileText size={18} />
        <span>Order ID: {order._id}</span>
      </div>
      
      <div className="buyer-tabs-container">
        <div className="buyer-tabs-header">
          <button 
            className={`buyer-tab-button ${activeTab === "details" ? "active" : ""}`} 
            onClick={() => setActiveTab("details")}
          >
            <FileText size={16} /> Order Details
          </button>
          
          {order.deliverables && order.deliverables.length > 0 && (
            <button 
              className={`buyer-tab-button ${activeTab === "deliverables" ? "active" : ""}`} 
              onClick={() => setActiveTab("deliverables")}
            >
              <Package size={16} /> Deliverables
            </button>
          )}
          
          <button 
            className={`buyer-tab-button ${activeTab === "actions" ? "active" : ""}`} 
            onClick={() => setActiveTab("actions")}
          >
            <Edit size={16} /> Actions
          </button>
          
          {order.status === "Completed" && (
            <button 
              className={`buyer-tab-button ${activeTab === "review" ? "active" : ""}`} 
              onClick={() => setActiveTab("review")}
            >
              <Star size={16} /> Review
            </button>
          )}
        </div>
        
        <div className="buyer-tab-content">
          {activeTab === "details" && (
            <div className="buyer-tab-panel active">
              <div className="buyer-alerts-section">
                {order.disputeDetails && (
                  <div className="buyer-dispute-section">
                    <h3><FaExclamationTriangle className="me-2" /> Dispute Details</h3>
                    <p className="buyer-dispute-text">
                      {typeof order.disputeDetails === 'object' 
                        ? order.disputeDetails.reason || order.disputeDetails.description || 'No details available'
                        : order.disputeDetails}
                    </p>
                  </div>
                )}
                
                {order.modificationRequests && order.modificationRequests.length > 0 && (
                  <div className="buyer-modification-section">
                    <h3>Modification Request</h3>
                    <div className="buyer-modification-details">
                      {order.modificationRequests.map((request, index) => (
                        <div key={index}>
                          <p><strong>Requested Price:</strong> ${request.price}</p>
                          <p><strong>Requested Delivery Time:</strong> {request.deliveryTime} days</p>
                          <p><strong>Reason:</strong> {request.reason}</p>
                          
                          <div className="buyer-modification-actions">
                            <button 
                              className="buyer-button success" 
                              onClick={() => handleRespondToModification(true)}
                            >
                              Accept Modification
                            </button>
                            <button 
                              className="buyer-button danger" 
                              onClick={() => handleRespondToModification(false)}
                            >
                              Reject Modification
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="buyer-content-card buyer-gig-info">
                <h2>Gig Information</h2>
                {gig && (
                  <>
                    <h3 className="buyer-gig-title">{gig.title}</h3>
                    {gig.images ? (
                      <div className="buyer-gig-image-container" style={{ width: '700px', height: '300px', margin: '0 auto' }}>
                        <img
                          src={`http://localhost:4000${gig.images}`}
                          alt={gig.title || "Gig Image"}
                          className="buyer-gig-image"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </div>
                    ) : (
                      <div className="buyer-no-image" style={{ width: '400px', height: '500px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                        No image available for this gig.
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="buyer-content-card">
                <h2>Order Information</h2>
                <div className="buyer-info-grid">
                  <div className="buyer-info-item">
                    <div className="buyer-info-icon"><DollarSign size={20} /></div>
                    <div className="buyer-info-content">
                      <h4>Price</h4>
                      <p>${order.price}</p>
                    </div>
                  </div>
                  
                  <div className="buyer-info-item">
                    <div className="buyer-info-icon"><Calendar size={20} /></div>
                    <div className="buyer-info-content">
                      <h4>Delivery Time</h4>
                      <p>{order.deliveryTime} days</p>
                    </div>
                  </div>
                  
                  <div className="buyer-info-item">
                    <div className="buyer-info-icon"><Clock size={20} /></div>
                    <div className="buyer-info-content">
                      <h4>Status</h4>
                      <div className={`buyer-status-badge ${order.status.toLowerCase()}`}>{order.status}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "deliverables" && order.deliverables && order.deliverables.length > 0 && (
            <div className="buyer-tab-panel active">
              <div className="buyer-content-card">
                <h2><Package size={24} /> Deliverables</h2>
                <div className="buyer-deliverables-list">
                  {order.deliverables.map((file, index) => (
                    <div key={index} className="buyer-deliverable-item">
                      <div className="buyer-deliverable-info">
                        <FileText size={24} />
                        <span>File {index + 1}</span>
                      </div>
                      <a
                        href={`http://localhost:4000/${file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="buyer-button primary"
                      >
                        <Download size={16} /> Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "actions" && (
            <div className="buyer-tab-panel active">
              <div className="buyer-content-card">
                <h2><Edit size={24} /> Actions</h2>
                
                <div className="buyer-actions-container">
                  {(order.status === "Active" || order.status === "Delivered") && (
                    <div className="buyer-action-group">
                      <h3>Order Actions</h3>
                      
                      {(order.status === "Active" || order.status === "Delivered") && (
                        <button className="buyer-button danger" onClick={() => handleStatusUpdate("Cancel Request")}>
                          <XCircle size={16} /> Cancel Order
                        </button>
                      )}
                      
                      {order.status === "Delivered" && (
                        <>
                          <button className="buyer-button success" onClick={() => handleStatusUpdate("Completed")}>
                            <CheckCircle size={16} /> Mark as Completed
                          </button>
                          
                          <button className="buyer-button warning" onClick={() => handleStatusUpdate("Active")}>
                            <Edit size={16} /> Request Revision
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  
                  {order.status !== "Disputed" && order.status !== "Completed" && (
                    <div className="buyer-action-group">
                      <h3>Dispute</h3>
                      <div className="buyer-form-group">
                        <label htmlFor="reason">Reason for dispute:</label>
                        <textarea
                          id="reason"
                          name="reason"
                          placeholder="Explain why you want to open a dispute..."
                          value={input.reason || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <button className="buyer-button warning" onClick={handleOpenDispute}>
                        <AlertTriangle size={16} /> Open Dispute
                      </button>
                    </div>
                  )}
                  
                  {order.status === "Disputed" && (
                    <div className="buyer-action-group">
                      <h3>Close Dispute</h3>
                      <p>If you've resolved the issue with the seller, you can close this dispute.</p>
                      <button className="buyer-button success" onClick={handleCloseDispute}>
                        <CheckCircle size={16} /> Close Dispute
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "review" && order.status === "Completed" && (
            <div className="buyer-tab-panel active">
              <div className="buyer-content-card">
                <h2><Star size={24} /> Submit Review</h2>
                
                <div className="buyer-form-group buyer-rating-group">
                  <label>Rating:</label>
                  <div className="buyer-star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`buyer-star-btn ${parseInt(input.rating) >= star ? 'active' : ''}`}
                        onClick={() => setInput({ ...input, rating: star })}
                      >
                        <Star size={24} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="buyer-form-group">
                  <label htmlFor="review">Your Review:</label>
                  <textarea
                    id="review"
                    name="review"
                    placeholder="Share your experience with this service..."
                    value={input.review || ""}
                    onChange={handleInputChange}
                    rows={5}
                  />
                </div>
                
                <button className="buyer-button primary" onClick={handleReviewSubmit}>
                  <CheckCircle size={16} /> Submit Review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewOrderDetails;
