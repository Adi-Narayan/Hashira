import userModel from '../models/userModel.js';

const SHIPROCKET_API = 'https://apiv2.shiprocket.in/v1/external';

const getToken = async () => {
  const res = await fetch(`${SHIPROCKET_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  const data = await res.json();

  if (!res.ok || !data.token) {
    throw new Error(data.message || 'Shiprocket authentication failed');
  }

  return data.token;
};

export const pushOrder = async (order) => {
  const token = await getToken();

  const user = await userModel.findById(order.userId).select('email');
  const billingEmail = user?.email || 'noreply@hashira.in';

  const orderItems = order.items.map(item => ({
    name: item.name,
    sku: String(item._id || item.name).slice(0, 40),
    units: item.quantity,
    selling_price: item.price,
  }));

  const payload = {
    order_id: order._id.toString(),
    order_date: new Date(order.date).toISOString().split('T')[0],
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
    billing_customer_name: order.address.firstName,
    billing_last_name: order.address.lastName || '',
    billing_address: order.address.street,
    billing_city: order.address.city,
    billing_state: order.address.state,
    billing_pincode: String(order.address.zipcode),
    billing_country: 'India',
    billing_phone: String(order.address.phone).replace(/\D/g, '').replace(/^91/, '').slice(-10),
    billing_email: billingEmail,
    shipping_is_billing: 1,
    payment_method: order.payment === true ? 'Prepaid' : 'COD',
    sub_total: order.amount,
    length: 30,
    breadth: 25,
    height: 5,
    weight: 0.5,
    order_items: orderItems,
  };

  const res = await fetch(`${SHIPROCKET_API}/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `Shiprocket order creation failed (${res.status})`);
  }

  return data;
};
