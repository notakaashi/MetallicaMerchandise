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
    subject: `🎸 Order #${transaction.id} Delivered — Metallica Merch Store`,
    html: `
      <div style="background-color:#050505; color:#ffffff; font-family:'Inter', Arial, sans-serif; padding:0; max-width:700px; margin:0 auto;">
        
        <!-- Massive Hero Section (Mirroring Website) -->
        <div style="background-color: #050505; padding: 80px 20px 40px; text-align: center;">
          <img src="http://localhost:3001/uploads/Metallica_logo.png" alt="Metallica" style="width: 100%; max-width: 450px; height: auto; display: block; margin: 0 auto;">
          <p style="color:#ffffff; margin: 40px 0 0; font-size: 13px; letter-spacing: 0.6em; text-transform: uppercase; font-family: 'Outfit', 'Inter', sans-serif; font-weight: 500;">The Heaviest Merch In Metal</p>
        </div>

        <div style="padding: 20px 50px 60px; background-color: #050505;">
          
          <div style="text-align: center; margin-bottom: 50px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 40px;">
            <h1 style="color:#ffffff; font-size: 24px; margin: 0 0 10px 0; font-weight: 300; text-transform: uppercase; letter-spacing: 0.2em; font-family: 'Outfit', sans-serif;">Order Delivered</h1>
            <p style="color:#888888; font-size: 14px; margin: 0; line-height: 1.6;">Thank you for your purchase, <strong>${user.name}</strong>.<br>Order <strong style="color: #ffffff;">#${transaction.id}</strong> has been delivered.</p>
          </div>

          <!-- Receipt Details -->
          <div style="background-color: #0a0a0a; border: 1px solid rgba(255, 255, 255, 0.08); padding: 40px;">
            
            <table style="width:100%; border-collapse:collapse; margin-bottom: 40px;">
              <thead>
                <tr>
                  <th style="padding: 0 0 15px 0; text-align: left; color:#666666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 600;">Item</th>
                  <th style="padding: 0 0 15px 0; text-align: center; color:#666666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 600;">Qty</th>
                  <th style="padding: 0 0 15px 0; text-align: right; color:#666666; font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 1px solid rgba(255,255,255,0.05); font-weight: 600;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${(transaction.items || []).map(item => `
                  <tr>
                    <td style="padding: 20px 0; color:#dddddd; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; font-weight: 300;">${item.product ? item.product.name : 'Product'}</td>
                    <td style="padding: 20px 0; text-align: center; color:#888888; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px;">${item.quantity}</td>
                    <td style="padding: 20px 0; text-align: right; color:#ffffff; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; font-weight: 500;">$${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div style="text-align: right;">
              <p style="margin: 0 0 5px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Order Date</p>
              <p style="margin: 0 0 25px 0; color: #ffffff; font-size: 13px;">${new Date(transaction.createdAt).toLocaleDateString()}</p>
              
              <p style="margin: 0 0 5px 0; color: #888888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Total</p>
              <p style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 300; font-family: 'Outfit', sans-serif; letter-spacing: 0.05em;">$${parseFloat(transaction.total_price).toFixed(2)}</p>
            </div>

          </div>

          <div style="text-align: center; margin-top: 50px;">
            ${(() => {
              const crypto = require('crypto');
              const secret = process.env.SESSION_SECRET || 'metallica_secret_key_change_in_production';
              const hash = crypto.createHmac('sha256', secret).update(transaction.id.toString()).digest('hex');
              return `<a href="http://localhost:3001/api/transactions/${transaction.id}/receipt?token=${hash}" style="display:inline-block; background-color:#ffffff; color:#000000; text-decoration:none; padding: 18px 45px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; font-family: 'Outfit', 'Inter', sans-serif; transition: all 0.3s ease;">Download PDF Receipt</a>`;
            })()}
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color:#020202; text-align: center; border-top: 1px solid rgba(255,255,255,0.03); padding: 50px 20px;">
          <p style="color:#7a7a7a; font-size: 11px; margin: 0 0 15px 0; font-family: 'Inter', sans-serif;">
            Your official PDF receipt is attached.
          </p>
          <div style="margin-bottom: 25px;">
            <p style="color:#999999; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Contact Us</p>
            <p style="color:#7a7a7a; font-size: 11px; margin: 0 0 4px 0;">support@metallicamerchstore.com</p>
            <p style="color:#7a7a7a; font-size: 11px; margin: 0;">1-800-METALLICA</p>
          </div>
          <p style="color:#555555; font-size: 10px; margin: 0; text-transform: uppercase; letter-spacing: 0.2em; font-family: 'Outfit', sans-serif;">© 2024 Metallica Merch Store</p>
        </div>
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
