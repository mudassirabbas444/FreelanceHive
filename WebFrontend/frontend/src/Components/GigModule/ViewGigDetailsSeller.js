import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarSeller from "../Includes/NavbarSeller";
import { FaStar, FaRegClock, FaTag, FaDollarSign, FaEdit, FaTrash, FaPause, FaPlay, FaChevronLeft, FaCalendarAlt } from 'react-icons/fa';
import { Fade, Zoom } from 'react-reveal';
import "../../CSS/viewGigDetails.css";
import DOMPurify from 'dompurify';

function ViewGigDetailsSeller() {
  const { gigId } = useParams();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Seller") {
      alert("Access denied. Please log in as a Seller.");
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

  const handlePauseGig = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/gigs/pause/${gigId}`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to pause gig.");
      }

      const result = await response.json();
      alert(result.message);

      // Update gig status in the UI
      setGig((prev) => ({ ...prev, status: "paused" }));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleActivateGig = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/gigs/activate/${gigId}`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to activate gig.");
      }

      const result = await response.json();
      alert(result.message);

      // Update gig status in the UI
      setGig((prev) => ({ ...prev, status: "active" }));
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

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
        navigate("/sellerGigs");
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleUpdate = () => {
    navigate(`/updateGig/${gigId}`);
  };

  if (loading) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarSeller />
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
        <NavbarSeller />
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
        <NavbarSeller />
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
      <NavbarSeller />
      
      <div className="breadcrumb">
        <span onClick={() => navigate("/dashboard")}>Home</span> 
        <FaChevronLeft className="breadcrumb-separator" /> 
        <span onClick={() => navigate("/sellerGigs")}>Gigs</span> 
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
          {gig.status !== "deleted" && (
            <button onClick={handleUpdate} className="action-button primary-button">
              <FaEdit className="me-2" /> Update Gig
            </button>
          )}
          {gig.status !== "deleted" && (
            <button onClick={handleDelete} className="action-button danger-button">
              <FaTrash className="me-2" /> Delete Gig
            </button>
          )}
          {gig.status === "active" && (
            <button onClick={handlePauseGig} className="action-button warning-button" style={{backgroundColor:"yellow"}}>
              <FaPause className="me-2" /> Pause Gig
            </button>
          )}
          {gig.status === "paused" && (
            <button onClick={handleActivateGig} className="action-button success-button">
              <FaPlay className="me-2" /> Activate Gig
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

export default ViewGigDetailsSeller;
