var express = require('express');
var router = express.Router();
const userModel= require('./users');
const productModel=require('./products');
const cartModel= require('./cart');
const passport = require('passport');
const localStrategy=require('passport-local');
const upload = require('./multer');

passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
// login
router.get('/', function(req, res, next) {
  res.render('index',{header: false});
});

// register get
router.get('/register',function(req,res,next){
  // show sign up form
  res.render('register',{header: false})
})
router.post('/register', function(req,res,next){
  console.log("Registering new user...");
  const userData= new userModel({
    username: req.body.username,
    name:req.body.name,
    email:req.body.email,
    identity:req.body.identity,
    gender:req.body.gender,
    phone:req.body.phone,
  });
  userModel.register(userData,req.body.password,function(err,user){
    if (err) {
      console.log("Registeration error:",err);
      res.status(500).send("Username already taken or you are entering invalid email")
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect('/profile');
      })
    }
  })

})
// login
router.post("/login",passport.authenticate("local",{
  successRedirect:'/home',
  failureRedirect:'/login'
}), function(req,res){

})
// logout
router.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});
// islogged in
function isLoggedIn(req,res,next){
  if(req.isAuthenticated()) return next();
  res.redirect('/login');
}
// profile
router.get('/profile',isLoggedIn, async function(req,res,next){
  const user= await userModel.findOne({username:req.session.passport.user});

  res.render('profile',{header:true,user})
})
// home route
router.get('/home',isLoggedIn, async function(req,res,next){
  const user= await userModel.findOne({username:req.session.passport.user});
  const products= await productModel.find().populate();

  res.render('home',{header:false,user,products})
})

// create post get route
router.get('/upload',isLoggedIn, async function(req,res,next){
  const user= await userModel.findOne({username:req.session.passport.user});
  res.render('createpost',{header:false,user});
})
// create post post route
router.post('/upload',isLoggedIn,upload.single('image'), async function(req,res,next){
  if(!req.file){
    return res.status(404),res.send("No file uploaded");
    
  }
  const user= await userModel.findOne({username:req.session.passport.user});
  const product= await productModel.create({
    name:req.body.name,
    image:req.file.filename,
    description:req.body.description,
    price:req.body.price,
    category:req.body.productcategory,
    user:user._id,
  })
  console.log(product);
  user.products.push(product._id);
  await user.save();
  res.redirect('/home');
})
//edit profile icon
router.post('/editprofile',isLoggedIn,upload.single('image'), async function(req,res,next){
  const user= await userModel.findOneAndUpdate(
    {username:req.session.passport.user},
    {profileImage:req.file.filename},
    {new:true},
    )
    if(req.file){
      user.profileImage=req.file.filename;
    }
    await user.save();
    res.redirect('/profile');
})
// edit personal information (post)

router.post('/editprofileinfo', isLoggedIn, async function (req, res, next) {
  const user = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    {name: req.body.name, email: req.body.email,phone: req.body.phone,},
    { new: true }
  );

  await user.save();
  res.redirect('/profile');
});

// edit personal information (get)
router.get('/editprofileinfo',isLoggedIn, async function(req,res,next){
  const user = await userModel.findOne({username:req.session.passport.user});
  res.render('editprofileinfo',{header:false,user});
});

//search
router.get('/search',isLoggedIn,async function(req, res) {
   const user= await userModel.findOne({username: req.session.passport.user}).populate("products")
   const products= await userModel.find();
  res.render('search', {footer: true,header:true,user,products});
});

// for search
router.get('/productname/:productname', isLoggedIn, async function(req, res) {
  console.log('Search query:', req.params.productname);
  const regex = new RegExp(`${req.params.productname}`, 'i');
  const products = await productModel.find({ name: regex });
  console.log('Search results:', products);
  res.json(products);
});



// route for mobilestore
router.get('/store',isLoggedIn, async function(req,res,next){
   const user = await userModel.findOne({username:req.session.passport.user});
   const products= await productModel.find().populate();
  res.render('store',{header:false,user,products});
})

//route for visiting product
router.get('/store/product/:id',isLoggedIn, async function(req,res,next){
   try {
    const user= await userModel.findOne({username:req.session.passport.user}).populate('products');
    const product= await productModel.findOne({_id:req.params.id});
    res.render('visitproduct',{header:true,user,product});

   } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error')
   }
   
})

// cart get router

router.post('/add-to-cart/:productId', isLoggedIn, async function(req, res, next) {
  try {
    const { productId } = req.params;
    const user = await userModel.findOne({ username: req.session.passport.user });
    
    // Find or create the user's cart
    let cart = await cartModel.findOne({ user: user._id });
    if (!cart) {
      cart = await cartModel.create({ user: user._id, products: [] });
    }

    // Check if the product is already in the cart
    const existingProduct = cart.products.find(product => product.product.toString() === productId);
    if (existingProduct) {
      // Increment the quantity if the product is already in the cart
      existingProduct.quantity += 1;
    } else {
      // Add the product to the cart if it's not already present
      cart.products.push({ product: productId });
    }

    // Save the cart
    await cart.save();

    res.redirect('/cart');
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).send('Internal Server Error');
  }
});


// cart get router
router.get('/cart', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    
    // Find the user's cart
    const cart = await cartModel.findOne({ user: user._id }).populate('products.product');

    console.log('User:', user);
    console.log('Cart:', cart);

    res.render('cart', { header: true, user, cart });
  } catch (error) {
    console.error('Error fetching cart data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// remove cart get route
router.get('/remove/product/:id',isLoggedIn, async function(req,res,next){
  const productid = req.params.id;
  const user= await userModel.findOne({username:req.session.passport.user});
  const product= await productModel.findOne({_id:req.params.id});
   const cart = await cartModel.findOne({ user: user._id }).populate('products.product');
   if (!product) {
      // Post not found or user does not own the post
      return res.status(404).send('cart empty');
    }

    user.cart.pull(productid);
    await user.save();

    // delte
    await cartModel.updateOne({ user: user._id }, { $pull: { products: { product: productid } } });

    // Redirect back to the cart
    res.redirect('/cart');
     res.render('cart', { header: true, user, cart,product });
})
module.exports = router;
