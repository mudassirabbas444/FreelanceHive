import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaRegClock, FaTag, FaDollarSign, FaBrain } from 'react-icons/fa';
import "../../CSS/gig.css";

const SimilarGigs = ({ currentGigId }) => {
  const navigate = useNavigate();
  const [similarGigs, setSimilarGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarGigs = async () => {
      if (!currentGigId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:4000/api/gigs/${currentGigId}/similar`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch similar gigs');
        }
        
        const data = await response.json();
        setSimilarGigs(data);
      } catch (error) {
        console.error("Error fetching similar gigs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarGigs();
  }, [currentGigId]);

  const handleViewDetails = (gigId) => {
    // Prevent re-navigation to the same page
    if (gigId === currentGigId) return;
    
    // Track click for collaborative filtering
    fetch(`http://localhost:4000/api/gigs/${gigId}/click`, { method: "POST" });
    navigate(`/gigDetails/${gigId}`);
  };

  if (loading) {
    return (
      <div className="similar-gigs-section loading">
        <div className="section-header">
          <FaBrain className="nlp-icon" />
          <h3>Finding Similar Services...</h3>
        </div>
        <div className="similar-gigs-loading">
          <div className="loading-shimmer"></div>
        </div>
      </div>
    );
  }

  if (similarGigs.length === 0) {
    return null;
  }

  return (
    <div className="similar-gigs-section">
      <div className="section-header">
        <FaBrain className="nlp-icon" />
        <h3>Similar Services You Might Like</h3>
        <span className="powered-by-nlp">Matched using AI</span>
      </div>
      
      <div className="similar-gigs-grid">
        {similarGigs.map((gig) => (
          <div 
            key={gig._id} 
            className="similar-gig-card" 
            onClick={() => handleViewDetails(gig._id)}
          >
            {gig.images ? (
              <img 
                src={`http://localhost:4000${gig.images}`} 
                alt={gig.title} 
                className="similar-gig-image"
              />
            ) : (
              <div className="similar-gig-image placeholder">
                <span>No Image</span>
              </div>
            )}
            
            <div className="similar-gig-content">
              <h4 className="similar-gig-title">{gig.title}</h4>
              
              <div className="similar-gig-meta">
                <div className="meta-item">
                  <FaStar className="meta-icon" />
                  <span>{gig.rating || 'New'}</span>
                </div>
                
                <div className="meta-item">
                  <FaRegClock className="meta-icon" />
                  <span>{gig.pricePackages?.[0]?.deliveryTime || '3'} days</span>
                </div>
              </div>
              
              <div className="similar-gig-price">
                <FaDollarSign className="meta-icon" />
                <span>Starting at ${gig.pricePackages?.[0]?.price || '0'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimilarGigs; 