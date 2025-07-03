import React, { useState } from "react";
import "../../CSS/createGig.css";
import NavbarSeller from "../Includes/NavbarSeller";
import { useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert, Form, Card, Badge, Row, Col, InputGroup } from 'react-bootstrap';
import { FaMagic, FaSync, FaImage, FaTimes, FaPlus, FaTag, FaBox, FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { motion, AnimatePresence } from 'framer-motion';

const CreateGig = () => {
  const navigate = useNavigate();
  
  // Add state for current section
  const [currentSection, setCurrentSection] = useState(1);
  
  const handleGoBack = () => {
    navigate(-1);
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subcategory: "",
    images: "",
    tags: [],
    pricePackages: [
      {
        name: "",
        price: "",
        deliveryTime: "",
        revisions: "",
      },
    ],
  });

  const [tagInput, setTagInput] = useState('');

  // Quill editor modules and formats configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ],
  };
  
  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'link'
  ];

  const [uploadedImages, setUploadedImages] = useState([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [generatedOptions, setGeneratedOptions] = useState([]);
  const [imagePrompt, setImagePrompt] = useState({
    companyName: "",
    slogan: "",
    services: [],
    keywords: [],
    style: "realistic",
    mood: "professional"
  });
  const [serviceInput, setServiceInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [imageError, setImageError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle description change from Quill editor
  const handleDescriptionChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      description: content
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImages([URL.createObjectURL(file)]); 
      setFormData((prev) => ({
        ...prev,
        images: file, 
      }));
    }
  };

  const handlePackageChange = (e, index) => {
    const { name, value } = e.target;
    const newPackages = [...formData.pricePackages];
    newPackages[index][name] = value;
    setFormData((prev) => ({
      ...prev,
      pricePackages: newPackages,
    }));
  };

  const handleAddPackage = () => {
    if (formData.pricePackages.length >= 3) {
      alert("You can only add up to 3 price packages.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      pricePackages: [
        ...prev.pricePackages,
        {
          name: "",
          price: "",
          deliveryTime: "",
          revisions: "",
        },
      ],
    }));
  };

  const handleRemovePackage = (index) => {
    const newPackages = formData.pricePackages.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      pricePackages: newPackages,
    }));
  };

  // Handle adding tags
  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !formData.tags.includes(tag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tag]
        }));
        setTagInput('');
      }
    }
  };

  // Handle removing tags
  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert("Title is required");
      return false;
    }
    if (!formData.description.trim()) {
      alert("Description is required");
      return false;
    }
    if (!formData.category) {
      alert("Category is required");
      return false;
    }
    if (!formData.subcategory.trim()) {
      alert("Subcategory is required");
      return false;
    }
    if (formData.tags.length === 0) {
      alert("At least one tag is required");
      return false;
    }
    if (formData.pricePackages.length < 1 || formData.pricePackages.length > 3) {
      alert("You must provide at least one and no more than three price packages.");
      return false;
    }
    
    for (const pkg of formData.pricePackages) {
      if (!pkg.name.trim()) {
        alert("Package name is required");
        return false;
      }
      if (!pkg.price || isNaN(pkg.price) || parseFloat(pkg.price) <= 0) {
        alert("Valid price is required for each package");
        return false;
      }
      if (!pkg.deliveryTime || isNaN(pkg.deliveryTime) || parseInt(pkg.deliveryTime) <= 0) {
        alert("Valid delivery time is required for each package");
        return false;
      }
      if (!pkg.revisions || isNaN(pkg.revisions) || parseInt(pkg.revisions) < 0) {
        alert("Valid revisions count is required for each package");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const user = JSON.parse(sessionStorage.getItem("user"));
      if (!user || !user.id) {
        throw new Error("Seller ID not found in session.");
      }

      const formDataToSubmit = new FormData();
      formDataToSubmit.append("title", formData.title);
      formDataToSubmit.append("description", formData.description);
      formDataToSubmit.append("category", formData.category);
      formDataToSubmit.append("subcategory", formData.subcategory);
      formDataToSubmit.append("tags", formData.tags.join(','));
      formDataToSubmit.append("sellerId", user.id);

      // Handle both uploaded file and AI-generated image
      if (formData.images instanceof File) {
        formDataToSubmit.append("image", formData.images);
      } else if (typeof formData.images === 'string' && formData.images.startsWith('data:image')) {
        // Convert base64 to blob for AI-generated image
        const base64Response = await fetch(formData.images);
        const blob = await base64Response.blob();
        formDataToSubmit.append("image", blob, "ai-generated-image.png");
      }

      // Append each price package as a separate field
      formData.pricePackages.forEach((pkg, index) => {
        formDataToSubmit.append(`pricePackages[${index}][name]`, pkg.name);
        formDataToSubmit.append(`pricePackages[${index}][price]`, pkg.price);
        formDataToSubmit.append(`pricePackages[${index}][deliveryTime]`, pkg.deliveryTime);
        formDataToSubmit.append(`pricePackages[${index}][revisions]`, pkg.revisions);
      });

      const response = await fetch("http://localhost:4000/api/gigs", {
        method: "POST",
        body: formDataToSubmit,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to create gig: ${data.message || response.statusText}`);
      }

      alert("Gig created successfully");
      navigate("/sellerGigs");
    } catch (error) {
      console.error("Error creating gig:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleGenerateContent = async () => {
    if (!aiPrompt.trim()) {
      setAiError("Please enter a prompt for content generation");
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    try {
      const response = await fetch('https://ff9a-35-198-246-218.ngrok-free.app/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          maxLength: 200,
          numSamples: 3
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      setGeneratedOptions(data.results);
    } catch (error) {
      console.error('Error generating content:', error);
      setAiError(error.message || 'Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectGeneratedContent = (option) => {
    setFormData(prev => ({
        ...prev,
        title: option.title,
        description: `${option.title}\n\n${option.description}`
    }));
    setGeneratedOptions([]);
    setAiPrompt("");
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.companyName.trim()) {
      setImageError("Please enter a company name");
      return;
    }

    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const response = await fetch('https://c6f4-34-169-40-136.ngrok-free.app/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: imagePrompt.companyName,
          slogan: imagePrompt.slogan,
          services: imagePrompt.services,
          keywords: imagePrompt.keywords.length > 0 ? imagePrompt.keywords : ['professional', 'business', 'modern'],
          style: imagePrompt.style,
          mood: imagePrompt.mood,
          width: 1200,
          height: 624
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImage(data.image);
      setFormData(prev => ({
        ...prev,
        images: data.image
      }));
    } catch (error) {
      console.error('Error generating image:', error);
      setImageError(error.message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle adding services
  const handleAddService = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const service = serviceInput.trim();
      if (service && !imagePrompt.services.includes(service)) {
        setImagePrompt(prev => ({
          ...prev,
          services: [...prev.services, service]
        }));
        setServiceInput('');
      }
    }
  };

  // Remove service handler
  const handleRemoveService = (serviceToRemove) => {
    setImagePrompt(prev => ({
      ...prev,
      services: prev.services.filter(service => service !== serviceToRemove)
    }));
  };

  // Add keyword handler
  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const keyword = keywordInput.trim();
      if (keyword && !imagePrompt.keywords.includes(keyword)) {
        setImagePrompt(prev => ({
          ...prev,
          keywords: [...prev.keywords, keyword]
        }));
        setKeywordInput('');
      }
    }
  };

  // Remove keyword handler
  const handleRemoveKeyword = (keywordToRemove) => {
    setImagePrompt(prev => ({
      ...prev,
      keywords: prev.keywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  // Add navigation functions
  const goToNextSection = () => {
    if (currentSection < 3) {
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToPreviousSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToSection = (section) => {
    setCurrentSection(section);
    window.scrollTo(0, 0);
  };

  return (
    <div className="update-gig-container">
      <NavbarSeller />
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="page-title">Create a New Gig</h1>
          <Button variant="outline-secondary" onClick={handleGoBack}>
            <FaArrowLeft className="me-2" /> Go Back
          </Button>
        </div>
        
        {/* Progress Navigation */}
        <div className="progress-nav">
          <div className="progress-steps">
            <div 
              className={`progress-step ${currentSection === 1 ? 'active' : ''} ${currentSection > 1 ? 'completed' : ''}`}
              onClick={() => goToSection(1)}
              style={{ cursor: 'pointer' }}
            >
              <div className="progress-step-number">1</div>
              Overview
            </div>
            <div 
              className={`progress-step ${currentSection === 2 ? 'active' : ''} ${currentSection > 2 ? 'completed' : ''}`}
              onClick={() => goToSection(2)}
              style={{ cursor: 'pointer' }}
            >
              <div className="progress-step-number">2</div>
              Pricing
            </div>
            <div 
              className={`progress-step ${currentSection === 3 ? 'active' : ''}`}
              onClick={() => goToSection(3)}
              style={{ cursor: 'pointer' }}
            >
              <div className="progress-step-number">3</div>
              Gallery
            </div>
          </div>
        </div>

        <Form onSubmit={handleSubmit} className="gig-form">
          {/* Overview Section */}
          {currentSection === 1 && (
            <div className="gig-section overview-section">
              <h2 className="section-title">Overview</h2>
              <p className="section-subtitle">Tell us about your gig</p>

              <Form.Group className="mb-4">
                <Form.Label>Title <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter a catchy title for your gig"
                  required
                />
              </Form.Group>

              {/* AI Content Generation */}
              <div className="ai-content-section">
          <h3>AI Content Generation</h3>
          <div className="ai-input-group">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Enter a prompt to generate title and description"
              rows={3}
            />
            <Button 
              variant="primary" 
              onClick={handleGenerateContent}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generating...
                </>
              ) : (
                <>
                  <FaMagic className="me-2" />
                  Generate Content
                </>
              )}
            </Button>
          </div>

          {aiError && (
            <Alert variant="danger" className="mt-2">
              {aiError}
            </Alert>
          )}

          {generatedOptions.length > 0 && (
            <div className="generated-options">
              <h4>Generated Options</h4>
              {generatedOptions.map((option, index) => (
                <div key={index} className="generated-option">
                  <h5>{option.title}</h5>
                  <p>{option.description}</p>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => handleSelectGeneratedContent(option)}
                  >
                    <FaSync className="me-1" />
                    Use This Content
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

              <Form.Group className="mb-4">
                <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  modules={quillModules}
                  formats={quillFormats}
                  className="rich-text-editor"
                  placeholder="Describe your service in detail..."
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a category</option>
                      <option value="Graphic Design">Graphic Design</option>
                      <option value="Digital Marketing">Digital Marketing</option>
                      <option value="Writing & Translation">Writing & Translation</option>
                      <option value="Video & Animation">Video & Animation</option>
                      <option value="Programming & Tech">Programming & Tech</option>
                      <option value="Music & Audio">Music & Audio</option>
                      <option value="Business">Business</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Subcategory <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      placeholder="Enter a subcategory"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Add Tags <span className="text-danger">*</span></Form.Label>
                <Form.Text className="d-block mb-2">
                  Press Enter or comma after each tag
                </Form.Text>
                
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add a tag and press Enter"
                  />
                  <Button variant="outline-primary" onClick={() => {
                    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
                      setFormData(prev => ({
                        ...prev,
                        tags: [...prev.tags, tagInput.trim()]
                      }));
                      setTagInput('');
                    }
                  }}>
                    <FaPlus /> Add
                  </Button>
                </InputGroup>
                
                <div className="tag-container mt-3">
                  <AnimatePresence>
                    {formData.tags.map((tag) => (
                      <motion.div
                        key={tag}
                        className="tag-badge"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Badge bg="primary" className="me-2 mb-2 p-2">
                          {tag}
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="tag-remove-btn"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            <FaTimes />
                          </Button>
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Form.Group>

              <div className="form-actions d-flex justify-content-end mt-4">
                <Button variant="primary" onClick={goToNextSection}>
                  Next: Pricing <FaArrowRight className="ms-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Pricing Section */}
          {currentSection === 2 && (
            <div className="gig-section pricing-section">
              <h2 className="section-title">Pricing</h2>
              <p className="section-subtitle">Set your packages and pricing</p>

              <div className="price-packages-container">
                <AnimatePresence>
                  {formData.pricePackages.map((pkg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="package-card mb-4"
                    >
                      <Card>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">Package {index + 1}</h5>
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleRemovePackage(index)}
                            disabled={formData.pricePackages.length <= 1}
                          >
                            <FaTimes /> Remove
                          </Button>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Package Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="text"
                                  name="name"
                                  placeholder="e.g., Basic, Standard, Premium"
                                  value={pkg.name}
                                  onChange={(e) => handlePackageChange(e, index)}
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Price ($) <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="number"
                                  name="price"
                                  placeholder="Enter price"
                                  value={pkg.price}
                                  onChange={(e) => handlePackageChange(e, index)}
                                  min="1"
                                  required
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Delivery Time (days) <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="number"
                                  name="deliveryTime"
                                  placeholder="Delivery days"
                                  value={pkg.deliveryTime}
                                  onChange={(e) => handlePackageChange(e, index)}
                                  min="1"
                                  required
                                />
                              </Form.Group>
                            </Col>
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Revisions <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                  type="number"
                                  name="revisions"
                                  placeholder="Number of revisions"
                                  value={pkg.revisions}
                                  onChange={(e) => handlePackageChange(e, index)}
                                  min="0"
                                  required
                                />
                              </Form.Group>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {formData.pricePackages.length < 3 && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="outline-success" 
                      onClick={handleAddPackage} 
                      className="w-100 py-3 mb-4"
                    >
                      <FaPlus className="me-2" /> Add Another Package
                    </Button>
                  </motion.div>
                )}
              </div>

              <div className="form-actions d-flex justify-content-between mt-4">
                <Button variant="outline-secondary" onClick={goToPreviousSection}>
                  <FaArrowLeft className="me-2" /> Back to Overview
                </Button>
                <Button variant="primary" onClick={goToNextSection}>
                  Next: Gallery <FaArrowRight className="ms-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Gallery Section */}
          {currentSection === 3 && (
            <div className="gig-section gallery-section">
              <h2 className="section-title">Gallery</h2>
              <p className="section-subtitle">Add images to showcase your service</p>

              {/* AI Image Generation */}
              <div className="ai-image-section">
          <h3>AI Image Generation</h3>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={imagePrompt.companyName}
                onChange={(e) => setImagePrompt(prev => ({ ...prev, companyName: e.target.value }))}
                placeholder="Like Php Web Application"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Subtitle</Form.Label>
              <Form.Control
                type="text"
                value={imagePrompt.slogan}
                onChange={(e) => setImagePrompt(prev => ({ ...prev, slogan: e.target.value }))}
                placeholder="Like Clean Code"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Services</Form.Label>
              <Form.Text className="d-block mb-2">
                Add services one by one
              </Form.Text>
              
              <InputGroup>
                <Form.Control
                  type="text"
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  onKeyDown={handleAddService}
                  placeholder="Add a service and press Enter"
                />
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    if (serviceInput.trim() && !imagePrompt.services.includes(serviceInput.trim())) {
                      setImagePrompt(prev => ({
                        ...prev,
                        services: [...prev.services, serviceInput.trim()]
                      }));
                      setServiceInput('');
                    }
                  }}
                >
                  <FaPlus /> Add
                </Button>
              </InputGroup>
              
              <div className="tag-container mt-3">
                <AnimatePresence>
                        {imagePrompt.services.map((service) => (
                    <motion.div
                      key={service}
                      className="tag-badge"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                            <Badge bg="success" className="me-2 mb-2 p-2 tag-badge">
                        {service}
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="tag-remove-btn"
                          onClick={() => handleRemoveService(service)}
                        >
                          <FaTimes />
                        </Button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {imagePrompt.services.length === 0 && 
                  <div className="text-muted mt-2">No services added yet</div>
                }
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Keywords</Form.Label>
              <Form.Text className="d-block mb-2">
                Add keywords one by one
              </Form.Text>
              
              <InputGroup>
                <Form.Control
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleAddKeyword}
                  placeholder="Add a keyword and press Enter"
                />
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    if (keywordInput.trim() && !imagePrompt.keywords.includes(keywordInput.trim())) {
                      setImagePrompt(prev => ({
                        ...prev,
                        keywords: [...prev.keywords, keywordInput.trim()]
                      }));
                      setKeywordInput('');
                    }
                  }}
                >
                  <FaPlus /> Add
                </Button>
              </InputGroup>
              
              <div className="tag-container mt-3">
                <AnimatePresence>
                        {imagePrompt.keywords.map((keyword) => (
                    <motion.div
                      key={keyword}
                      className="tag-badge"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                            <Badge bg="info" className="me-2 mb-2 p-2 tag-badge">
                        {keyword}
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="tag-remove-btn"
                          onClick={() => handleRemoveKeyword(keyword)}
                        >
                          <FaTimes />
                        </Button>
                      </Badge>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {imagePrompt.keywords.length === 0 && 
                  <div className="text-muted mt-2">No keywords added yet</div>
                }
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Style</Form.Label>
              <Form.Select
                value={imagePrompt.style}
                onChange={(e) => setImagePrompt(prev => ({ ...prev, style: e.target.value }))}
              >
                <option value="realistic">Realistic</option>
                <option value="modern">Modern</option>
                <option value="abstract">Abstract</option>
                <option value="vintage">Vintage</option>
                <option value="corporate">Corporate</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mood</Form.Label>
              <Form.Select
                value={imagePrompt.mood}
                onChange={(e) => setImagePrompt(prev => ({ ...prev, mood: e.target.value }))}
              >
                <option value="professional">Professional</option>
                <option value="vibrant">Vibrant</option>
                <option value="calm">Calm</option>
                <option value="dramatic">Dramatic</option>
                <option value="tech">Tech</option>
              </Form.Select>
            </Form.Group>

            <Button 
              variant="primary" 
              onClick={handleGenerateImage}
              disabled={isGeneratingImage}
              className="mb-3"
            >
              {isGeneratingImage ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Generating Image...
                </>
              ) : (
                <>
                  <FaImage className="me-2" />
                  Generate Image
                </>
              )}
            </Button>
          </Form>

          {imageError && (
            <Alert variant="danger" className="mt-2">
              {imageError}
            </Alert>
          )}

          {generatedImage && (
            <div className="generated-image">
              <h4>Generated Image</h4>
              <img src={generatedImage} alt="Generated banner" className="img-fluid" />
              <Button 
                variant="success" 
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    images: generatedImage
                  }));
                  setUploadedImages([generatedImage]);
                }}
                className="mt-2"
              >
                <FaImage className="me-2" />
                Use This Image
              </Button>
            </div>
          )}
        </div>

              <Form.Group className="mb-3">
                <Form.Label>Upload Image <span className="text-danger">*</span></Form.Label>
                <div className="image-upload-container">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="image-upload-input"
                  />
                  
                  {uploadedImages.length > 0 && (
                    <motion.div 
                      className="uploaded-image-preview mt-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img 
                        src={uploadedImages[0]} 
                        alt="Uploaded" 
                        className="img-thumbnail" 
                        style={{ maxHeight: "200px" }}
                      />
                    </motion.div>
                  )}
                </div>
              </Form.Group>

              <div className="form-actions d-flex justify-content-between mt-4 mb-5">
                <Button variant="outline-secondary" onClick={goToPreviousSection}>
                  <FaArrowLeft className="me-2" /> Back to Pricing
            </Button>
            <Button variant="primary" type="submit">
                  Create Gig <FaCheck className="ms-2" />
            </Button>
          </div>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
};

export default CreateGig;
