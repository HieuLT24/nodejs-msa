db.products.updateMany(
  {},
  [
    { $set: { price: { $toDouble: "$price" } } }
  ]
)