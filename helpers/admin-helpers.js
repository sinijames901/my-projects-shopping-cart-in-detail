var db=require('../config/connection')
var collections=require('../config/collections')
var ObjectId = require('mongodb').ObjectId
const bcrypt=require('bcrypt')
const { resolve } = require('path');



module.exports={


    doSignUp:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            adminData.Password=await bcrypt.hash(adminData.Password,10)
            db.get().collection(collections.ADMIN_COLLECTION).insertOne(adminData).then((response)=>{
                console.log(response);
               resolve(adminData)
            })
      })
    },


doLogin:(adminData)=>{
    return new Promise(async(resolve,reject)=>{
        let loginStatus=false
        let response={}
        let admin=await db.get().collection(collections.ADMIN_COLLECTION).findOne({Email:adminData.Email})
        if(admin){
            bcrypt.compare(adminData.Password,user.Password).then((status)=>{
                if(status){
                    console.log("Login success");
                    response.admin=admin
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
 }


}