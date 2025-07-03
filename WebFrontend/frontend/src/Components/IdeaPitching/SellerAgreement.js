import React, { useRef, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaSignature, FaEraser, FaCheck } from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';
import '../../CSS/SellerAgreement.css';

const SellerAgreement = ({ show, onHide, onAccept }) => {
    const sigCanvas = useRef({});
    const [isSigned, setIsSigned] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);

    const clearSignature = () => {
        sigCanvas.current.clear();
        setIsSigned(false);
    };

    const handleAccept = () => {
        if (!isAgreed || !isSigned) {
            alert('Please sign the agreement and check the terms acceptance box');
            return;
        }
        const signatureData = sigCanvas.current.toDataURL();
        onAccept(signatureData);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="seller-agreement-modal">
            <Modal.Header closeButton className="seller-agreement-header">
                <Modal.Title className="seller-agreement-title">
                    <FaSignature className="me-2" />
                    Seller Agreement
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="seller-agreement-body">
                <div className="seller-agreement-content">
                    <h4 className="seller-agreement-heading">Non-Disclosure and Non-Copy Agreement</h4>
                    <p className="seller-agreement-intro">By signing this agreement, you acknowledge and agree to the following terms:</p>
                    
                    <ol className="seller-agreement-terms">
                        <li>You will not copy, replicate, or steal the idea in any form.</li>
                        <li>You will not disclose the idea to any third party without explicit permission.</li>
                        <li>You will not use the idea for your own benefit without proper authorization.</li>
                        <li>Any violation of these terms will result in legal action.</li>
                        <li>You understand that the idea is the intellectual property of the original creator.</li>
                    </ol>

                    <div className="seller-agreement-legal">
                        <h5 className="seller-agreement-legal-title">Legal Notice:</h5>
                        <p className="seller-agreement-legal-text">Any unauthorized use, copying, or distribution of this idea will be subject to legal action under intellectual property laws. The original creator reserves all rights to pursue legal remedies including but not limited to:</p>
                        <ul className="seller-agreement-legal-list">
                            <li>Civil lawsuits for damages</li>
                            <li>Criminal charges for intellectual property theft</li>
                            <li>Injunctions to prevent further use</li>
                            <li>Recovery of legal fees and costs</li>
                        </ul>
                    </div>

                    <div className="seller-agreement-signature-section">
                        <h5 className="seller-agreement-signature-title">Digital Signature</h5>
                        <div className="seller-agreement-signature-pad">
                            <SignatureCanvas
                                ref={sigCanvas}
                                canvasProps={{
                                    className: 'seller-agreement-signature-canvas',
                                    width: 500,
                                    height: 200
                                }}
                                onEnd={() => setIsSigned(true)}
                            />
                            <Button 
                                variant="outline-secondary" 
                                size="sm" 
                                className="seller-agreement-clear-btn"
                                onClick={clearSignature}
                            >
                                <FaEraser className="me-2" />
                                Clear Signature
                            </Button>
                        </div>
                    </div>

                    <Form.Group className="seller-agreement-checkbox">
                        <Form.Check
                            type="checkbox"
                            label="I have read and agree to the terms of this agreement"
                            checked={isAgreed}
                            onChange={(e) => setIsAgreed(e.target.checked)}
                            required
                        />
                    </Form.Group>
                </div>
            </Modal.Body>
            <Modal.Footer className="seller-agreement-footer">
                <Button variant="secondary" onClick={onHide} className="seller-agreement-cancel-btn">
                    Cancel
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleAccept}
                    className="seller-agreement-sign-btn"
                    disabled={!isSigned || !isAgreed}
                >
                    <FaCheck className="me-2" />
                    Sign Agreement
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default SellerAgreement; 