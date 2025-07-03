import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarAdmin from "../Includes/NavbarAdmin";
import { FaStar, FaCheck, FaRegClock, FaTimes,FaTag, FaDollarSign, FaEdit, FaTrash, FaPause, FaPlay, FaChevronLeft, FaCalendarAlt } from 'react-icons/fa';
import { Fade, Zoom } from 'react-reveal';
import "../../CSS/viewGigDetails.css";
import DOMPurify from 'dompurify';

function ViewGigDetailsAdmin() {
  const { gigId } = useParams();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Admin") {
      alert("Access denied. Please log in as an Admin.");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchGigDetails = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/gigs/${gigId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch gig details");
        }
        const data = await response.json();
        setGig(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGigDetails();
  }, [gigId]);

  // Handle Approve Gig
  const handleApprove = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/gigs/${gigId}/approve`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to approve the gig.");
      }

      alert("Gig approved successfully.");
      setGig({ ...gig, status: "active" });
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Handle Reject Gig
  const handleReject = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/gigs/${gigId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject the gig.");
      }

      alert("Gig rejected successfully.");
      setGig({ ...gig, status: "rejected", rejectionReason });
      setShowRejectModal(false); // Close modal
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Handle Delete Gig
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this gig?")) {
      try {
        const response = await fetch(`http://localhost:4000/api/gigs/${gigId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete gig.");
        }

        alert("Gig deleted successfully.");
        navigate("/adminGigs");
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  // Handle Update Gig
  const handleUpdate = () => {
    navigate(`/updateGig/${gigId}`);
  };

  if (loading) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarAdmin />
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading gig details...</p>
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
          <h2>Error Loading Gig</h2>
          <p>{error}</p>
          <button className="action-button primary-button" onClick={() => navigate(-1)}>
            <FaChevronLeft className="me-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarAdmin />
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h2>Gig Not Found</h2>
          <p>The gig you're looking for doesn't exist or has been removed.</p>
          <button className="action-button primary-button" onClick={() => navigate(-1)}>
            <FaChevronLeft className="me-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gig-container animate-fade-in">
      <NavbarAdmin />
      
      <div className="breadcrumb">
        <span onClick={() => navigate("/dashboard")}>Home</span> 
        <FaChevronLeft className="breadcrumb-separator" /> 
        <span onClick={() => navigate("/adminGigs")}>Gigs</span> 
        <FaChevronLeft className="breadcrumb-separator" /> 
        <span className="current-page">{gig.category}</span>
      </div>
      
      <div className="gig-detail-container">
        <div className="gig-detail-header">
          <Fade top>
            <h1>{gig.title}</h1>
            <div className="gig-meta-container">
              <div className="meta-item category-badge">
                <FaTag className="meta-icon" />
                <span>{gig.category}</span>
              </div>
              <div className="meta-item rating-badge">
                <FaStar className="meta-icon" />
                <span>{gig.rating || 'No ratings yet'}</span>
              </div>
              <div className="meta-item date-badge">
                <FaCalendarAlt className="meta-icon" />
                <span>Posted {new Date().toLocaleDateString()}</span>
              </div>
              <div className="meta-item status-badge">
                <span className={`status-badge ${gig.status.toLowerCase()}`}>
                  {gig.status}
                </span>
              </div>
            </div>
          </Fade>
        </div>

        <div className="gig-actions-bar">
          {gig.status === "pending" && (
            <div className="admin-actions">
              <button onClick={handleApprove} className="action-button success-button">
                <FaCheck className="me-2" /> Approve Gig
              </button>
              <button onClick={() => setShowRejectModal(true)} className="action-button danger-button">
                <FaTimes className="me-2" /> Reject Gig
              </button>
            </div>
          )}
          <button onClick={handleUpdate} className="action-button primary-button">
            <FaEdit className="me-2" /> Update Gig
          </button>
          <button onClick={handleDelete} className="action-button danger-button">
            <FaTrash className="me-2" /> Delete Gig
          </button>
        </div>

        {showRejectModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2>Reject Gig</h2>
              <textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="4"
                className="form-input"
              />
              <div className="modal-actions">
                <button onClick={handleReject} className="action-button danger-button">
                  Confirm Reject
                </button>
                <button onClick={() => setShowRejectModal(false)} className="action-button secondary-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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
              <h2>About This Gig</h2>
              <div 
                className="description-text"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(gig.description) 
                }}
              />
              
              <h3>What you'll get:</h3>
              <ul className="features-list">
                {gig.features || ['Professional service', 'Fast delivery', 'High quality work'].map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
              
              <div className="requirements-section">
                <h3>Requirements</h3>
                <p>{gig.prerequisites || "No specific requirements. The seller will contact you after your order to gather any necessary information."}</p>
              </div>
            </div>
          </div>

          <div className="gig-detail-right">
            <div className="price-packages-section">
              <h2>Price Packages</h2>
              {gig.pricePackages.length > 0 ? (
                gig.pricePackages.map((pkg, index) => (
                  <Fade bottom key={index}>
                    <div className="price-package-card">
                      <h3>{pkg.name}</h3>
                      <p className="package-description">{pkg.description}</p>
                      <div className="package-details">
                        <div className="detail-item">
                          <FaDollarSign className="detail-icon" />
                          <span>{pkg.price} USD</span>
                        </div>
                        <div className="detail-item">
                          <FaRegClock className="detail-icon" />
                          <span>{pkg.deliveryTime} days delivery</span>
                        </div>
                        <div className="detail-item">
                          <span>{pkg.revisions} revisions</span>
                        </div>
                      </div>
                    </div>
                  </Fade>
                ))
              ) : (
                <div className="no-packages">
                  <p>No price packages available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewGigDetailsAdmin;
