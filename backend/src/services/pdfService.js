const PDFDocument = require('pdfkit');

/**
 * Generates a PDF receipt buffer for a completed transaction.
 * @param {Object} transaction - Sequelize Transaction instance with user and items loaded.
 * @returns {Promise<Buffer>}
 */
function generateReceipt(transaction) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryRed = '#DE0A26';
    const darkBg = '#1a1a1a';
    const silver = '#8a8a8a';

    // Header background bar
    doc.rect(0, 0, doc.page.width, 120).fill(darkBg);

    // Branding
    doc.fill(primaryRed)
      .font('Helvetica-Bold')
      .fontSize(28)
      .text('🎸 METALLICA', 50, 35, { continued: false });

    doc.fill(silver)
      .font('Helvetica')
      .fontSize(12)
      .text('MERCH STORE — ORDER RECEIPT', 50, 68);

    doc.moveDown(4);

    // Order info box
    doc.fill('#333333')
      .roundedRect(50, 135, doc.page.width - 100, 80, 8)
      .fill();

    doc.fill('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(`Order #${transaction.id}`, 70, 150);

    doc.fill(silver)
      .font('Helvetica')
      .fontSize(11)
      .text(`Date: ${new Date(transaction.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 70, 170)
      .text(`Status: ${transaction.status.toUpperCase()}`, 70, 186);

    // Customer info
    doc.fill(primaryRed)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('CUSTOMER', 50, 240);

    doc.moveTo(50, 258).lineTo(doc.page.width - 50, 258).stroke(silver);

    doc.fill('#222222')
      .font('Helvetica')
      .fontSize(11)
      .text(`Name:  ${transaction.user ? transaction.user.name : 'N/A'}`, 50, 268)
      .text(`Email: ${transaction.user ? transaction.user.email : 'N/A'}`, 50, 284);

    // Items table header
    doc.fill(primaryRed)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('ORDER ITEMS', 50, 320);

    doc.moveTo(50, 338).lineTo(doc.page.width - 50, 338).stroke(silver);

    // Table headers
    doc.fill(darkBg)
      .rect(50, 342, doc.page.width - 100, 24)
      .fill();

    doc.fill('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('ITEM', 60, 349)
      .text('QTY', 360, 349, { width: 60, align: 'center' })
      .text('UNIT PRICE', 430, 349, { width: 80, align: 'right' })
      .text('SUBTOTAL', 520, 349, { width: 80, align: 'right' });

    // Table rows
    let y = 374;
    for (const item of transaction.items || []) {
      const productName = item.product ? item.product.name : `Product #${item.product_id}`;
      const unitPrice = parseFloat(item.price);
      const subtotal = unitPrice * item.quantity;

      if (y % 2 === 0) {
        doc.fill('#f9f9f9').rect(50, y - 4, doc.page.width - 100, 22).fill();
      }

      doc.fill('#222222')
        .font('Helvetica')
        .fontSize(10)
        .text(productName, 60, y, { width: 290 })
        .text(String(item.quantity), 360, y, { width: 60, align: 'center' })
        .text(`$${unitPrice.toFixed(2)}`, 430, y, { width: 80, align: 'right' })
        .text(`$${subtotal.toFixed(2)}`, 520, y, { width: 80, align: 'right' });

      y += 26;
    }

    // Total line
    doc.moveTo(50, y + 6).lineTo(doc.page.width - 50, y + 6).stroke(silver);

    doc.fill(primaryRed)
      .font('Helvetica-Bold')
      .fontSize(14)
      .text('TOTAL:', 380, y + 16)
      .text(`$${parseFloat(transaction.total_price).toFixed(2)}`, 460, y + 16, { width: 140, align: 'right' });

    // Footer
    const footerY = doc.page.height - 80;
    doc.moveTo(50, footerY - 10).lineTo(doc.page.width - 50, footerY - 10).stroke(silver);

    doc.fill(silver)
      .font('Helvetica')
      .fontSize(9)
      .text('Thank you for your order! If you have any questions, contact us at support@metallica.store', 50, footerY, {
        align: 'center',
        width: doc.page.width - 100,
      });

    doc.fill(darkBg)
      .rect(0, footerY + 20, doc.page.width, 60)
      .fill();

    doc.fill('#555555')
      .fontSize(8)
      .text('© 2024 Metallica Merch Store — All rights reserved. For The Love of Metal.', 50, footerY + 32, {
        align: 'center',
        width: doc.page.width - 100,
      });

    doc.end();
  });
}

module.exports = { generateReceipt };
