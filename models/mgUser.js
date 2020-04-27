const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        prodId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Product"
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ],
    price: Number
  }
});

UserSchema.methods.addToCart = function(product) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.prodId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];
  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      prodId: product._id,
      quantity: newQuantity
    });
  }
  const updatedCart = {
    items: updatedCartItems
  };
  this.cart = updatedCart;
  return this.save();
};

UserSchema.methods.deleteFromCart = function(id) {
  const updatedCartItems = this.cart.items.filter(item => {
    return item.prodId.toString() !== id.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

UserSchema.methods.clearCart = function() {
  this.cart = { items: [] };
  return this.save();
};
module.exports = mongoose.model("User", UserSchema);
