import { createSlice } from '@reduxjs/toolkit';

/**
 * Cart Slice — Integrated from teammate's Store Management module.
 * Manages cart items, total quantity, and total price.
 */

const initialState = {
  cartItems: [],
  totalQuantity: 0,
  totalPrice: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    /**
     * Add a product to the cart.
     * If the product already exists, increment quantity.
     */
    addToCart: (state, action) => {
      const item = action.payload;
      const existingItem = state.cartItems.find(
        (product) => product._id === item._id
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.cartItems.push({ ...item, quantity: 1 });
      }

      state.totalQuantity += 1;
      state.totalPrice += item.price;
    },

    /**
     * Remove a product entirely from the cart.
     */
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      const item = state.cartItems.find((product) => product._id === itemId);

      if (item) {
        state.totalQuantity -= item.quantity;
        state.totalPrice -= item.price * item.quantity;
      }

      state.cartItems = state.cartItems.filter(
        (product) => product._id !== itemId
      );
    },

    /**
     * Update the quantity of an item in the cart.
     */
    updateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.cartItems.find((product) => product._id === itemId);

      if (item && quantity > 0) {
        const diff = quantity - item.quantity;
        state.totalQuantity += diff;
        state.totalPrice += item.price * diff;
        item.quantity = quantity;
      }
    },

    /**
     * Clear the entire cart.
     */
    clearCart: (state) => {
      state.cartItems = [];
      state.totalQuantity = 0;
      state.totalPrice = 0;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
