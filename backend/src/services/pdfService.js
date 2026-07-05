const PDFDocument = require('pdfkit');

/**
 * Generates a PDF receipt buffer for a completed transaction.
 * @param {Object} transaction - Sequelize Transaction instance with user and items loaded.
 * @returns {Promise<Buffer>}
 */
function generateReceipt(transaction) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const width = doc.page.width;
    const height = doc.page.height;
    
    // Outer border
    doc.lineWidth(1).strokeColor('black').rect(30, 30, width - 60, height - 60).stroke();
    // Top blue thick border
    doc.lineWidth(8).strokeColor('#002b7f').moveTo(30, 34).lineTo(width - 30, 34).stroke();

    // Metallica Logo
    const path = require('path');
    const logoPath = path.join(__dirname, '../../uploads/metallica_pdf.png');
    try {
      doc.image(logoPath, 40, 50, { width: 140 });
    } catch (e) {
      doc.fillColor('black').font('Helvetica-Bold').fontSize(20).text('METALLICA', 40, 55);
    }

    // Company Details
    doc.fillColor('black').fontSize(8).text('Operated by', 190, 72);
    doc.font('Helvetica-Bold').fontSize(10).text('METALLICA MERCH STORE', 190, 82);
    doc.font('Helvetica').fontSize(9).text('NON-VAT REG TIN 123-456-789-00000', 190, 94);
    doc.fontSize(7).text('4TH FLOOR, BIR BLDG. QUEZON AVENUE,', 190, 108);
    doc.text('PINYAHAN, QUEZON CITY 1000', 190, 118);

    // INVOICE Text
    doc.fillColor('#002b7f').font('Helvetica-Bold').fontSize(24).text('INVOICE', 0, 60, { align: 'right', width: width - 40 });

    // Invoice No
    const invoiceNo = String(transaction.id).padStart(7, '0');
    doc.fillColor('red').font('Helvetica-Bold').fontSize(12).text(`Invoice No. ${invoiceNo}`, 0, 130, { align: 'right', width: width - 40 });

    // Checkboxes and Date Box
    doc.lineWidth(0.5).strokeColor('black').rect(50, 140, 8, 8).stroke();
    doc.fillColor('black').font('Helvetica').fontSize(9).text('CASH SALES', 65, 140);
    
    doc.lineWidth(0.5).strokeColor('black').rect(50, 152, 8, 8).stroke();
    doc.text('CHARGE SALES', 65, 152);

    // Date box
    const dateBoxX = width - 200;
    doc.lineWidth(1).strokeColor('black').rect(dateBoxX, 140, 160, 20).stroke();
    doc.text('Date:', dateBoxX + 5, 146);
    doc.text(new Date(transaction.createdAt).toLocaleDateString(), dateBoxX + 40, 146);

    // SOLD TO Box
    const soldToY = 170;
    doc.rect(30, soldToY, width - 60, 80).stroke();
    doc.font('Helvetica-Bold').fontSize(9).text('SOLD TO:', 35, soldToY + 5);
    doc.font('Helvetica').fontSize(9);
    doc.text('Registered Name  :', 45, soldToY + 20);
    doc.text('TIN                          :', 45, soldToY + 35);
    doc.text('Business Address :', 45, soldToY + 50);

    const buyerName = transaction.full_name || (transaction.user ? transaction.user.name : '');
    const buyerAddress = `${transaction.address || ''}, ${transaction.city || ''} ${transaction.zip || ''}`;
    
    doc.text(buyerName, 150, soldToY + 20);
    doc.text('', 150, soldToY + 35); // TIN empty for regular customers
    doc.text(buyerAddress, 150, soldToY + 50);

    // Table Header
    const tableY = 260;
    doc.rect(30, tableY, width - 60, 30).fillAndStroke('#e0e0e0', 'black');
    doc.fillColor('black').font('Helvetica').fontSize(9);
    
    // Column x-coords
    const col1 = 30; // Item desc
    const col2 = 330; // Qty
    const col3 = 400; // Unit Price
    const col4 = 480; // Amount

    doc.text('Item Description/', col1 + 5, tableY + 5, { width: col2 - col1 - 10, align: 'center' });
    doc.text('Nature of Service', col1 + 5, tableY + 15, { width: col2 - col1 - 10, align: 'center' });
    doc.text('Quantity', col2, tableY + 10, { width: col3 - col2, align: 'center' });
    doc.text('Unit Price', col3, tableY + 10, { width: col4 - col3, align: 'center' });
    doc.text('Amount', col4, tableY + 10, { width: width - 30 - col4, align: 'center' });

    // Table Grid Lines
    doc.lineWidth(1).strokeColor('black');
    const bottomTableY = 600;
    doc.rect(30, tableY + 30, width - 60, bottomTableY - (tableY + 30)).stroke();
    doc.moveTo(col2, tableY).lineTo(col2, bottomTableY).stroke();
    doc.moveTo(col3, tableY).lineTo(col3, bottomTableY).stroke();
    doc.moveTo(col4, tableY).lineTo(col4, bottomTableY).stroke();

    // Table Rows
    let rowY = tableY + 40;
    for (const item of transaction.items || []) {
      const productName = item.product ? item.product.name : `Product #${item.product_id}`;
      const unitPrice = parseFloat(item.price);
      const subtotal = unitPrice * item.quantity;

      doc.text(productName, col1 + 10, rowY, { width: col2 - col1 - 20 });
      doc.text(String(item.quantity), col2, rowY, { width: col3 - col2, align: 'center' });
      doc.text(unitPrice.toFixed(2), col3, rowY, { width: col4 - col3, align: 'center' });
      doc.text(subtotal.toFixed(2), col4, rowY, { width: width - 30 - col4, align: 'center' });
      
      // Horizontal line per row
      doc.moveTo(30, rowY + 20).lineTo(width - 30, rowY + 20).stroke();
      rowY += 25;
    }

    // Totals Box
    const totalBoxY = bottomTableY + 10;
    const totalBoxX = width - 250;
    doc.rect(totalBoxX, totalBoxY, 220, 80).stroke();
    // Inner lines
    doc.moveTo(totalBoxX, totalBoxY + 20).lineTo(width - 30, totalBoxY + 20).stroke();
    doc.moveTo(totalBoxX, totalBoxY + 40).lineTo(width - 30, totalBoxY + 40).stroke();
    doc.moveTo(totalBoxX, totalBoxY + 60).lineTo(width - 30, totalBoxY + 60).stroke();
    doc.moveTo(totalBoxX + 120, totalBoxY).lineTo(totalBoxX + 120, totalBoxY + 80).stroke(); // vertical

    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Total Sales', totalBoxX + 5, totalBoxY + 6);
    doc.font('Helvetica').fontSize(8);
    doc.text('Less: Discount', totalBoxX + 5, totalBoxY + 22);
    doc.text('[SC/PWD/NAAC/MOV/SP]', totalBoxX + 5, totalBoxY + 30);
    doc.text('Less: Withholding Tax', totalBoxX + 5, totalBoxY + 46);
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('TOTAL AMOUNT DUE', totalBoxX + 5, totalBoxY + 66);

    const totalStr = parseFloat(transaction.total_price).toFixed(2);
    doc.font('Helvetica').fontSize(9);
    doc.text(totalStr, totalBoxX + 125, totalBoxY + 6);
    doc.text('0.00', totalBoxX + 125, totalBoxY + 26);
    doc.text('0.00', totalBoxX + 125, totalBoxY + 46);
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(totalStr, totalBoxX + 125, totalBoxY + 66);

    // Warning Text
    doc.fillColor('red').font('Helvetica-Bold').fontSize(10);
    doc.text('"THIS DOCUMENT IS NOT VALID\nFOR CLAIM OF INPUT TAX."', 40, bottomTableY + 40, { align: 'center', width: 200 });

    // Signature box
    const sigBoxY = bottomTableY + 100;
    const sigBoxX = width - 250;
    doc.fillColor('black').font('Helvetica').fontSize(8);
    doc.text('SC/PWD/NAAC/MOV/', sigBoxX - 90, sigBoxY);
    doc.text('Solo Parent ID No.:', sigBoxX - 90, sigBoxY + 10);
    doc.rect(sigBoxX, sigBoxY - 5, 220, 20).stroke();
    
    doc.text('SC/PWD/NAAC/MOV/', sigBoxX - 90, sigBoxY + 25);
    doc.text('Signature:', sigBoxX - 90, sigBoxY + 35);
    doc.rect(sigBoxX, sigBoxY + 20, 220, 20).stroke();

    // Footer
    const footY = height - 65;
    doc.fontSize(6);
    doc.text('PERMIT TO USE LOOSE LEAF NO.: LLSI0440224-00059', 35, footY);
    doc.text('DATE ISSUED: 06-FEB-2024', 35, footY + 10);

    doc.text('BIR AUTHORITY TO PRINT NO.: 3AU000000005762', 250, footY);
    doc.text('DATE ISSUED: 23-FEB-2024', 250, footY + 10);
    doc.text('APPROVED SERIES: 5000001 - 5000500 10BKLTS (3X)', 250, footY + 20);

    doc.end();
  });
}

module.exports = { generateReceipt };
