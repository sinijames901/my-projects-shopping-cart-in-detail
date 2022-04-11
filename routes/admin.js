var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var adminHelpers=require('../helpers/admin-helpers')



// const verifyAdminLogin=(req,res,next)=>{
//   if(req.session.admin.loggedIn){
//     next()
//   }else{
//     res.redirect('/login')
//   }
// }

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products})
  })

 
});

// router.get('/login',(req,res)=>{
//   if(req.session.admin){
//     res.redirect('/admin')
//   }else{
//     res.render('admin/login',{'loginErr':req.session.adminLoginErr})
//     req.session.adminLoginErr=false

//   }
// })
// router.get('/signup',(req,res)=>{
//   res.render('admin/signup')
//   })

//   router.post('/signup',(req,res)=>{
//     adminHelpers.doSignUp(req.body).then((response)=>{
//       console.log(response);
//       req.session.admin=response
//       req.session.admin.loggedIn=true

//       res.redirect('/admin')
//     })
//     })

// router.post('/login',(req,res)=>{
//   adminHelpers.doLogin(req.body).then((response)=>{
//     if(response.status){
//       req.session.admin=response.admin
//       req.session.admin.loggedIn=true
//       res.redirect('/')
//     }else{
//       req.session.adminLoginErr="Invalid username or password"
//       res.redirect('admin/login')
//     }

//   })
// })


router.get('/add-products',function(req,res,next){
  res.render('admin/add-products')
})

router.post('/add-products',(req,res)=>{
  productHelpers.addProduct(req.body,(id)=>{
    let image=req.files.image
    image.mv('./public/product-images/'+id+'.jpg',(err)=>{
      if(!err){
        res.render("admin/add-products")
      }
    })
  })
})
router.get('/delete-products/:id',(req,res)=>{
    let proId=req.params.id
    productHelpers.deleteProduct(proId).then((response)=>{
       res.redirect('/admin/')
    })
})

router.get('/edit-products/:id',async(req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
 res.render('admin/edit-products',{product})
})

router.post('/edit-products/:id',(req,res)=>{
  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.image){
      let image=req.files.image
      image.mv('./public/product-images/'+id+'.jpg')
    }
  })

})

module.exports = router;
