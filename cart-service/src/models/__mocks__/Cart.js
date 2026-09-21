function Cart(data) {
  this.userId = data.userId;
  this.items = data.items || [];
  this.save = jest.fn().mockResolvedValue(this);
}
Cart.findOne = jest.fn();

module.exports = Cart;
