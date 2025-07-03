import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarSeller from "../Includes/NavbarSeller";
import { FaStar, FaCheck, FaRegClock, FaTimes, FaTag, FaDollarSign, FaEdit, FaTrash, FaPause, FaPlay, FaChevronLeft, FaCalendarAlt, FaExclamationTriangle, FaFileAlt, FaPaperclip, FaShare, FaUser } from 'react-icons/fa';
import { Fade, Zoom } from 'react-reveal';
import "../../CSS/viewOrderDetails.css";

function ViewOrderDetailsSeller() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState({});
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [modificationInput, setModificationInput] = useState({
    price: "",
    deliveryTime: "",
    reason: "",
  });
  const [showModificationModal, setShowModificationModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sharePrice, setSharePrice] = useState('');
  const [searchType, setSearchType] = useState('gig');
  const [originalOrder, setOriginalOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Seller") {
      alert("Access denied. Please log in as a Seller.");
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

        // If this is a shared order, fetch the original order details
        if (orderData.originalOrderId) {
          const originalOrderResponse = await fetch(`http://localhost:4000/api/orders/${orderData.originalOrderId}`);
          if (originalOrderResponse.ok) {
            const originalOrderData = await originalOrderResponse.json();
            setOriginalOrder(originalOrderData);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderAndGigDetails();
  }, [id]);

  const handleModificationSubmit = async () => {
    const { price, deliveryTime, reason } = modificationInput;
    if (!price || !deliveryTime || !reason) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:4000/api/orders/${id}/modification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: data.order.sellerId,
          modificationDetails: { price, deliveryTime, reason },
        }),
      });

      if (!response.ok) throw new Error("Failed to submit modification.");
      const result = await response.json();
      alert(result.message);
      setData((prev) => ({
        ...prev,
        order: { ...prev.order, status: "Modification Requested" },
      }));
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  const handleChange = (e) => {
    setModificationInput({ ...modificationInput, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
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

  const handleFileSubmit = async () => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("deliverables", file));
  
      const response = await fetch(`http://localhost:4000/api/orders/${id}/deliver`, {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) throw new Error("Failed to deliver order.");
      const result = await response.json();
      alert(result.message);
      setData((prev) => ({
        order: { ...prev.order, status: "Delivered", deliverables: files },
      }));
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  const handleDeliverOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:4000/api/orders/${id}/deliver`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Delivered",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to deliver order");
      }

      setMessage("Order delivered successfully!");
      fetchOrderDetails();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (data.order.originalOrderId) {
      const confirmCancel = window.confirm(
        "This is a shared order. Canceling will return the shared amount to the original order. Do you want to proceed?"
      );
      if (!confirmCancel) return;
    }

    await handleStatusUpdate("Cancelled");
    
    if (data.order.originalOrderId) {
      // Refresh the original order details after cancellation
      const originalOrderResponse = await fetch(`http://localhost:4000/api/orders/${data.order.originalOrderId}`);
      if (originalOrderResponse.ok) {
        const originalOrderData = await originalOrderResponse.json();
        setOriginalOrder(originalOrderData);
      }
    }
  };

  const fetchOrderDetails = async () => {
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

  const handleShareOrder = async (targetGigId) => {
    try {
      if (!sharePrice || isNaN(sharePrice) || parseFloat(sharePrice) <= 0) {
        alert("Please enter a valid price for sharing");
        return;
      }

      const response = await fetch(`http://localhost:4000/api/orders/${id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          targetGigId,
          sharePrice: parseFloat(sharePrice)
        }),
      });

      if (!response.ok) throw new Error("Failed to share order");
      const result = await response.json();
      alert(result.message);
      setShowShareModal(false);
      setSharePrice('');
      fetchOrderDetails();
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  const handleSearchGigs = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/gigs?filters=${encodeURIComponent(JSON.stringify({ 
        search: query,
        searchType: searchType 
      }))}`);
      if (!response.ok) throw new Error("Failed to search gigs");
      const results = await response.json();
      setSearchResults(results);
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Add toast notification function
  const showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">
        ${type === "success" ? '<FaCheck />' : 
          type === "error" ? '<FaTimes />' : 
          type === "warning" ? '<FaExclamationTriangle />' : '<FaInfo />'}
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
      
      setInput({...input, reason: ""});
      setShowDisputeModal(false);
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
      
      // Update order status to Reviewed
      await handleStatusUpdate("Reviewed");
      
      setInput({...input, review: "", rating: ""});
      setShowReviewModal(false);
    } catch (err) {
      console.error(err.message);
      showToast(err.message, "error");
    }
  };

  const renderActionButtons = () => {
    // Get current user from session storage
    const currentUser = JSON.parse(sessionStorage.getItem("user"));
    const currentUserId = currentUser ? currentUser.id : null;

    // Check if this is a shared order (either as buyer or seller)
    const isSharedOrder = data.order.originalOrderId;
    const isOriginalOrder = data.order.sharedFrom === data.order.sellerId;
    const isActingAsBuyer = currentUserId === data.order.buyerId;

    console.log('Debug Info:', {
      currentUserId,
      orderBuyerId: data.order.buyerId,
      isActingAsBuyer,
      isSharedOrder,
      isOriginalOrder
    });

    if (isSharedOrder && isActingAsBuyer) {
      // Current seller is acting as buyer in shared order
      switch (data.order.status) {
        case "Pending":
          return (
            <div className="buyer-actions-container">
              <div className="buyer-action-group">
                <div className="buyer-action-buttons">
                  <button onClick={() => handleStatusUpdate("Active")} className="buyer-action-button success">
                    <FaCheck className="me-2" /> Accept Order
                  </button>
                  <button onClick={() => handleStatusUpdate("Rejected")} className="buyer-action-button danger">
                    <FaTimes className="me-2" /> Reject Order
                  </button>
                </div>
              </div>
            </div>
          );
        case "Active":
        case "Delivered":
          return (
            <div className="buyer-actions-container">
              <div className="buyer-action-group">
                <h3>Order Actions</h3>
                <div className="buyer-action-buttons">
                  {data.order.status === "Delivered" && (
                    <>
                      <button onClick={() => handleStatusUpdate("Completed")} className="buyer-action-button success">
                        <FaCheck className="me-2" /> Mark as Completed
                      </button>
                      <button onClick={() => handleStatusUpdate("Active")} className="buyer-action-button secondary">
                        <FaEdit className="me-2" /> Request Revision
                      </button>
                    </>
                  )}
                  <button onClick={() => setShowDisputeModal(true)} className="buyer-action-button warning">
                    <FaExclamationTriangle className="me-2" /> Open Dispute
                  </button>
                  <button onClick={handleCancelOrder} className="buyer-action-button danger">
                    <FaTimes className="me-2" /> Cancel Order
                  </button>
                </div>
              </div>
            </div>
          );
        case "Completed":
          return (
            <div className="buyer-actions-container">
              <div className="buyer-action-group">
                <div className="buyer-action-buttons">
                  <button onClick={() => setShowReviewModal(true)} className="buyer-action-button success">
                    <FaStar className="me-2" /> Submit Review
                  </button>
                </div>
              </div>
            </div>
          );
        case "Disputed":
          return (
            <div className="buyer-actions-container">
              <div className="buyer-action-group">
                <div className="buyer-action-buttons">
                  <button onClick={handleCloseDispute} className="buyer-action-button success">
                    <FaCheck className="me-2" /> Close Dispute
                  </button>
                </div>
              </div>
            </div>
          );
        default:
          return (
            <div className="buyer-actions-container">
              <div className="buyer-action-group">
                <div className="buyer-action-buttons">
                  <button onClick={() => navigate("/sellerOrders")} className="buyer-action-button secondary">
                    <FaChevronLeft className="me-2" /> Back to Orders
                  </button>
                </div>
              </div>
            </div>
          );
      }
    } else if (isSharedOrder) {
      // Current seller is the actual seller in shared order
      switch (data.order.status) {
        case "Pending":
          return (
            <div className="seller-actions">
              <button onClick={() => handleStatusUpdate("Active")} className="action-button success-button">
                <FaCheck className="me-2" /> Accept Order
              </button>
              <button onClick={() => handleStatusUpdate("Rejected")} className="action-button danger-button">
                <FaTimes className="me-2" /> Reject Order
              </button>
            </div>
          );
        case "Active":
          return (
            <div className="delivery-section">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="file-input"
                id="delivery-files"
              />
              <label htmlFor="delivery-files" className="action-button secondary-button">
                <FaPaperclip className="me-2" /> Attach Files
              </label>
              {files.length > 0 && (
                <button onClick={handleFileSubmit} className="action-button success-button">
                  <FaCheck className="me-2" /> Submit Delivery
                </button>
              )}
              <button onClick={handleDeliverOrder} className="action-button primary-button">
                <FaCheck className="me-2" /> Deliver Order
              </button>
              <button onClick={() => setShowModificationModal(true)} className="action-button secondary-button">
                <FaEdit className="me-2" /> Request Modification
              </button>
              <button onClick={handleCancelOrder} className="action-button danger-button">
                <FaTimes className="me-2" /> Cancel Order
              </button>
            </div>
          );
        default:
          return (
            <div className="seller-actions">
              <button onClick={() => navigate("/sellerOrders")} className="action-button secondary-button">
                <FaChevronLeft className="me-2" /> Back to Orders
              </button>
            </div>
          );
      }
    } else if (isOriginalOrder) {
      // This is the original order where current user is the seller
      switch (data.order.status) {
        case "Pending":
        case "Active":
          return (
            <div className="seller-actions">
              <button onClick={() => setShowShareModal(true)} className="action-button secondary-button">
                <FaShare className="me-2" /> Share Order
              </button>
              {data.order.status === "Pending" && (
                <>
                  <button onClick={() => handleStatusUpdate("Active")} className="action-button success-button">
                    <FaCheck className="me-2" /> Accept Order
                  </button>
                  <button onClick={() => handleStatusUpdate("Rejected")} className="action-button danger-button">
                    <FaTimes className="me-2" /> Reject Order
                  </button>
                </>
              )}
              {data.order.status === "Active" && (
                <>
                  <button onClick={handleDeliverOrder} className="action-button primary-button">
                    <FaCheck className="me-2" /> Deliver Order
                  </button>
                  <button onClick={() => setShowModificationModal(true)} className="action-button secondary-button">
                    <FaEdit className="me-2" /> Request Modification
                  </button>
                  <button onClick={handleCancelOrder} className="action-button danger-button">
                    <FaTimes className="me-2" /> Cancel Order
                  </button>
                </>
              )}
            </div>
          );
        default:
          return (
            <div className="seller-actions">
              <button onClick={() => navigate("/sellerOrders")} className="action-button secondary-button">
                <FaChevronLeft className="me-2" /> Back to Orders
              </button>
            </div>
          );
      }
    } else {
      // Regular order
      switch (data.order.status) {
        case "Pending":
          return (
            <div className="seller-actions">
              <button onClick={() => handleStatusUpdate("Active")} className="action-button success-button">
                <FaCheck className="me-2" /> Accept Order
              </button>
              <button onClick={() => handleStatusUpdate("Rejected")} className="action-button danger-button">
                <FaTimes className="me-2" /> Reject Order
              </button>
              <button onClick={() => setShowShareModal(true)} className="action-button secondary-button">
                <FaShare className="me-2" /> Share Order
              </button>
            </div>
          );
        case "Active":
          return (
            <div className="delivery-section">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="file-input"
                id="delivery-files"
              />
              <label htmlFor="delivery-files" className="action-button secondary-button">
                <FaPaperclip className="me-2" /> Attach Files
              </label>
              {files.length > 0 && (
                <button onClick={handleFileSubmit} className="action-button success-button">
                  <FaCheck className="me-2" /> Submit Delivery
                </button>
              )}
              <button onClick={handleDeliverOrder} className="action-button primary-button">
                <FaCheck className="me-2" /> Deliver Order
              </button>
              <button onClick={() => setShowModificationModal(true)} className="action-button secondary-button">
                <FaEdit className="me-2" /> Request Modification
              </button>
              <button onClick={() => setShowShareModal(true)} className="action-button secondary-button">
                <FaShare className="me-2" /> Share Order
              </button>
              <button onClick={handleCancelOrder} className="action-button danger-button">
                <FaTimes className="me-2" /> Cancel Order
              </button>
            </div>
          );
        default:
          return (
            <div className="seller-actions">
              <button onClick={() => navigate("/sellerOrders")} className="action-button secondary-button">
                <FaChevronLeft className="me-2" /> Back to Orders
              </button>
            </div>
          );
      }
    }
  };

  if (loading) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarSeller />
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
        <NavbarSeller />
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
        <NavbarSeller />
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
      <NavbarSeller />
      
      <div className="breadcrumb">
        <span onClick={() => navigate("/dashboard")}>Home</span> 
        <FaChevronLeft className="breadcrumb-separator" /> 
        <span onClick={() => navigate("/sellerOrders")}>Orders</span> 
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
              {order.originalOrderId && (
                <div className="meta-item shared-badge">
                  <FaShare className="me-2" />
                  <span>Shared Order</span>
                </div>
              )}
            </div>
          </Fade>
        </div>

        <div className="gig-actions-bar">
          {renderActionButtons()}
        </div>

        <div className="gig-detail-content">
          <div className="gig-detail-left">
            <Zoom>
              <div className="gig-image-container">
                <div className="main-image-container">
                  <img
                    src={gig?.images ? `http://localhost:4000${gig.images}` : '/placeholder-image.jpg'}
                    alt={gig?.title || 'Gig Image'}
                    className="gig-main-image"
                  />
                </div>
              </div>
            </Zoom>

            <div className="gig-description-section">
              <h2>Gig Details</h2>
              <h3>{gig?.title || 'Loading...'}</h3>
              
              {data.order.originalOrderId && (
                <div className="shared-order-info">
                  <h3><FaShare className="me-2" /> Shared Order Information</h3>
                  <p>This order was shared with you from another freelancer.</p>
                  <p>Original Order Price: ${data.order.price}</p>
                  {data.order.sharedFrom && (
                    <p>Shared by: {data.order.sharedFrom}</p>
                  )}
                  {data.order.originalBuyerId && (
                    <p>Original Buyer: {data.order.originalBuyerId}</p>
                  )}
                  {originalOrder && (
                    <div className="original-order-status">
                      <p>Original Order Status: 
                        <span className={`status-badge ${originalOrder.status.toLowerCase()}`}>
                          {originalOrder.status}
                        </span>
                      </p>
                      <p>Original Order Price: ${originalOrder.price}</p>
                    </div>
                  )}
                  <p className="shared-order-note">
                    <strong>Note:</strong> The original seller is now acting as the buyer for this shared order.
                  </p>
                </div>
              )}

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
                    <span>{gig?.category || 'Loading...'}</span>
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

      {showModificationModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Request Modification</h2>
            <div className="form-group">
              <label>New Price</label>
              <input
                type="number"
                name="price"
                placeholder="Enter new price"
                value={modificationInput.price}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>New Delivery Time (days)</label>
              <input
                type="number"
                name="deliveryTime"
                placeholder="Enter new delivery time"
                value={modificationInput.deliveryTime}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Reason for Modification</label>
              <textarea
                name="reason"
                placeholder="Explain why you need this modification"
                value={modificationInput.reason}
                onChange={handleChange}
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleModificationSubmit} className="action-button primary-button">
                Submit Request
              </button>
              <button onClick={() => setShowModificationModal(false)} className="action-button secondary-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Share Order with Another Freelancer</h2>
            <div className="form-group">
              <label>Search Type</label>
              <div className="search-type-toggle">
                <button 
                  className={`search-type-btn ${searchType === 'gig' ? 'active' : ''}`}
                  onClick={() => setSearchType('gig')}
                >
                  Search by Gig
                </button>
                <button 
                  className={`search-type-btn ${searchType === 'seller' ? 'active' : ''}`}
                  onClick={() => setSearchType('seller')}
                >
                  Search by Seller
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>{searchType === 'gig' ? 'Search Gigs' : 'Search Seller Username'}</label>
              <input
                type="text"
                placeholder={searchType === 'gig' ? "Search for gigs..." : "Enter seller username..."}
                value={searchQuery}
                onChange={(e) => handleSearchGigs(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Share Price ($)</label>
              <input
                type="number"
                placeholder="Enter price to share"
                value={sharePrice}
                onChange={(e) => setSharePrice(e.target.value)}
                className="form-input"
                min="0"
                step="0.01"
              />
              <small className="price-hint">
                Available balance: ${order.price}
              </small>
            </div>
            {searchLoading ? (
              <div className="loading-spinner">Searching...</div>
            ) : (
              <div className="search-results">
                {searchResults.map((gig) => (
                  <div key={gig._id} className="gig-result">
                    <div className="gig-info">
                      <h3>{gig.title}</h3>
                      <p>{gig.description}</p>
                      <p className="gig-meta">
                        <span><FaDollarSign /> ${gig.pricePackages?.[0]?.price || 'N/A'}</span>
                        <span><FaRegClock /> {gig.deliveryTime} days</span>
                        {gig.sellerUsername && (
                          <span className="seller-info">
                            <FaUser /> {gig.sellerUsername}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleShareOrder(gig._id)}
                      className="action-button primary-button"
                      disabled={!sharePrice || parseFloat(sharePrice) <= 0 || parseFloat(sharePrice) > order.price}
                    >
                      Share Order
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => {
                setShowShareModal(false);
                setSharePrice('');
                setSearchQuery('');
                setSearchType('gig');
              }} className="action-button secondary-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Dispute Modal */}
      {showDisputeModal && (
        <div className="modal-overlay">
          <div className="dispute-modal">
            <h2>Open Dispute</h2>
            <div className="form-group">
              <label>Reason for Dispute</label>
              <textarea
                name="reason"
                placeholder="Explain why you want to open a dispute..."
                value={input.reason || ""}
                onChange={(e) => setInput({ ...input, reason: e.target.value })}
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleOpenDispute} className="buyer-action-button warning">
                Open Dispute
              </button>
              <button onClick={() => setShowDisputeModal(false)} className="buyer-action-button secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay">
          <div className="review-modal">
            <h2>Submit Review</h2>
            <div className="form-group">
              <label>Rating</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${parseInt(input.rating) >= star ? 'active' : ''}`}
                    onClick={() => setInput({ ...input, rating: star })}
                  >
                    <FaStar />
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Your Review</label>
              <textarea
                name="review"
                placeholder="Share your experience with this service..."
                value={input.review || ""}
                onChange={(e) => setInput({ ...input, review: e.target.value })}
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleReviewSubmit} className="buyer-action-button success">
                Submit Review
              </button>
              <button onClick={() => setShowReviewModal(false)} className="buyer-action-button secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewOrderDetailsSeller;
