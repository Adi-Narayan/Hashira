// backend/services/emailService.js
import * as Brevo from '@getbrevo/brevo';

// Configure Brevo API client
const brevoClient = new Brevo.TransactionalEmailsApi();
brevoClient.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

// Helper to send email via Brevo HTTP API
const sendEmail = async (to, subject, html) => {
  const email = new Brevo.SendSmtpEmail();
  email.to = [{ email: to }];
  email.subject = subject;
  email.htmlContent = html;
  email.sender = { email: process.env.BREVO_EMAIL, name: 'Hashira' };
  return await brevoClient.sendTransacEmail(email);
};

console.log('Email service ready');

// Welcome email template
const getWelcomeEmailTemplate = (userName, frontendUrl = 'https://hashira.in') => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Hashira!</h1>
    </div>
    <div class="content">
      <h2>Hi ${userName}!</h2>
      <p>Thank you for joining Hashira. We're excited to have you as part of our community!</p>
      <p>Your account has been successfully created. You can now:</p>
      <ul>
        <li>Browse our exclusive collection</li>
        <li>Add items to your cart</li>
        <li>Track your orders</li>
        <li>Manage your profile</li>
      </ul>
      <center>
        <a href="${frontendUrl}" class="button">Start Shopping</a>
      </center>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Hashira. All rights reserved.</p>
      <p>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>
`;

// Order confirmation email template
const getOrderConfirmationTemplate = (orderDetails) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; }
    .order-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd; }
    .item { padding: 10px 0; border-bottom: 1px solid #eee; }
    .total { font-size: 18px; font-weight: bold; color: #4CAF50; margin-top: 15px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed! ✓</h1>
    </div>
    <div class="content">
      <h2>Thank you for your order!</h2>
      <p>Hi ${orderDetails.customerName},</p>
      <p>We've received your order and will process it soon.</p>
      
      <div class="order-box">
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Date:</strong> ${new Date(orderDetails.date).toLocaleDateString()}</p>
        <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
        <p><strong>Payment Status:</strong> ${orderDetails.payment ? 'Paid' : 'Pending'}</p>
        
        <h4 style="margin-top: 20px;">Items:</h4>
        ${orderDetails.items.map(item => `
          <div class="item">
            <strong>${item.name}</strong> - Qty: ${item.quantity} - Size: ${item.size}
          </div>
        `).join('')}
        
        <p class="total">Total Amount: ₹${orderDetails.amount}</p>
        
        <h4 style="margin-top: 20px;">Shipping Address:</h4>
        <p>
          ${orderDetails.address.street}<br>
          ${orderDetails.address.city}, ${orderDetails.address.state}<br>
          ${orderDetails.address.zipcode}<br>
          Phone: ${orderDetails.address.phone}
        </p>
      </div>
      
      <p>You'll receive another email when your order ships.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Hashira. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// Order status update email template
const getOrderStatusTemplate = (orderDetails, status) => {
  const statusConfig = {
    'Order Placed': { color: '#2196F3', icon: '📦', message: 'Your order has been placed successfully!' },
    'Packing': { color: '#FF9800', icon: '📦', message: 'Your order is being packed with care.' },
    'Shipped': { color: '#9C27B0', icon: '🚚', message: 'Your order is on its way!' },
    'Out for delivery': { color: '#FF5722', icon: '🚚', message: 'Your order will be delivered soon!' },
    'Delivered': { color: '#4CAF50', icon: '✅', message: 'Your order has been delivered!' }
  };

  const config = statusConfig[status] || statusConfig['Order Placed'];

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${config.color}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .status-badge { background: ${config.color}; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 15px 0; }
    .order-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid ${config.color}; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${config.icon} Order Status Update</h1>
    </div>
    <div class="content">
      <h2>Hi ${orderDetails.customerName}!</h2>
      <p>${config.message}</p>
      
      <div class="status-badge">
        Status: ${status}
      </div>
      
      <div class="order-info">
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Order Date:</strong> ${new Date(orderDetails.date).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> ₹${orderDetails.amount}</p>
      </div>
      
      ${status === 'Delivered' ? 
        '<p>We hope you enjoy your purchase! Please let us know if you have any feedback.</p>' :
        '<p>You can track your order anytime from your account dashboard.</p>'
      }
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Hashira. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
};

// Send welcome email
export const sendWelcomeEmail = async (userEmail, userName, frontendUrl = 'https://hashira.in') => {
  try {
    await sendEmail(userEmail, 'Welcome to Hashira! 🎉', getWelcomeEmailTemplate(userName, frontendUrl));
    console.log(`Welcome email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation email
export const sendOrderConfirmationEmail = async (userEmail, orderDetails) => {
  try {
    await sendEmail(userEmail, `Order Confirmation - #${orderDetails.orderId}`, getOrderConfirmationTemplate(orderDetails));
    console.log(`Order confirmation sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return { success: false, error: error.message };
  }
};

// Send order status update email
export const sendOrderStatusEmail = async (userEmail, orderDetails, status) => {
  try {
    await sendEmail(userEmail, `Order Status Update - ${status}`, getOrderStatusTemplate(orderDetails, status));
    console.log(`Order status email sent to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending status email:', error);
    return { success: false, error: error.message };
  }
};