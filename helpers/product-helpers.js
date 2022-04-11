var db=require('../config/connection')
var collections=require('../config/collections')
var ObjectId = require('mongodb').ObjectId


module.exports={
    addProduct:(product,callback)=>{
        db.get().collection('product').insertOne(product).then((data)=>{
            callback(data.insertedId)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
           db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id:ObjectId(proId)}).then((response)=>{
               resolve(response)
           })
        })

    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:ObjectId(proId)}).then((product)=>{
                resolve(product)
            })

        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION)
            .updateOne({_id:ObjectId(proId)},{
                $set:{
                    Name:proDetails.Name,
                    Description:proDetails.Description,
                    Price:proDetails.Price,
                    Category:proDetails.Category
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    }
}