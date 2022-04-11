const { response } = require('express');
var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var usersHelpers=require('../helpers/user-helpers')



const verifyLogin=(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/login')
  }
}


/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
    cartCount=await usersHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products)=>{
    res.render('user/view-products',{products,user,cartCount})
  })
});

router.get('/login',(req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }else{
    res.render('user/login',{'loginErr':req.session.userLoginErr})
    req.session.userLoginErr=false

  }
})

router.get('/signup',(req,res)=>{
  res.render('user/signup')
  })

router.post('/signup',(req,res)=>{
    usersHelpers.doSignUp(req.body).then((response)=>{
      console.log(response);
      req.session.user=response
      req.session.user.loggedIn=true

      res.redirect('/login')
    })
    })

router.post('/login',(req,res)=>{
      usersHelpers.doLogin(req.body).then((response)=>{
        if(response.status){
          req.session.user=response.user
          req.session.user.loggedIn=true
          res.redirect('/')
        }else{
          req.session.userLoginErr="Invalid username or password"
          res.redirect('/login')
        }

      })
    })
    router.get('/logout',(req,res)=>{
      req.session.user=null
      res.redirect('/login')
    })
    
    router.get('/cart',verifyLogin,async(req,res)=>{
      let products=await usersHelpers.getCartProducts(req.session.user._id)
      let totalValue=0
      if(products.length>0){
        totalValue=await usersHelpers.getTotalAmount(req.session.user._id)
      }
      res.render('user/cart',{products,users:req.session.user._id,totalValue,user:req.session.user})
    })

    router.get('/add-to-cart/:id',(req,res)=>{
      usersHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
        // res.redirect('/')
        res.json({status:true})
      })
    })
    router.post('/change-product-quantity',(req,res,next)=>{
     usersHelpers.changeProductQuantity(req.body).then(async(response)=>{
      response.total=await usersHelpers.getTotalAmount(req.body.user)
      res.json(response) 
     })
    })

    router.get('/place-order',verifyLogin,async(req,res)=>{
      let total=await usersHelpers.getTotalAmount(req.session.user._id)
      res.render('user/place-order',{total,user:req.session.user})
      })
  
    // router.post('/remove-product',(req,res,next)=>{
    //   usersHelpers.removeProduct(req.body).then((response)=>{
    //    res.json(response) 
    //   })
    //  })
    
    router.post('/place-order',async(req,res)=>{
      let products=await usersHelpers.getCartProductList(req.body.userId)
      let totalPrice=await usersHelpers.getTotalAmount(req.body.userId)
      usersHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
        if(req.body['payment-method']==='COD'){
          res.json({codSuccess:true})
        }else{
          usersHelpers.generateRazorpay(orderId,totalPrice).then((response)=>{
            console.log(orderId);
            res.json(response)

          })
        }

      })
      console.log(req.body);
    })


    router.get('/order-success',(req,res)=>{
      res.render('user/order-success',{user:req.session.user})
      })

    router.get('/order-list',async(req,res)=>{
        let orders=await usersHelpers.getUserOrders(req.session.user._id)
        res.render('user/order-list',{user:req.session.user,orders})
        })

    router.get('/view-order-products/:id',async(req,res)=>{
          let products=await usersHelpers.getOrderProducts(req.params.id)
          res.render('user/view-order-products',{user:req.session.user,products})
        })
        
    router.get('/all-Users', function(req, res,next) {
            usersHelpers.getAllUsers().then((Users)=>{
              res.render('user/all-Users',{admin:true,Users,user:req.session.user})
            })
          });
          
    router.post('/verify-payment',(req,res)=>{
            console.log(req.body);
            usersHelpers.verifyPayment(req.body).then(()=>{
              usersHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
                res.json({status:true})
              })
            }).catch((err)=>{
              res.json({status:false,errMsg:''})

            })

          })
module.exports = router;
