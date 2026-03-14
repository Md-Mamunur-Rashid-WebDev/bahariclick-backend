const Order = require('../models/Order');
const Product = require('../models/Product');

// @POST /api/orders — Customer: Create new order
const createOrder = async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  // Verify stock and calculate real prices from DB (never trust frontend prices)
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw new Error(`Product not found: ${item.product}`);
    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `Not enough stock for ${product.name}` });
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0]?.url,
      price: product.price, // Use DB price, not frontend price
      quantity: item.quantity,
    });

    subtotal += product.price * item.quantity;

    // Reduce stock
    product.stock -= item.quantity;
    await product.save();
  }

  const shippingPrice = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const totalPrice = subtotal + shippingPrice;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    subtotal,
    shippingPrice,
    totalPrice,
    isPaid: true, // In production, set this after payment confirmation
    paidAt: new Date(),
  });

  res.status(201).json(order);
};

// @GET /api/orders/my — Customer: Get their own orders
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

// @GET /api/orders — Admin: Get all orders
const getAllOrders = async (req, res) => {
  const orders = await Order.find({})
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json(orders);
};

// @PUT /api/orders/:id/status — Admin: Update order status
const updateOrderStatus = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  
  order.status = req.body.status;
  const updated = await order.save();
  res.json(updated);
};

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus };