const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateSellerAgreement = async (ideaData) => {
    const doc = new PDFDocument();
    const fileName = `seller_agreement_${ideaData.ideaId}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', 'agreements', fileName);

    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Create write stream
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add content to PDF
    doc.fontSize(20).text('Seller Agreement', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text('This agreement is made between:');
    doc.moveDown();
    
    doc.text('1. The Buyer (hereinafter referred to as "Buyer")');
    doc.text(`   Name: ${ideaData.buyerName}`);
    doc.moveDown();
    
    doc.text('2. The Seller (hereinafter referred to as "Seller")');
    doc.text('   Name: ________________________');
    doc.moveDown();
    
    doc.text('Regarding the following business idea:');
    doc.moveDown();
    
    doc.text(`Title: ${ideaData.title}`);
    doc.text(`Category: ${ideaData.category}`);
    doc.moveDown();
    
    doc.text('Description:');
    doc.text(ideaData.description, { width: 500 });
    doc.moveDown();
    
    doc.text('Terms and Conditions:');
    doc.moveDown();
    
    doc.text('1. The Seller agrees to provide their expertise and services as outlined in their reply to this idea.');
    doc.text('2. The Seller acknowledges that this agreement is binding upon signing.');
    doc.text('3. The Seller agrees to maintain confidentiality regarding the business idea.');
    doc.text('4. The Seller agrees to work in good faith to help realize the business idea.');
    doc.moveDown();
    
    doc.text('Signatures:');
    doc.moveDown();
    
    doc.text('Seller: ________________________');
    doc.text('Date: ________________________');
    doc.moveDown();
    
    doc.text('Generated on: ' + new Date().toLocaleDateString());
    
    // Finalize PDF
    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            resolve({
                fileName,
                filePath,
                url: `/agreements/${fileName}`
            });
        });
        stream.on('error', reject);
    });
};

module.exports = { generateSellerAgreement }; 