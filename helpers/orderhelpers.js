var db = require('../database/connection');
var collections = require('../database/collections');
const { ObjectId } = require('mongodb');
const Razorpay = require('razorpay')
const crypto = require('crypto');
const { resolve } = require('path');
var instance = new Razorpay({
    key_id: 'rzp_test_eARPjl54RYSf66',
    key_secret: 'SIMZKACgM0EuWajZoBbZURL7'
})

module.exports = {
    placeOrder:async function(userId, order, products, totalPrice) {
        order.userId  = userId;
        console.log(order,"products", products, totalPrice);
        return new Promise(async function(resolve, reject) {
            let status = order.paymentmethod === 'COD'?'placed':'pending'
            let orderObj = {
                addressId : order.addressId,
                userId: ObjectId(userId),
                paymentmethod : order.paymentmethod,
                products: products,
                totalAmount: totalPrice,
                status: status,
                date: new Date()
            };

            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then(async (response) => {
                await db.get().collection(collections.CART_COLLECTION).deleteOne({userId: ObjectId(userId)})
                // console.log("response",response.insertedId)
                resolve(response)
            })
        })
    },

    getAllOrdersbyUserId: async function(userId) {
        return new Promise (async function(resolve, reject) {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{userId: ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                        totalAmount:1,
                        status: 1
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField:'_id',
                        as: 'product'
                    }
                },
                {
                    $project:{
                        totalAmount:1,
                        status: 1,
                        item:1,
                        quantity:1,
                        product: {$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()

            let orderIds = await db.get().collection(collections.ORDER_COLLECTION).find({userId: ObjectId(userId)}).project({_id:1}).toArray()
            console.log("\n",orderIds,"\n");
            console.log(orders)
            resolve(orders, orderIds)
        })
    },

    getAllOrders: function() {
        return new Promise (function (resolve, reject) {
            db.get().collection(collections.ORDER_COLLECTION).find().toArray().then((response) => {
                resolve(response)
            })
        })
    },

    cancelOrder: function(id) {
        return new Promise(function(resolve, reject) {
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id: ObjectId(id)},{
                $set:{
                    status:"Cancelled"
                }
            }).then((response) => {
                resolve(response)
            })
        })
    },

    generateRazorPay: function(orderId, totalAmount) {
        console.log(orderId);
        return new Promise (function (resolve, reject) {
            var options ={
                amount: totalAmount * 100,
                currency: 'INR',
                receipt: ""+orderId
            };
            instance.orders.create(options, function(err, order) {
                console.log("order", order)
                resolve(order)
            })
        })
    },

    verifyRazorPayPayment: function(details) {
        return new Promise(function( resolve, reject) {
            let hmac = crypto.createHmac('sha256', 'SIMZKACgM0EuWajZoBbZURL7');
            hmac.update(details['payment[razorpay_order_id]']+'|'+ details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex');
            if(hmac == details['payment[razorpay_signature]']){
                resolve()
            } else{
                reject()
            }
        })
    },

    changePaymentStatus: function(orderId) {
        return new Promise (function(resolve, reject) {
            db.get().collection(collections.ORDER_COLLECTION)
            .updateOne({_id: ObjectId(orderId)},
            {
                $set:{
                    status: 'placed'
                }
            }
            ).then((response) => {
                resolve(response)
            })
        })
    },

    changeOrderStatus: function(orderId, status) {
        return new Promise (function (resolve, reject) {
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id: ObjectId(orderId)}, 
            {
                $set:{
                    status: status
                }
            }
            ).then((response) => {
                resolve(response)
            })
        })
    }
    // paypalOrder: function()
}