import { set } from 'mongoose'
import Cart from '../models/cartModel.js'

// Add to Cart Controller

export const addToCart = async (req, res) => {
  try {
    const { productName, productPrice, quantity } = req.body
    const userId = req.userId

    // Validate input with precise checks
    if (!productName || typeof productName !== 'string') {
      return res.status(400).json({ message: 'Invalid product name' })
    }
    if (
      typeof productPrice !== 'number' ||
      productPrice <= 0 ||
      !Number.isFinite(productPrice)
    ) {
      return res.status(400).json({ message: 'Invalid product price' })
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: 'Invalid quantity' })
    }

    // Find or create cart with transaction-safe approach
    let cart =
      (await Cart.findOne({ user: userId }).session(req.session)) ||
      new Cart({ user: userId, items: [], totalPrice: 0 })

    // Check for existing item using precise comparison
    const existingItemIndex = cart.items.findIndex(
      item =>
        item.productName === productName && item.productPrice === productPrice
    )

    // Update or add item
    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity
    } else {
      cart.items.push({
        productName,
        productPrice: Number(productPrice.toFixed(2)),
        quantity
      })
    }

    // Recalculate total from scratch to ensure accuracy
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.productPrice * item.quantity,
      0
    )

    // Apply financial-grade rounding
    cart.totalPrice = Number(cart.totalPrice.toFixed(2))

    // Validate final state
    if (cart.totalPrice < 0) {
      throw new Error('Negative total price calculated')
    }

    await cart.save()
    return res.status(200).json({
      ...cart.toObject(),
      totalPrice: cart.totalPrice
    })
  } catch (error) {
    console.error('Cart Error:', error)
    return res.status(500).json({
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
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
    let { productName, productPrice, id } = req.body
    productPrice = Number(productPrice)
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
    const newItem = cart.items.filter(item => item._id != id)

    cart.items = newItem
    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.productPrice * item.quantity,
      0
    )

    await cart.save()


    res.status(200).json({
      message: 'Item removed successfully'
    })
  } catch (error) {
    console.error('Server Error:', error)
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
