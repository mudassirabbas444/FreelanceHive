import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarAdmin from "../Includes/NavbarAdmin";
import { FaStar, FaCheck, FaRegClock, FaTimes, FaTag, FaDollarSign, FaEdit, FaTrash, FaPause, FaPlay, FaChevronLeft, FaCalendarAlt, FaExclamationTriangle, FaFileAlt } from 'react-icons/fa';
import { Fade, Zoom } from 'react-reveal';
import "../../CSS/viewOrderDetails.css";

function ViewOrderDetailsAdmin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Admin") {
      alert("Access denied. Please log in as a Admin.");
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
      alert(result.message);
      return result;
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  const handleStatusUpdate = async (status, extraUpdates = {}) => {
    await handleRequest(`/orders/${id}/status`, "POST", { status, extraUpdates });
    setData((prev) => ({
      ...prev,
      order: { ...prev.order, status, ...extraUpdates },
    }));
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
      alert(result.message);
  
      setData((prev) => ({
        ...prev,
        order: { ...prev.order, status: "Active", disputeDetails: null },
      }));
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarAdmin />
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading order details...</p>
          <div className="loading-skeleton">
            <div className="skeleton-image pulse"></div>
            <div className="skeleton-content">
              <div className="skeleton-title pulse"></div>
              <div className="skeleton-text pulse"></div>
              <div className="skeleton-text pulse"></div>
              <div className="skeleton-text pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarAdmin />
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Order</h2>
          <p>{error}</p>
          <button className="action-button primary-button" onClick={() => navigate(-1)}>
            <FaChevronLeft className="me-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarAdmin />
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h2>Order Not Found</h2>
          <p>The order you're looking for doesn't exist or has been removed.</p>
          <button className="action-button primary-button" onClick={() => navigate(-1)}>
            <FaChevronLeft className="me-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const { order, gig } = data;

  return (
    <div className="gig-container animate-fade-in">
      <NavbarAdmin />
      
      <div className="breadcrumb">
        <span onClick={() => navigate("/dashboard")}>Home</span> 
        <FaChevronLeft className="breadcrumb-separator" /> 
        <span onClick={() => navigate("/adminOrders")}>Orders</span> 
        <FaChevronLeft className="breadcrumb-separator" /> 
        <span className="current-page">Order Details</span>
      </div>
      
      <div className="gig-detail-container">
        <div className="gig-detail-header">
          <Fade top>
            <h1>Order Details</h1>
            <div className="gig-meta-container">
              <div className="meta-item status-badge">
                <span className={`status-badge ${order.status.toLowerCase()}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </Fade>
        </div>

        <div className="gig-actions-bar">
          {(order.status === "Active" || order.status === "Delivered") && (
            <div className="admin-actions">
              <button onClick={() => handleStatusUpdate("Canceled")} className="action-button danger-button">
                <FaTimes className="me-2" /> Cancel Order
              </button>
              <button onClick={() => handleStatusUpdate("Completed")} className="action-button success-button">
                <FaCheck className="me-2" /> Complete Order
              </button>
            </div>
          )}
          {order.status === "Disputed" && (
            <button onClick={handleCloseDispute} className="action-button primary-button">
              <FaCheck className="me-2" /> Close Dispute
            </button>
          )}
        </div>

        <div className="gig-detail-content">
          <div className="gig-detail-left">
            <Zoom>
              <div className="gig-image-container">
                <div className="main-image-container">
                  <img
                    src={`http://localhost:4000${gig.images}`}
                    alt={gig.title}
                    className="gig-main-image"
                  />
                </div>
              </div>
            </Zoom>

            <div className="gig-description-section">
              <h2>Gig Details</h2>
              <h3>{gig.title}</h3>
              
              {order.disputeDetails && (
                <div className="dispute-section">
                  <h3><FaExclamationTriangle className="me-2" /> Dispute Details</h3>
                  <p className="dispute-text">
                    {typeof order.disputeDetails === 'object' 
                      ? order.disputeDetails.reason || order.disputeDetails.description || 'No details available'
                      : order.disputeDetails}
                  </p>
                </div>
              )}

              {order.modificationRequests && order.modificationRequests.length > 0 && (
                <div className="modification-section">
                  <h3>Modification Request</h3>
                  <div className="modification-details">
                    {order.modificationRequests.map((request, index) => (
                      <div key={index}>
                        <p><strong>Requested Price:</strong> ${request.price}</p>
                        <p><strong>Requested Delivery Time:</strong> {request.deliveryTime} days</p>
                        <p><strong>Reason:</strong> {request.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="gig-detail-right">
            <div className="order-info-section">
              <h2>Order Information</h2>
              <div className="info-card">
                <div className="info-item">
                  <FaCalendarAlt className="info-icon" />
                  <div className="info-content">
                    <label>Order Date</label>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaTag className="info-icon" />
                  <div className="info-content">
                    <label>Category</label>
                    <span>{gig.category}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaDollarSign className="info-icon" />
                  <div className="info-content">
                    <label>Price</label>
                    <span>${order.price}</span>
                  </div>
                </div>
                <div className="info-item">
                  <FaRegClock className="info-icon" />
                  <div className="info-content">
                    <label>Delivery Time</label>
                    <span>{order.deliveryTime} days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewOrderDetailsAdmin;
