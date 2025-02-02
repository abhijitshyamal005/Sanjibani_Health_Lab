import Cart from '../models/cartModel.js'

// Add to Cart Controller
export const addToCart = async (req, res) => {
  try {
    const { productName, productPrice, quantity } = req.body
    const userId = req.userId

    // Find user's cart or create new
    let cart = await Cart.findOne({ user: userId })
    if (!cart) {
      cart = new Cart({ user: userId, items: [], totalPrice: 0 })
    }

    // Check if item exists
    const existingItem = cart.items.find(
      item =>
        item.productName === productName && item.productPrice === productPrice
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.items.push({ productName, productPrice, quantity })
    }

    // Update total price
    cart.totalPrice += productPrice * quantity

    await cart.save()
    res.status(200).json(cart)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Get Cart Controller
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId })
    res.status(200).json(cart || { items: [], totalPrice: 0 })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// Remove from Cart Controller
export const removeFromCart = async (req, res) => {
  try {
    const { productName, productPrice } = req.body
    const userId = req.userId

    // Validate input
    if (!productName || typeof productPrice !== 'number') {
      return res.status(400).json({
        message: 'Invalid request format',
        required: {
          productName: 'string',
          productPrice: 'number'
        }
      })
    }

    const cart = await Cart.findOne({ user: userId })
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    const itemIndex = cart.items.findIndex(
      item =>
        item.productName === productName && item.productPrice === productPrice
    )

    if (itemIndex === -1) {
      return res.status(404).json({
        message: 'Item not found in cart',
        details: { productName, productPrice }
      })
    }

    // Update total price
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.productPrice * item.quantity,
      0
    )

    cart.items.splice(itemIndex, 1)
    await cart.save()

    res.status(200).json({
      message: 'Item removed successfully',
      items: cart.items,
      totalPrice: cart.totalPrice
    })
  } catch (error) {
    console.error('Server Error:', error)
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
