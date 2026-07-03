require('dotenv').config();
const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.MAIL_USERNAME || process.env.SMTP_USER;
  const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
  const host = process.env.MAIL_HOST || process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io';
  const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT) || 2525;

  if (user && pass) {
    // Use configured SMTP
    transporter = nodemailer.createTransport({
      host: host,
      port: port,
      secure: false,
      auth: {
        user: user,
        pass: pass,
      },
    });
  } else {
    // Fall back to Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Using Ethereal test account:', testAccount.user);
  }

  return transporter;
}

/**
 * Sends a receipt email with a PDF attachment to the customer.
 * @param {Object} user - User object with name and email
 * @param {Object} transaction - Transaction object
 * @param {Buffer} pdfBuffer - Generated PDF buffer
 */
async function sendReceiptEmail(user, transaction, pdfBuffer) {
  const t = await getTransporter();

  const info = await t.sendMail({
    from: `"Metallica Merch Store" <${process.env.SMTP_USER || 'noreply@metallica.store'}>`,
    to: user.email,
    subject: `🎸 Order #${transaction.id} Confirmed — Metallica Merch Store`,
    html: `
      <div style="background:#121212;color:#ffffff;font-family:Arial,sans-serif;padding:30px;max-width:600px;margin:0 auto;border-radius:8px;">
        <div style="background:#1a1a1a;padding:20px;border-radius:8px;margin-bottom:20px;">
          <h1 style="color:#DE0A26;margin:0;font-size:28px;">🎸 METALLICA</h1>
          <p style="color:#8a8a8a;margin:4px 0 0;">MERCH STORE</p>
        </div>

        <h2 style="color:#ffffff;">Order Confirmed! 🤘</h2>
        <p style="color:#cccccc;">Hey ${user.name},</p>
        <p style="color:#cccccc;">Your order <strong style="color:#DE0A26;">#${transaction.id}</strong> has been completed and is on its way!</p>

        <div style="background:#1a1a1a;border-left:4px solid #DE0A26;padding:16px;border-radius:4px;margin:20px 0;">
          <p style="margin:0;color:#ffffff;font-size:20px;">Total: <strong style="color:#DE0A26;">$${parseFloat(transaction.total_price).toFixed(2)}</strong></p>
          <p style="margin:8px 0 0;color:#8a8a8a;font-size:13px;">Order Date: ${new Date(transaction.createdAt).toLocaleDateString()}</p>
        </div>

        <h3 style="color:#DE0A26;border-bottom:1px solid #333;padding-bottom:10px;">Items Ordered</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#2a2a2a;">
              <th style="padding:10px;text-align:left;color:#8a8a8a;font-size:12px;">ITEM</th>
              <th style="padding:10px;text-align:center;color:#8a8a8a;font-size:12px;">QTY</th>
              <th style="padding:10px;text-align:right;color:#8a8a8a;font-size:12px;">PRICE</th>
            </tr>
          </thead>
          <tbody>
            ${(transaction.items || []).map(item => `
              <tr style="border-bottom:1px solid #2a2a2a;">
                <td style="padding:10px;color:#cccccc;">${item.product ? item.product.name : 'Product'}</td>
                <td style="padding:10px;text-align:center;color:#cccccc;">${item.quantity}</td>
                <td style="padding:10px;text-align:right;color:#cccccc;">$${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align:center;margin-top:30px;">
          ${(() => {
            const crypto = require('crypto');
            const secret = process.env.SESSION_SECRET || 'metallica_secret_key_change_in_production';
            const hash = crypto.createHmac('sha256', secret).update(transaction.id.toString()).digest('hex');
            return `<a href="http://localhost:3001/api/transactions/${transaction.id}/receipt?token=${hash}" style="display:inline-block;background:#DE0A26;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:bold;font-size:14px;">Download PDF Receipt</a>`;
          })()}
        </div>

        <p style="color:#8a8a8a;font-size:12px;margin-top:30px;text-align:center;">
          Your receipt PDF is also attached to this email.<br>
          Thank you for shopping with Metallica Merch Store! 🤘
        </p>
        <p style="color:#444;font-size:11px;text-align:center;">© 2024 Metallica Merch Store</p>
      </div>
    `,
    attachments: [
      {
        filename: `metallica-receipt-${transaction.id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });

  console.log(`📧 Receipt email sent to ${user.email} — Message ID: ${info.messageId}`);
  if (info.messageId && !process.env.SMTP_USER) {
    console.log('📬 Preview URL:', nodemailer.getTestMessageUrl(info));
  }

  return info;
}

module.exports = { sendReceiptEmail };
