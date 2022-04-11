var db=require('../config/connection')
var collections=require('../config/collections')
const bcrypt=require('bcrypt')
var ObjectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { resolve } = require('path');



var instance = new Razorpay({
    key_id: 'rzp_test_o6Qoewn0xMzzyK',
    key_secret: 'xqsDvxjdhI0YZ0GMGmvOFPxU',
  });


module.exports={

    doSignUp:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(userData)
    
        })
      })
    },


    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collections.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log("Login success");
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log("login failed");
                        resolve({status:false})
                    }

                })
            }else{
                console.log("login failed");
                resolve({status:false})

            }

        })
    },


    addToCart:(proId,userId)=>{
        let proObj={
            item:ObjectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
          let userCart=await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectId(userId)})
          if(userCart){
              let proExist=userCart.products.findIndex(product=>product.item==proId)
              console.log(proExist);
              if(proExist!=-1){
                  db.get().collection(collections.CART_COLLECTION)
                  .updateOne({user:ObjectId(userId),'products.item':ObjectId(proId)},
                  {
                      $inc:{'products.$.quantity':1}
                  }
                  ).then(()=>{
                      resolve()
                  })
              }else{
              db.get().collection(collections.CART_COLLECTION)
              .updateOne({user:ObjectId(userId)},
              
                {
                    $push:{products:proObj}
                
                }
              ).then((response)=>{
                  resolve()
              })
            }

          }else{
              let cartobj={
                  user:ObjectId(userId),
                  products:[proObj]
              }
              db.get().collection(collections.CART_COLLECTION).insertOne(cartobj).then((response)=>{
                resolve()
              })
          }
        })

    },


    getCartProducts:(userId)=>{
       return new Promise(async(resolve,reject)=>{
          let cartItems=await db.get().collection(collections.CART_COLLECTION).aggregate([
              {
                  $match:{user:ObjectId(userId)}
              },
              {
                  $unwind:'$products'
              },
              {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
              },
              {
                  $lookup:{
                      from:collections.PRODUCT_COLLECTION,
                      localField:'item',
                      foreignField:'_id',
                      as:'product'
                  }
              },
              {
                 $project:{
                     item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                 }
              }
          ]).toArray()
          resolve(cartItems)
       })
    },


    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
           let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectId(userId)})
           if(cart){
              count=cart.products.length
           }
           resolve(count)
        })
    },


    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)


        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collections.CART_COLLECTION)
                .updateOne({_id:ObjectId(details.cart)},
                {
                $pull:{products:{item:ObjectId(details.product)}}
                }
            ).then((response)=>{
                resolve({removeProduct:true})

            })
        }else{
            db.get().collection(collections.CART_COLLECTION)
                  .updateOne({_id:ObjectId(details.cart),'products.item':ObjectId(details.product)},
                  {
                      $inc:{'products.$.quantity':details.count}
                  }
                  ).then((response)=>{
                      resolve({status:true})
                })
            
            }
            
        
        })


    },

    // removeProduct:(Ids)=>{
    //     return new Promise((resolve,reject)=>{
    //        db.get().collection(collections.CART_COLLECTION).deleteOne({_id:ObjectId(Ids)}).then((response)=>{
    //            resolve(response)
    //        })
    //     })

    // },

    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                  $project:{
                      item:'$products.item',
                      quantity:'$products.quantity'
                  }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                   $project:{
                       item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                   }
                },
                {
                    $group:{
                        _id:null,
                        total:{
                            $sum:{
                                $multiply:[{ $toInt: '$quantity' },{ $toInt: '$product.Price' }]
                            }
                        }
                    }
                }
            ]).toArray()
            // console.log(total[0].total);
            resolve(total[0].total)
         })

    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
            console.log(order,products,total);
            let status=order['payment-method']==='COD'?'Placed':'Pending'
            let orderObj={
                deliveryDetails:{
                    mobile:order.Mobile,
                    address:order.Address,
                    pincode:order.Pincode
            
                },
                userId:ObjectId(order.userId),
                paymentMethod:order['payment-method'],
                products:products,
                totalAmount:total,
                status:status,
                date:new Date()
            }

           db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
               db.get().collection(collections.CART_COLLECTION).deleteOne({user:ObjectId(order.userId)})
                resolve(response.insertedId)
           })
        })


    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectId(userId)})
            resolve(cart.products)
        })

    },
    
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collections.ORDER_COLLECTION)
            .find({userId:ObjectId(userId)}).toArray()
            // console.log(orders);
            resolve(orders)
        })

    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems=await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                  $project:{
                      item:'$products.item',
                      quantity:'$products.quantity'
                  }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                   $project:{
                       item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                   }
                }
            ]).toArray()
            // console.log(orderItems);
            resolve(orderItems)
         })


    },
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let Users=await db.get().collection(collections.USER_COLLECTION).find().toArray()
            resolve(Users)
        })
    },

    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options={
                amount: total*100,
                currency: "INR",
                receipt:""+orderId
            };
            instance.orders.create(options,function(err,order){
                console.log("new order :",order);
                resolve(order)
            });
        
        })

    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'xqsDvxjdhI0YZ0GMGmvOFPxU');
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }

        })

    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
           db.get().collection(collections.ORDER_COLLECTION)
           .updateOne({_id:ObjectId(orderId)},
           {
                $set:{
                    status:'placed'
                }
           }
        ).then(()=>{
            resolve()
        })
     })
    }

    
}