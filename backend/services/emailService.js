// backend/services/emailService.js

const sendEmail = async (to, subject, html) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: 'Hashira', email: process.env.BREVO_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send email');
  }

  return response.json();
};

// Resolves name whether caller passes a built emailData object or a raw order doc
const resolveName = (orderDetails) => {
  if (orderDetails.customerName) return orderDetails.customerName;
  if (orderDetails.address?.firstName) {
    return `${orderDetails.address.firstName} ${orderDetails.address.lastName || ''}`.trim();
  }
  return 'there';
};

const baseStyles = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a1a; }
    .wrap { max-width: 560px; margin: 40px auto; background: #ffffff; border: 1px solid #e0e0e0; }
    .header { padding: 32px 40px 28px; border-bottom: 1px solid #e0e0e0; }
    .header h1 { font-size: 18px; font-weight: 600; letter-spacing: -0.3px; color: #1a1a1a; }
    .header p { font-size: 13px; color: #888; margin-top: 4px; }
    .body { padding: 32px 40px; }
    .body p { font-size: 14px; line-height: 1.7; color: #333; }
    .section { margin-top: 28px; padding-top: 24px; border-top: 1px solid #ebebeb; }
    .section-label { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #999; margin-bottom: 12px; }
    .field { display: flex; justify-content: space-between; align-items: baseline; padding: 7px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .field:last-child { border-bottom: none; }
    .field .label { color: #888; }
    .field .value { color: #1a1a1a; font-weight: 500; text-align: right; max-width: 60%; }
    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .item:last-child { border-bottom: none; }
    .item-name { color: #1a1a1a; font-weight: 500; }
    .item-meta { color: #999; font-size: 12px; margin-top: 2px; }
    .item-price { color: #1a1a1a; font-weight: 500; white-space: nowrap; }
    .total-row { display: flex; justify-content: space-between; padding-top: 14px; font-size: 14px; font-weight: 600; color: #1a1a1a; }
    .status-block { display: inline-block; padding: 6px 14px; background: #f4f4f4; border: 1px solid #e0e0e0; font-size: 13px; font-weight: 500; color: #1a1a1a; margin: 16px 0; }
    .address { font-size: 13px; line-height: 1.8; color: #555; }
    .footer { padding: 20px 40px; border-top: 1px solid #e0e0e0; background: #fafafa; font-size: 12px; color: #aaa; }
  </style>
`;

// ─── Welcome Email ────────────────────────────────────────────────────────────

const getWelcomeEmailTemplate = (userName, frontendUrl = 'https://hashira.in') => `
<!DOCTYPE html>
<html>
<head>${baseStyles}</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Hashira</h1>
      <p>Welcome to the store</p>
    </div>
    <div class="body">
      <p>Hi ${userName},</p>
      <p style="margin-top:12px;">Your account is set up. You can now browse the collection, place orders, and track your deliveries from your account page.</p>
      <div class="section">
        <a href="${frontendUrl}" style="display:inline-block;margin-top:4px;padding:10px 24px;background:#1a1a1a;color:#fff;text-decoration:none;font-size:13px;font-weight:500;">
          Go to Store
        </a>
      </div>
    </div>
    <div class="footer">Hashira &mdash; ${new Date().getFullYear()}. This is an automated message.</div>
  </div>
</body>
</html>
`;

// ─── Order Confirmation ───────────────────────────────────────────────────────

const getOrderConfirmationTemplate = (orderDetails) => {
  const name = resolveName(orderDetails);
  const { address } = orderDetails;

  return `
<!DOCTYPE html>
<html>
<head>${baseStyles}</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Order Confirmed</h1>
      <p>We've received your order and will process it shortly</p>
    </div>
    <div class="body">
      <p>Hi ${name},</p>

      <div class="section">
        <div class="section-label">Order Info</div>
        <div class="field"><span class="label">Order ID</span><span class="value">${orderDetails.orderId}</span></div>
        <div class="field"><span class="label">Date</span><span class="value">${new Date(orderDetails.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
        <div class="field"><span class="label">Payment</span><span class="value">${orderDetails.paymentMethod} &mdash; ${orderDetails.payment ? 'Paid' : 'Pending'}</span></div>
      </div>

      <div class="section">
        <div class="section-label">Items</div>
        ${orderDetails.items.map(item => `
          <div class="item">
            <div>
              <div class="item-name">${item.name}</div>
              <div class="item-meta">Size: ${item.size} &nbsp;&middot;&nbsp; Qty: ${item.quantity}</div>
            </div>
            <div class="item-price">&#8377;${item.price}</div>
          </div>
        `).join('')}
        <div class="total-row">
          <span>Total</span>
          <span>&#8377;${orderDetails.amount}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-label">Shipping Address</div>
        <div class="address">
          ${address.street}<br>
          ${address.city}, ${address.state} &mdash; ${address.zipcode}<br>
          ${address.phone}
        </div>
      </div>

      <p style="margin-top:28px;font-size:13px;color:#888;">You'll get another email when your order ships.</p>
    </div>
    <div class="footer">Hashira &mdash; ${new Date().getFullYear()}. This is an automated message.</div>
  </div>
</body>
</html>
`;
};

// ─── Order Status Update ──────────────────────────────────────────────────────

const getOrderStatusTemplate = (orderDetails, status) => {
  const name = resolveName(orderDetails);

  const statusMessages = {
    'Order Placed':     'Your order has been placed and is being reviewed.',
    'Packing':          'Your order is being packed.',
    'Shipped':          'Your order has been shipped and is on its way.',
    'Out for Delivery': 'Your order is out for delivery today.',
    'Delivered':        'Your order has been delivered.'
  };

  const message = statusMessages[status] || 'Your order status has been updated.';

  return `
<!DOCTYPE html>
<html>
<head>${baseStyles}</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Order Update</h1>
      <p>${message}</p>
    </div>
    <div class="body">
      <p>Hi ${name},</p>
      <p style="margin-top:12px;">${message}</p>

      <div class="status-block">${status}</div>

      <div class="section">
        <div class="section-label">Order Info</div>
        <div class="field"><span class="label">Order ID </span><span class="value">${orderDetails._id || orderDetails.orderId}</span></div>
        <div class="field"><span class="label">Date </span><span class="value">${new Date(orderDetails.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
        <div class="field"><span class="label">Total </span><span class="value">&#8377;${orderDetails.amount}</span></div>
      </div>

      ${status === 'Delivered' ? `<p style="margin-top:24px;font-size:13px;color:#888;">If you have any questions about your order, reply to this email.</p>` : `<p style="margin-top:24px;font-size:13px;color:#888;">You can track your order from your account dashboard.</p>`}
    </div>
    <div class="footer">Hashira &mdash; ${new Date().getFullYear()}. This is an automated message.</div>
  </div>
</body>
</html>
`;
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const sendWelcomeEmail = async (userEmail, userName, frontendUrl = 'https://hashira.in') => {
  try {
    await sendEmail(userEmail, 'Welcome to Hashira', getWelcomeEmailTemplate(userName, frontendUrl));
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

export const sendOrderConfirmationEmail = async (userEmail, orderDetails) => {
  try {
    await sendEmail(userEmail, `Order Confirmed — #${orderDetails.orderId}`, getOrderConfirmationTemplate(orderDetails));
    return { success: true };
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return { success: false, error: error.message };
  }
};

export const sendOrderStatusEmail = async (userEmail, orderDetails, status) => {
  try {
    await sendEmail(userEmail, `Order Update — ${status}`, getOrderStatusTemplate(orderDetails, status));
    return { success: true };
  } catch (error) {
    console.error('Error sending status email:', error);
    return { success: false, error: error.message };
  }
};

// ─── OTP Email ────────────────────────────────────────────────────────────────

const getOtpEmailTemplate = (otp) => `
<!DOCTYPE html>
<html>
<head>${baseStyles}</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Hashira</h1>
      <p>Password reset</p>
    </div>
    <div class="body">
      <p>Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
      <div style="margin: 28px 0; text-align: center;">
        <div style="display: inline-block; padding: 16px 40px; background: #f4f4f4; border: 1px solid #e0e0e0; letter-spacing: 0.35em; font-size: 28px; font-weight: 700; color: #1a1a1a; font-family: monospace;">
          ${otp}
        </div>
      </div>
      <p style="font-size: 13px; color: #888;">If you did not request this, you can safely ignore this email.</p>
    </div>
    <div class="footer">Hashira — hashira.in</div>
  </div>
</body>
</html>
`;

export const sendOtpEmail = async (userEmail, otp) => {
  try {
    await sendEmail(userEmail, 'Your Hashira password reset OTP', getOtpEmailTemplate(otp));
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};