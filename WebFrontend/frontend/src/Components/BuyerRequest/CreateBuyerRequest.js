import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarBuyer from "../Includes/NavbarBuyer";
import "../../CSS/createBuyerRequest.css";

const CreateBuyerRequest = () => {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user"));

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "",
        price: "",
        deliveryTime: ""
    });
    
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            alert("Access denied. Please log in.");
            navigate("/");
        }
    }, [user, navigate]);

    const validateInput = () => {
        if (!formData.title.trim() || !formData.description.trim() || !formData.category.trim() || !formData.price || !formData.deliveryTime) {
            return "All fields are required.";
        }
        if (/\d/.test(formData.title)) {
            return "Title cannot contain numbers.";
        }
        if (formData.title.length > 100) {
            return "Title cannot exceed 100 characters.";
        }
        if (formData.description.length > 500) {
            return "Description cannot exceed 500 characters.";
        }
        if (parseFloat(formData.price) <= 0) {
            return "Budget must be a positive number.";
        }
        if (parseInt(formData.deliveryTime) <= 0) {
            return "Delivery time must be at least 1 day.";
        }
        return null;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateInput();
        if (validationError) {
            setError(validationError);
            return;
        }

        if (!user?.id) {
            alert("User not found. Please log in.");
            return;
        }

        try {
            const response = await fetch("http://localhost:4000/api/create-buyer-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ buyerId: user.id, ...formData })
            });

            if (!response.ok) {
                throw new Error("Failed to create request");
            }

            alert("Buyer request created successfully!");
            navigate("/buyerRequests");
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to create request. Please try again.");
        }
    };

    const categories = [
        "Web Development",
        "Mobile Development",
        "UI/UX Design",
        "Graphic Design",
        "Content Writing",
        "Digital Marketing",
        "Video Editing",
        "Other"
    ];

    return (
        <div>
            <NavbarBuyer />
            <div className="buyer-request-wrapper animate-fade-in">
                <h1 className="buyer-request-title">Create New Request</h1>
                
                {error && <p className="error-message">{error}</p>}

                <form className="buyer-request-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Title</label>
                        <input
                            type="text"
                            name="title"
                            className="input-field"
                            placeholder="Enter request title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Description</label>
                        <textarea
                            name="description"
                            className="input-field"
                            placeholder="Describe your request in detail"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Category</label>
                        <select
                            name="category"
                            className="input-field"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Budget ($)</label>
                        <input
                            type="number"
                            name="price"
                            className="input-field"
                            placeholder="Enter your budget"
                            value={formData.price}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Delivery Time (days)</label>
                        <input
                            type="number"
                            name="deliveryTime"
                            className="input-field"
                            placeholder="Enter delivery time in days"
                            value={formData.deliveryTime}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="cancel-btn" style={{backgroundColor:"red"}}
                            onClick={() => navigate("/buyerRequests")}
                        >
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn">
                            Create Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateBuyerRequest;
