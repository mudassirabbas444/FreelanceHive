import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavbarBuyer from "../Includes/NavbarBuyer";
import {
  FaStar, FaRegClock, FaTag, FaDollarSign, FaChevronRight, FaComments,
  FaUserCircle, FaCalendarAlt, FaCheck, FaShieldAlt, FaThumbsUp, FaHeart,
  FaShare, FaBookmark, FaArrowLeft, FaPaperPlane
} from 'react-icons/fa';
import { Fade, Zoom } from 'react-reveal';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import "../../CSS/viewGigDetails.css";
import SimilarGigs from "./SimilarGigs";
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Initialize Stripe
const stripePromise = loadStripe('');
const key="";
// Payment Form Component
const PaymentForm = ({ selectedPackage, gig, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch wallet balance when component mounts
    const fetchWalletBalance = async () => {
      try {
        const sessionUser = sessionStorage.getItem("user");
        if (!sessionUser) {
          throw new Error("Please log in to complete payment.");
        }

        const userId = JSON.parse(sessionUser)?.id;
        const response = await fetch(`http://localhost:4000/api/wallet/available/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch wallet balance');
        }
        const data = await response.json();
        setWalletBalance(data.verified || 0);
      } catch (err) {
        console.error('Error fetching wallet balance:', err);
        setError(err.message);
      }
    };

    fetchWalletBalance();
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionUser = sessionStorage.getItem("user");
      if (!sessionUser) {
        throw new Error("Please log in to complete payment.");
      }

      const buyerId = JSON.parse(sessionUser)?.id;
      const totalAmount = selectedPackage.price;
      const walletAmount = Math.min(walletBalance, totalAmount);
      const remainingAmount = totalAmount - walletAmount;

      // If we have enough in wallet, use only wallet
      if (walletAmount >= totalAmount) {
        // Create order with wallet payment
        const orderResponse = await fetch('http://localhost:4000/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gigId: gig._id,
            buyerId,
            sellerId: gig.sellerId,
            packageId: selectedPackage._id,
            prerequisites: gig.prerequisites,
            price: totalAmount,
            status: "Pending",
            paymentMethod: "wallet",
            walletAmount: totalAmount
          }),
        });

        if (!orderResponse.ok) {
          throw new Error('Failed to create order');
        }

        onSuccess();
        return;
      }

      // If we need to use both wallet and card
      if (remainingAmount > 0) {
        // Create payment intent for remaining amount
        const response = await fetch('http://localhost:4000/api/payment/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: remainingAmount * 100, // Convert to cents
            currency: 'usd',
            gigId: gig._id,
            buyerId,
            sellerId: gig.sellerId,
            packageId: selectedPackage._id,
            walletAmount: walletAmount
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }

        const { clientSecret } = await response.json();
        
        // Confirm payment for remaining amount
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: JSON.parse(sessionUser).name,
            },
          },
        });

        if (stripeError) {
          throw new Error(stripeError.message);
        }

        // Create order with both payment methods
        const orderResponse = await fetch('http://localhost:4000/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gigId: gig._id,
            buyerId,
            sellerId: gig.sellerId,
            packageId: selectedPackage._id,
            prerequisites: gig.prerequisites,
            price: totalAmount,
            status: "Pending",
            paymentMethod: "mixed",
            walletAmount: walletAmount,
            cardAmount: remainingAmount,
            paymentIntentId: paymentIntent.id
          }),
        });

        if (!orderResponse.ok) {
          throw new Error('Failed to create order');
        }

        onSuccess();
      }
    } catch (error) {
      console.error("Payment error:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-form" style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginTop: '15px'
    }}>
      {error && (
        <div className="error-message" style={{
          color: '#dc3545',
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#f8d7da',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}

      <div className="wallet-info" style={{
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#e9ecef',
        borderRadius: '4px'
      }}>
        <h4 style={{ marginBottom: '10px' }}>Payment Summary</h4>
        <p>Total Amount: ${selectedPackage.price}</p>
        <p>Available Wallet Balance: ${walletBalance.toFixed(2)}</p>
        {walletBalance > 0 && (
          <p style={{ color: '#28a745' }}>
            ${Math.min(walletBalance, selectedPackage.price).toFixed(2)} will be deducted from your wallet
          </p>
        )}
        {walletBalance < selectedPackage.price && (
          <p style={{ color: '#dc3545' }}>
            ${(selectedPackage.price - walletBalance).toFixed(2)} will be charged to your card
          </p>
        )}
      </div>

      {walletBalance < selectedPackage.price && (
        <div className="card-element-container" style={{
          padding: '12px',
          backgroundColor: 'white',
          borderRadius: '6px',
          border: '1px solid #e0e0e0',
          marginBottom: '20px'
        }}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                  ':-webkit-autofill': {
                    color: '#424770',
                  },
                },
                invalid: {
                  color: '#9e2146',
                  iconColor: '#9e2146',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || (walletBalance < selectedPackage.price && !elements)}
        className="action-button primary-button order-button"
        style={{
          width: '100%',
          padding: '12px 20px',
          fontSize: '16px',
          fontWeight: '600',
          backgroundColor: loading ? '#6c757d' : '#1dbf73',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Processing...
          </>
        ) : (
          <>
            <FaDollarSign className="me-1" /> 
            {walletBalance >= selectedPackage.price ? 'Pay with Wallet' : 'Pay Remaining Amount'}
          </>
        )}
      </button>
    </div>
  );
};

function ViewGigDetails() {
  const { gigId } = useParams();
  const navigate = useNavigate();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedImage, setSelectedImage] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageContent, setMessageContent] = useState('');

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (!user || user.role !== "Buyer") {
      alert("Access denied. Please log in as a Buyer.");
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

        // Track impression for collaborative filtering
        fetch(`http://localhost:4000/api/gigs/${gigId}/impression`, { method: "POST" });
      } catch (error) {
        console.error("Error fetching gig details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGigDetails();
  }, [gigId]);

  const handleSelectPackage = async (packageId) => {
    try {
      const sessionUser = sessionStorage.getItem("user");
      if (!sessionUser) {
        console.error("User session not found.");
        throw new Error("Please log in to place an order.");
      }

      const buyerId = JSON.parse(sessionUser)?.id;
      if (!buyerId) {
        console.error("Buyer ID is missing in session data:", sessionUser);
        throw new Error("Invalid user session. Please log in again.");
      }

      if (!gig?.sellerId || !gig?.pricePackages) {
        throw new Error("Gig details are incomplete. Please refresh the page.");
      }

      const selectedPkg = gig.pricePackages.find((pkg) => pkg._id === packageId);
      if (!selectedPkg) {
        throw new Error("Selected package not found. Please try again.");
      }

      setSelectedPackage(selectedPkg);
      setShowPaymentForm(true);
    } catch (error) {
      console.error("Error selecting package:", error.message);
      alert(error.message);
    }
  };

  const handlePaymentSuccess = () => {
    const orderSuccessModal = document.createElement('div');
    orderSuccessModal.className = 'order-success-modal';
    orderSuccessModal.innerHTML = `
      <div class="order-success-content">
        <div class="success-icon">✓</div>
        <h2>Payment Successful!</h2>
        <p>Your order has been placed successfully.</p>
        <button id="viewOrdersBtn" class="action-button primary-button">View My Orders</button>
      </div>
    `;
    document.body.appendChild(orderSuccessModal);

    document.getElementById('viewOrdersBtn').addEventListener('click', () => {
      document.body.removeChild(orderSuccessModal);
      navigate('/orders');
    });
  };

  const handleSendMessage = () => {
    if (gig && gig.sellerId) {
      // Navigate directly to chat with the seller
      navigate(`/chat/${gig.sellerId}`);
    } else {
      alert("Seller not found for this gig.");
    }
  };

  const handleSaveGig = async () => {
    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      if (!user) {
        alert("Please log in to save gigs");
        return;
      }

      // Toggle saved state
    setIsSaved(!isSaved);
      
      // Track save for collaborative filtering
    if (!isSaved) {
        // Add to saved gigs in session storage
        const savedGigs = JSON.parse(sessionStorage.getItem("savedGigs")) || [];
        if (!savedGigs.includes(gigId)) {
          savedGigs.push(gigId);
          sessionStorage.setItem("savedGigs", JSON.stringify(savedGigs));
          
          // Track save in backend
          fetch(`http://localhost:4000/api/gigs/${gigId}/save`, { 
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id })
          });
        }
      }
    } catch (error) {
      console.error("Error saving gig:", error);
    }
  };

  const handleShareGig = () => {
    if (navigator.share) {
      navigator.share({
        title: gig.title,
        text: gig.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  if (loading) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarBuyer />
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
        <NavbarBuyer />
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error Loading Gig</h2>
          <p>{error}</p>
          <button className="action-button primary-button" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="gig-container animate-fade-in">
        <NavbarBuyer />
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h2>Gig Not Found</h2>
          <p>The gig you're looking for doesn't exist or has been removed.</p>
          <button className="action-button primary-button" onClick={() => navigate(-1)}>
            <FaArrowLeft className="me-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // Simulate multiple images for the gallery
  const gigImages = gig.images
    ? [gig.images, ...Array(3).fill(gig.images)]
    : ["/placeholder-image.jpg", "/placeholder-image.jpg"];

  return (
    <Elements stripe={stripePromise}>
      <div className="gig-container animate-fade-in">
        <NavbarBuyer />

        <div className="breadcrumb">
          <span onClick={() => navigate("/dashboard")}>Home</span>
          <FaChevronRight className="breadcrumb-separator" />
          <span onClick={() => navigate("/gigs")}>Gigs</span>
          <FaChevronRight className="breadcrumb-separator" />
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
                  <span>{gig.rating || 'New'}</span>
                </div>
                <div className="meta-item date-badge">
                  <FaCalendarAlt className="meta-icon" />
                  <span>Posted {new Date().toLocaleDateString()}</span>
                </div>
                <div className="meta-actions">
                  <button className={`action-icon-button ${isSaved ? 'saved' : ''}`} onClick={handleSaveGig}>
                    <FaBookmark className={isSaved ? 'active' : ''} />
                    <span>{isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                  <button className="action-icon-button" onClick={handleShareGig}>
                    <FaShare />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </Fade>
          </div>

          <div className="gig-detail-content">
            <div className="gig-detail-left">
              <Zoom>
                <div className="gig-image-container">
                  <div className="main-image-container">
                    <img
                      src={`http://localhost:4000${gigImages[selectedImage]}`}
                      alt={gig.title}
                      className="gig-main-image"
                    />
                  </div>
                  <div className="image-thumbnail-container">
                    {gigImages.map((img, index) => (
                      <div
                        key={index}
                        className={`image-thumbnail ${selectedImage === index ? 'active' : ''}`}
                        onClick={() => setSelectedImage(index)}
                      >
                        <img
                          src={`http://localhost:4000${img}`}
                          alt={`Thumbnail ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Zoom>

              <div className="seller-info-card">
                <div className="seller-header">
                  <div className="seller-avatar">
                    <FaUserCircle size={50} />
                  </div>
                  <div className="seller-details">
                    <h3>{gig.sellerName || "Professional Seller"}</h3>
                    <div className="seller-stats">
                      <span><FaStar /> {gig.sellerRating || '4.9'}</span>
                      <span><FaThumbsUp /> {gig.completedOrders || '98'}% Completion</span>
                    </div>
                  </div>
                </div>
                {showMessageForm ? (
                  <div className="message-form-container">
                    <ReactQuill
                      value={messageContent}
                      onChange={setMessageContent}
                      modules={quillModules}
                      placeholder="Write your message to the seller..."
                      className="message-editor"
                    />
                    <div className="message-actions">
                      <button 
                        onClick={() => setShowMessageForm(false)} 
                        className="action-button cancel-button"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSendMessage} 
                        className="action-button primary-button"
                      >
                        <FaPaperPlane className="me-1" /> Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleSendMessage} className="action-button secondary-button seller-contact-btn">
                    <FaComments className="me-2" /> Contact Seller
                  </button>
                )}
              </div>

              <div className="tab-navigation">
                <button
                  className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
                  onClick={() => setActiveTab('description')}
                >
                  Description
                </button>
                <button
                  className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  Reviews ({gig?.reviews?.length || 0})
                </button>
                <button
                  className={`tab-button ${activeTab === 'faq' ? 'active' : ''}`}
                  onClick={() => setActiveTab('faq')}
                >
                  FAQ
                </button>
              </div>

              {activeTab === 'description' && (
                <Fade>
                  <div className="gig-description-section">
                    <h2>About This Gig</h2>
                    <div 
                      className="description-text"
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(gig.description) 
                      }}
                    />

                    <div className="requirements-section">
                      <h3>Requirements</h3>
                      <p>{gig.prerequisites || "No specific requirements. The seller will contact you after your order to gather any necessary information."}</p>
                    </div>

                    <div className="guarantee-banner">
                      <FaShieldAlt className="guarantee-icon" />
                      <div className="guarantee-text">
                        <h4>Buyer Protection Guarantee</h4>
                        <p>Your payment is held securely until you approve the delivered work</p>
                      </div>
                    </div>
                  </div>
                </Fade>
              )}

              {activeTab === 'reviews' && (
                <Fade>
                  <div className="reviews-section">
                    <div className="reviews-header">
                      <h2>Customer Reviews</h2>
                      <div className="review-summary">
                        <div className="average-rating">
                          <span className="rating-number">{gig.rating || '0'}</span>
                          <div className="stars-container">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className={`star ${i < Math.round(gig.rating || 0) ? 'filled' : ''}`} />
                            ))}
                          </div>
                        </div>
                        <div className="rating-breakdown">
                          {[5, 4, 3, 2, 1].map(num => (
                            <div key={num} className="rating-bar">
                              <span>{num} stars</span>
                              <div className="progress-bar">
                                <div className="progress" style={{ width: `${Math.random() * 100}%` }}></div>
                              </div>
                              <span>{Math.floor(Math.random() * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {gig?.reviews?.length > 0 ? (
                      gig.reviews.map((review, index) => (
                        <Fade bottom key={index}>
                          <div className="review-card">
                            <div className="review-header">
                              <div className="reviewer-info">
                                <FaUserCircle className="reviewer-avatar" />
                                <div>
                                  <h4>{review.username}</h4>
                                  <span className="review-date">Posted on {new Date().toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="review-rating">
                                {[...Array(5)].map((_, i) => (
                                  <FaStar
                                    key={i}
                                    className={`star ${i < review.rating ? 'filled' : ''}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="review-text">{review.review}</p>
                            <div className="review-footer">
                              <span>Was this review helpful?</span>
                              <button className="helpful-button"><FaThumbsUp /> Yes</button>
                            </div>
                          </div>
                        </Fade>
                      ))
                    ) : (
                      <div className="no-reviews">
                        <div className="empty-reviews-icon">⭐</div>
                        <h3>No Reviews Yet</h3>
                        <p>Be the first to review this gig after your purchase!</p>
                      </div>
                    )}
                  </div>
                </Fade>
              )}

              {activeTab === 'faq' && (
                <Fade>
                  <div className="faq-section">
                    <h2>Frequently Asked Questions</h2>

                    <div className="faq-list">
                      {[
                        { q: "How long does delivery take?", a: "Delivery time depends on the package you select. Basic packages typically deliver in 3 days, while Premium offers faster delivery." },
                        { q: "Can I request revisions?", a: "Yes, you can request revisions according to your package. Basic includes 1 revision, Standard 2 revisions, and Premium 3 revisions." },
                        { q: "What information do I need to provide?", a: "After placing your order, the seller will contact you with a requirements form to gather all necessary information to complete your order." },
                        { q: "How does payment work?", a: "Your payment is secured in escrow until you confirm the delivery meets your requirements." }
                      ].map((item, index) => (
                        <div key={index} className="faq-item">
                          <h3>{item.q}</h3>
                          <p>{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Fade>
              )}
            </div>

            <div className="gig-detail-right">
              <div className="sticky-sidebar">
                <div className="price-packages-section">
                  <h2>Choose a Package</h2>
                  {gig?.pricePackages?.length > 0 ? (
                    <div className="package-tabs">
                      <div className="package-tab-buttons">
                        {gig.pricePackages.map((pkg, idx) => (
                          <button
                            key={idx}
                            className={`package-tab-button ${idx === 0 ? 'active' : ''}`}
                            onClick={() => document.querySelectorAll('.package-tab-content').forEach((el, i) => {
                              el.style.display = i === idx ? 'block' : 'none';
                              document.querySelectorAll('.package-tab-button').forEach((btn, j) => {
                                btn.className = `package-tab-button ${j === idx ? 'active' : ''}`;
                              });
                            })}
                          >
                            {pkg.name}
                          </button>
                        ))}
                      </div>

                      <div className="package-tab-contents">
                        {gig.pricePackages.map((pkg, idx) => (
                          <div
                            key={idx}
                            className="package-tab-content"
                            style={{ display: idx === 0 ? 'block' : 'none' }}
                          >
                            <div className="package-header">
                              <h3>{pkg.name}</h3>
                              <span className="package-price">${pkg.price}</span>
                            </div>

                            <p className="package-description">{pkg.description}</p>

                            <div className="package-details">
                              <div className="detail-item">
                                <FaRegClock className="detail-icon" />
                                <span>{pkg.deliveryTime} days delivery</span>
                              </div>
                              <div className="detail-item">
                                <FaCheck className="detail-icon" />
                                <span>{pkg.revisions} revisions</span>
                              </div>
                              {pkg.features && pkg.features.map((feature, i) => (
                                <div key={i} className="detail-item">
                                  <FaCheck className="detail-icon" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>

                            {showPaymentForm && selectedPackage?._id === pkg._id ? (
                              <PaymentForm 
                                selectedPackage={selectedPackage} 
                                gig={gig} 
                                onSuccess={handlePaymentSuccess}
                              />
                            ) : (
                              <button
                                onClick={() => handleSelectPackage(pkg._id)}
                                className="action-button primary-button order-button"
                              >
                                <FaDollarSign className="me-1" /> Order Now
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="no-packages">
                      <p>No price packages available.</p>
                    </div>
                  )}
                </div>

                <div className="contact-seller-card">
                  <h3><FaComments className="card-icon" /> Have Questions?</h3>
                  <p>Get in touch with the seller to discuss your requirements before ordering.</p>
                  <button 
                    onClick={handleSendMessage}
                    className="action-button secondary-button"
                  >
                    Contact Seller
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="recommendations-container">
        <SimilarGigs currentGigId={gigId} />
      </div>
    </Elements>
  );
}

export default ViewGigDetails;