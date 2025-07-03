import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarSeller from '../Includes/NavbarSeller';
import { Button } from 'react-bootstrap';
import { FaPlus, FaChevronRight, FaRegClock, FaRegCalendarAlt, FaTag, FaDollarSign } from 'react-icons/fa';
import { Fade } from 'react-reveal';
import "../../CSS/gig.css";

function ViewGigsSeller() {
  const navigate = useNavigate();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Seller") {
      alert("Access denied. Please log in as a Seller.");
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchGigs = async () => {
      try {
        setLoading(true);
        const sellerId = JSON.parse(sessionStorage.getItem("user"))?.id;
        if (!sellerId) {
          console.error("Seller ID not found. Session storage value:", sessionStorage.getItem("user"));
          throw new Error("Seller ID not found in session.");
        }

        const response = await fetch(`http://localhost:4000/api/gigs/seller?sellerId=${sellerId}`);
        if (!response.ok) throw new Error('Failed to fetch gigs');

        const data = await response.json();
        setGigs(data);
      } catch (error) {
        console.error('Error fetching gigs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGigs();
  }, []);

  const handleViewDetails = (gigId) => {
    navigate(`/gigSeller/${gigId}`);
  };

  const handleCreateGig = () => {
    navigate(`/createGig`);
  };

  return (
    <div className="gig-container animate-fade-in">
      <NavbarSeller />

      <div className="page-header">
        <h1>Your Gigs</h1>
        <p>Manage and monitor your service offerings</p>
      </div>

      <div className="gig-stats">
        <p>{gigs.length} gigs found</p>
        <button 
          onClick={handleCreateGig}
          className="action-button primary-button"
        >
          <FaPlus className="me-2" /> Create New Gig
        </button>
      </div>

      <div className="gig-grid">
        {loading ? (
          Array(6).fill().map((_, index) => (
            <div key={`skeleton-${index}`} className="loading-card"></div>
          ))
        ) : gigs.length > 0 ? (
          gigs.map((gig) => (
            <Fade bottom key={gig._id}>
              <div className="gig-card" onClick={() => handleViewDetails(gig._id)}>
                {gig.images ? (
                  <img 
                    src={`http://localhost:4000${gig.images}`}
                    alt={gig.title}
                    className="gig-image"
                  />
                ) : (
                  <div className="gig-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
                    <span style={{ color: '#a0aec0' }}>No Image</span>
                  </div>
                )}
                <div className="gig-content">
                  <div className="category-pill">
                    <FaTag className="me-2" />
                    {gig.category}
                  </div>
                  <h3 className="gig-title">{gig.title}</h3>
                  
                  <div className="gig-meta">
                    <div className="meta-item">
                      <span className="meta-label">Starting at</span>
                      <span className="meta-value">
                        <FaDollarSign style={{ marginRight: '4px', fontSize: '12px' }} />
                        {gig.pricePackages && gig.pricePackages[0]?.price}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Delivery</span>
                      <span className="meta-value">
                        <FaRegClock style={{ marginRight: '4px', fontSize: '12px' }} />
                        {gig.pricePackages && gig.pricePackages[0]?.deliveryTime} days
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Status</span>
                      <span className={`status-badge ${gig.status.toLowerCase()}`}>
                        {gig.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="gig-actions">
                    <button className="action-button primary-button" style={{ marginRight: '4px', height:30, width:50  }}>
                      <FaChevronRight style={{ marginRight: '4px' }} /> View Details
                    </button>
                  </div>
                </div>
              </div>
            </Fade>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h2>No Gigs Found</h2>
            <p>Start by creating your first gig</p>
            <button 
              className="action-button primary-button" 
              style={{ marginTop: '1rem', width: 'auto' }}
              onClick={handleCreateGig}
            >
              <FaPlus className="me-2" /> Create New Gig
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewGigsSeller;