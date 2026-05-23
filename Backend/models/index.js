const User = require('./User');
const Product = require('./Product');
const Purchase = require('./Purchase');
const PurchasedItems = require('./PurchasedItems');
const Stock = require('./Stock');
const Sale = require('./Sale');
const Debt = require('./Debt')
const defineRelationships = require('./relationShip');

//to define relationships between models
defineRelationships();

module.exports = {
    User,
    Product,
    Purchase,
    PurchasedItems,
    Stock,
    Sale,
    Debt
    
}