import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "../Includes/NavbarAdmin";
import { FaShoppingBag,FaUser, FaDollarSign,FaStar, FaRegClock, FaExclamationTriangle, FaChevronRight, FaUsers } from 'react-icons/fa';
import { Fade } from 'react-reveal';
import "../../CSS/gig.css";

function ViewOrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");  // New state for filter
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Admin") {
      alert("Access denied. Please log in as an Admin.");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/orders?status=${statusFilter}`);

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
  }, [statusFilter]);  

  const handleViewOrder = (orderId) => {
    navigate(`/adminOrder/${orderId}`);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  if (loading) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarAdmin />
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
        <NavbarAdmin />
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
        <NavbarAdmin />
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h2>No Orders Found</h2>
          <p>There are no orders in the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gig-container animate-fade-in">
      <NavbarAdmin />
      <div className="page-header">
        <h1>All Orders</h1>
        <p>Manage and monitor all orders in the system</p>
      </div>

      {/* Add Filter Dropdown */}
      <div className="filter-container">
        <label htmlFor="status-filter">Filter by Status:</label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
        >
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Canceled</option>
          <option value="Modification Requested">Modification Requested</option>
          <option value="Disputed">Disputed</option>
        </select>
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
                <div className="gig-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
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
                    <FaUsers className="meta-icon" />
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

export default ViewOrdersAdmin;
