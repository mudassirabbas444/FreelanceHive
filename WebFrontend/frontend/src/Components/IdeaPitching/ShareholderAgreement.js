import React, { useRef, useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaSignature, FaEraser, FaCheck, FaDownload } from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import '../../CSS/ShareholderAgreement.css';

const ShareholderAgreement = ({ 
    show, 
    onHide, 
    onAccept, 
    requestData,
    isBuyer = false,
    existingAgreement = null 
}) => {
    const buyerSigCanvas = useRef({});
    const sellerSigCanvas = useRef({});
    const [isBuyerSigned, setIsBuyerSigned] = useState(false);
    const [isSellerSigned, setIsSellerSigned] = useState(false);
    const [isAgreed, setIsAgreed] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);

    useEffect(() => {
        if (existingAgreement) {
            setPdfUrl(existingAgreement);
        }
    }, [existingAgreement]);

    const clearSignature = (canvasRef, setSigned) => {
        canvasRef.current.clear();
        setSigned(false);
    };

    const generatePDF = async () => {
        const pdf = new jsPDF();
        
        // Add title
        pdf.setFontSize(20);
        pdf.text('Shareholder Agreement', 105, 20, { align: 'center' });
        
        // Add agreement content
        pdf.setFontSize(12);
        const text = `
        This Shareholder Agreement ("Agreement") is made and entered into as of ${new Date().toLocaleDateString()} 
        by and between the following parties:

        Buyer: ${requestData.buyerName}
        Seller: ${requestData.sellerName}
        Idea: ${requestData.ideaTitle}

        Terms of Agreement:
        1. Contribution Type: ${requestData.contributionType}
        2. Contribution Details: ${requestData.contributionDetails}
        3. Equity Share: ${requestData.equityRequested}%

        The Buyer agrees to provide the specified contribution in exchange for the agreed equity share.
        The Seller agrees to accept the contribution and grant the specified equity share.

        Both parties agree to the terms and conditions set forth in this Agreement.
        `;

        pdf.text(text, 20, 40, { maxWidth: 170 });

        // Add signatures
        if (isBuyerSigned) {
            const buyerSig = buyerSigCanvas.current.toDataURL();
            pdf.addImage(buyerSig, 'PNG', 20, 150, 60, 30);
            pdf.text('Buyer Signature', 50, 185);
        }

        if (isSellerSigned) {
            const sellerSig = sellerSigCanvas.current.toDataURL();
            pdf.addImage(sellerSig, 'PNG', 130, 150, 60, 30);
            pdf.text('Seller Signature', 160, 185);
        }

        // Convert PDF to blob
        const pdfBlob = pdf.output('blob');

        // Create FormData and append the PDF
        const formData = new FormData();
        formData.append('pdf', pdfBlob, `Shareholder_Agreement_${Date.now()}.pdf`);
        formData.append('isInitialUpload', isBuyer ? 'true' : 'false');
        formData.append('isSellerSignature', !isBuyer ? 'true' : 'false');

        if (!isBuyer && requestData._id) {
            formData.append('requestId', requestData._id);
        }

        // Send PDF to backend for storage
        try {
            const response = await fetch('http://localhost:4000/api/shareholder-request/upload-pdf', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload PDF');
            }

            const { pdfUrl } = await response.json();
            setPdfUrl(pdfUrl);
            return pdfUrl;
        } catch (error) {
            console.error('Error uploading PDF:', error);
            throw error;
        }
    };

    const handleAccept = async () => {
        if (!isAgreed || (isBuyer && !isBuyerSigned) || (!isBuyer && !isSellerSigned)) {
            alert('Please complete all required fields');
            return;
        }

        const pdfUrl = await generatePDF();
        onAccept(pdfUrl);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="shareholder-agreement-modal">
            <Modal.Header closeButton className="shareholder-agreement-header">
                <Modal.Title className="shareholder-agreement-title">
                    <FaSignature className="me-2" />
                    Shareholder Agreement
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="shareholder-agreement-body">
                <div className="shareholder-agreement-content">
                    <h4 className="shareholder-agreement-heading">Shareholder Agreement Terms</h4>
                    
                    <div className="shareholder-agreement-details">
                        <p><strong>Buyer:</strong> {requestData.buyerName}</p>
                        <p><strong>Seller:</strong> {requestData.sellerName}</p>
                        <p><strong>Idea:</strong> {requestData.ideaTitle}</p>
                        <p><strong>Contribution Type:</strong> {requestData.contributionType}</p>
                        <p><strong>Contribution Details:</strong> {requestData.contributionDetails}</p>
                        <p><strong>Equity Share:</strong> {requestData.equityRequested}%</p>
                    </div>

                    <div className="shareholder-agreement-terms">
                        <h5>Terms and Conditions:</h5>
                        <ol>
                            <li>The Buyer agrees to provide the specified contribution as detailed above.</li>
                            <li>The Seller agrees to accept the contribution and grant the specified equity share.</li>
                            <li>Both parties agree to maintain confidentiality regarding the business idea.</li>
                            <li>Any disputes shall be resolved through mutual agreement or legal means.</li>
                            <li>This agreement is legally binding and enforceable.</li>
                        </ol>
                    </div>

                    {isBuyer && (
                        <div className="shareholder-agreement-signature-section">
                            <h5 className="shareholder-agreement-signature-title">Buyer's Signature</h5>
                            <div className="shareholder-agreement-signature-pad">
                                <SignatureCanvas
                                    ref={buyerSigCanvas}
                                    canvasProps={{
                                        className: 'shareholder-agreement-signature-canvas',
                                        width: 500,
                                        height: 200
                                    }}
                                    onEnd={() => setIsBuyerSigned(true)}
                                />
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm" 
                                    className="shareholder-agreement-clear-btn"
                                    onClick={() => clearSignature(buyerSigCanvas, setIsBuyerSigned)}
                                >
                                    <FaEraser className="me-2" />
                                    Clear Signature
                                </Button>
                            </div>
                        </div>
                    )}

                    {!isBuyer && (
                        <div className="shareholder-agreement-signature-section">
                            <h5 className="shareholder-agreement-signature-title">Seller's Signature</h5>
                            <div className="shareholder-agreement-signature-pad">
                                <SignatureCanvas
                                    ref={sellerSigCanvas}
                                    canvasProps={{
                                        className: 'shareholder-agreement-signature-canvas',
                                        width: 500,
                                        height: 200
                                    }}
                                    onEnd={() => setIsSellerSigned(true)}
                                />
                                <Button 
                                    variant="outline-secondary" 
                                    size="sm" 
                                    className="shareholder-agreement-clear-btn"
                                    onClick={() => clearSignature(sellerSigCanvas, setIsSellerSigned)}
                                >
                                    <FaEraser className="me-2" />
                                    Clear Signature
                                </Button>
                            </div>
                        </div>
                    )}

                    <Form.Group className="shareholder-agreement-checkbox">
                        <Form.Check
                            type="checkbox"
                            label="I have read and agree to the terms of this agreement"
                            checked={isAgreed}
                            onChange={(e) => setIsAgreed(e.target.checked)}
                            required
                        />
                    </Form.Group>

                    {pdfUrl && (
                        <div className="shareholder-agreement-download">
                            <Button 
                                variant="outline-primary" 
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = pdfUrl;
                                    link.download = 'Shareholder_Agreement.pdf';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            >
                                <FaDownload className="me-2" />
                                Download Agreement
                            </Button>
                        </div>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer className="shareholder-agreement-footer">
                <Button variant="secondary" onClick={onHide} className="shareholder-agreement-cancel-btn">
                    Cancel
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleAccept}
                    className="shareholder-agreement-sign-btn"
                    disabled={!isAgreed || (isBuyer && !isBuyerSigned) || (!isBuyer && !isSellerSigned)}
                >
                    <FaCheck className="me-2" />
                    Sign Agreement
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ShareholderAgreement; 