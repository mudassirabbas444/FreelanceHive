import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarBuyer from "../Includes/NavbarBuyer";
import { FaShoppingBag, FaDollarSign, FaRegClock, FaExclamationTriangle, FaChevronRight, FaUser, FaStar } from 'react-icons/fa';
import { Fade } from 'react-reveal';
import "../../CSS/gig.css";

function ViewOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Buyer") {
      alert("Access denied. Please log in as a Buyer.");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const userId = JSON.parse(sessionStorage.getItem("user"))?.id;
        const role = JSON.parse(sessionStorage.getItem("user"))?.role;
        const response = await fetch(
          `http://localhost:4000/api/orders/user/${userId}/${role}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch orders.");
        }

        const data = await response.json();

        const ordersWithGigs = await Promise.all(
          data.map(async (order) => {
            try {
              const gigResponse = await fetch(`http://localhost:4000/api/gigs/${order.gigId}`);
              if (!gigResponse.ok) {
                throw new Error("Failed to fetch gig details.");
              }

              const gig = await gigResponse.json();
              return { ...order, gig };
            } catch (err) {
              console.error(`Error fetching gig for order ${order._id}:`, err);
              return { ...order, gig: null };
            }
          })
        );

        setOrders(ordersWithGigs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  });

  const handleViewOrder = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  if (loading) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarBuyer />
        <div className="loading-skeleton">
          <div className="skeleton-image"></div>
          <div className="skeleton-content">
            <div className="skeleton-title"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text"></div>
            <div className="skeleton-text"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarBuyer />
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Orders</h2>
          <p>{error}</p>
          <button className="action-button primary-button" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarBuyer />
        <div className="empty-state">
          <div className="empty-state-icon">🛍️</div>
          <h2>No Orders Found</h2>
          <p>You haven't placed any orders yet.</p>
          <button className="action-button primary-button" onClick={() => navigate('/gigs')}>
            Browse Gigs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gig-container animate-fade-in">
      <NavbarBuyer />
      <div className="page-header">
        <h1>My Purchases</h1>
        <p>Track and manage your orders</p>
      </div>

      <div className="gig-stats">
        <p>{orders.length} orders found</p>
      </div>

      <div className="gig-grid">
        {orders.map((order) => (
          <Fade bottom key={order._id}>
            <div className="gig-card" onClick={() => handleViewOrder(order._id)}>
              {order.gig?.images ? (
                <img
                  src={`http://localhost:4000${order.gig.images}`}
                  alt={order.gig.title || "Gig Image"}
                  className="gig-image"
                />
              ) : (
                <div className="gig-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', width:"20px",height:"30px"}}>
                  <span style={{ color: '#a0aec0' }}>No Image</span>
                </div>
              )}
              
              <div className="gig-content">
                <h3 className="gig-title">{order.gig?.title || "Unknown Gig"}</h3>
                
                <div className="gig-meta">
                  <div className="meta-item">
                    <FaDollarSign className="meta-icon" />
                    <span>${order.price || "Unknown Price"}</span>
                  </div>
                  <div className="meta-item">
                    <FaRegClock className="meta-icon" />
                    <span>{order.deliveryTime} days delivery</span>
                  </div>
                  <div className="meta-item">
                    <FaUser className="meta-icon" />
                    <span>Order ID: {order._id}</span>
                  </div>
                  <div className="meta-item">
                    <FaStar className="meta-icon" />
                    <span>status: {order.status}</span>
                  </div>
                </div>

               

                <div className="gig-actions">
                  <button className="action-button primary-button">
                    <FaChevronRight className="me-2" /> View Details
                  </button>
                </div>
              </div>
            </div>
          </Fade>
        ))}
      </div>
    </div>
  );
}

export default ViewOrders;