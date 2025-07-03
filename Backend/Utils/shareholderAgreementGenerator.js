const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateShareholderAgreement = async (requestData) => {
    const doc = new PDFDocument();
    const timestamp = Date.now();
    const filename = `shareholder_agreement_${timestamp}.pdf`;
    const filepath = path.join('uploads', 'agreements', filename);

    // Ensure the directory exists
    if (!fs.existsSync(path.join('uploads', 'agreements'))) {
        fs.mkdirSync(path.join('uploads', 'agreements'), { recursive: true });
    }

    // Create write stream
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Add content to PDF
    doc.fontSize(20).text('Shareholder Agreement', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('This agreement is made on ' + new Date().toLocaleDateString());
    doc.moveDown();

    doc.fontSize(14).text('Parties:');
    doc.fontSize(12).text(`Buyer: ${requestData.buyerName}`);
    doc.text(`Seller: ${requestData.sellerName}`);
    doc.moveDown();

    doc.fontSize(14).text('Idea Details:');
    doc.fontSize(12).text(`Title: ${requestData.ideaTitle}`);
    doc.moveDown();

    doc.fontSize(14).text('Contribution Details:');
    doc.fontSize(12).text(`Type: ${requestData.contributionType}`);
    doc.text(`Details: ${requestData.contributionDetails}`);
    doc.text(`Equity Requested: ${requestData.equityRequested}%`);
    doc.moveDown();

    doc.fontSize(14).text('Terms and Conditions:');
    doc.fontSize(12).text('1. The seller agrees to contribute as specified above.');
    doc.text('2. The equity share will be granted upon successful completion of the contribution.');
    doc.text('3. This agreement is valid for 24 hours from the time of creation.');
    doc.text('4. The signed agreement must be uploaded within the specified deadline.');
    doc.moveDown();

    doc.fontSize(12).text('Signature: _______________________');
    doc.text('Date: _______________________');

    // Finalize PDF
    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            resolve({
                url: `/agreements/${filename}`,
                path: filepath
            });
        });
        stream.on('error', reject);
    });
};

module.exports = { generateShareholderAgreement }; 