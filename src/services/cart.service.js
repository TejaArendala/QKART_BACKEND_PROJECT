const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");
const { getUserByEmail } = require("./user.service");

// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  const cart = await Cart.findOne({ email: user.email });
  if (cart === null) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }

  return cart;
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {

  

  let cart = await Cart.findOne({ email: user.email });
  if (!cart) {
    cart = await Cart.create({ email: user.email ,cartItems:[]});
    if (!cart) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Internal Server Error"
      );
    }
  }

  let productExists = await Product.findOne({ _id: productId });

  if (!productExists) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }
  
  const productFound = cart.cartItems.filter((cartItem) => {
    if (cartItem.product._id == productId) return true;
    else return false;
  });
  if (productFound.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product already in cart. Use the cart sidebar to update or remove product from cart"
    );
  } else {
    
    cart.cartItems.push({
      product: productExists,
      quantity,
    });
  }
  const productAdd = await cart.save();
  return productAdd;
  // try {
  
  //   console.log(user.email);

    
  //   let cart = await Cart.findOne({ email: user.email });
    
  //   if (!cart) {
  //     try {
        //  cart = await Cart.create({
        //   email: user.email,
        //   cartItems: [],
        //   paymentOption: config.default_payment_option,
        // });
  //     } catch (err) {
  //       throw new ApiError(
  //         httpStatus.INTERNAL_SERVER_ERROR,
  //         "User cart creation failed because user already have a cart"
  //       );
  //     }
  //   }
  //   if (cart == null) {
  //     throw new ApiError(
  //       httpStatus.INTERNAL_SERVER_ERROR,
  //       "User does not have a cart"
  //     );
  //   }

  //   var productindex = -1;

  //   for (let i = 0; i < cart.cartItems.length; i++) {
  //    // console.log("Hiiiii");
  //     if (productId == cart.cartItems[i].product._id) {
  //       productindex = i;
  //       console.log("before break",productindex);
  //       break;
  //     }
  //   }
  // //  console.log(productindex,cart.cartItems);

  //   if (productindex === -1) {
  //     let product = await Product.findOne({ _id: productId });

  //     if (product == null) {
  //       throw new ApiError(
  //         httpStatus.BAD_REQUEST,
  //         "Product doesn't exist in database"
  //       );
  //     }
  //     cart.cartItems.push({ product:product, quantity });
  //   } else {
      
  //     console.log("HII im in else");

  //     throw new ApiError(
  //       httpStatus.BAD_REQUEST, 
  //       "Product already exist in cart, Use sidebar to add or Remove items"
  //     );
      

  //   }
    
  //   console.log(cart);
  //   await cart.save();
  //   return cart;
  // } catch (err) {
   
  // }
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  let cart = await Cart.findOne({ email: user.email });
  if (cart == null) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User does not have a cart,USE POST to create cart and add products"
    );
  }

  let product = await Product.findOne({ _id: productId });

  if (product == null) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }

  let productindex = -1;

  for (let i = 0; i < cart.cartItems.length; i++) {
    if (productId == cart.cartItems[i].product._id) {
      productindex = i;
      break;
    }
  }

  if (productindex == -1) { 
    throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in cart");
  } else {
    cart.cartItems[productindex].quantity = quantity;
  }

  await cart.save();
  return cart;
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
  
const deleteProductFromCart = async (user, productId) => {
 
   let foundcart = await Cart.findOne({email:user.email});
   if(foundcart==null)
   {
    throw new ApiError(httpStatus.BAD_REQUEST,"Cart not exist for User");
   }
   
   let productindex = -1;

   for (let i = 0; i < foundcart.cartItems.length; i++) {
     if (productId == foundcart.cartItems[i].product._id) {
       productindex = i;
       break;
     }
   }
 
   if (productindex == -1) { 
     throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in cart");
   } else {
    foundcart.cartItems.splice(productindex,1);
   }
 
   await foundcart.save();
}



// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {

  const cart = await Cart.findOne({email: user.email})


  if(!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart")
  }


  if(cart.cartItems.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Cart is empty")
  }


  const isDefault = await user.hasSetNonDefaultAddress();
  if(!isDefault) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Address not set")
  }


  const totalCost = cart.cartItems.reduce((cost, item) => {
    return cost + item.product.cost * item.quantity;
  }, 0);


  if(totalCost > user.walletMoney) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User has insufficient money to process")
  }


  user.walletMoney -= totalCost;
  await user.save();


  cart.cartItems = []
  await cart.save();


  // return cart;








 /*
  console.log("THE ACTUAL USER",user);

  let hasdefault =  await user.hasSetNonDefaultAddress();
    if(!hasdefault)
    {
      throw new ApiError(httpStatus.BAD_REQUEST,"Address not set for User");
    }


  let foundcart = await Cart.findOne({email:user.email});
  let bill=0;
   if(foundcart==null)
   {
    throw new ApiError(httpStatus.NOT_FOUND,"Cart not Found");
   }
  if(foundcart.cartItems.length===0)
  {
    throw new ApiError(httpStatus.BAD_REQUEST,"Cart not exist for User");
  }
   

    
    for (let i = 0; i < foundcart.cartItems.length; i++) {
       bill = bill+ foundcart.cartItems[i].product.cost * foundcart.cartItems[i].quantity
    }
   
    // let founduser = await getUserByEmail(user.email);
    // if(!founduser)
    // {
    //   throw new ApiError(httpStatus.BAD_REQUEST,"User email not found");
    // }
    // else{
      // console.log("THE USER",founduser.walletMoney,typeof founduser,typeof founduser.walletMoney,typeof bill);
     
    if(user.walletMoney < bill)
    {
      throw new ApiError(httpStatus.BAD_REQUEST,"Wallest balance insufficient");
    }
    

      user.walletMoney = user.walletMoney - bill;
      console.log("USERRR",user);
      //await
      await user.save();
      foundcart.cartItems.splice(0,foundcart.cartItems.length);
     await  foundcart.save();
  //  return foundcart;
    

    // }
    */

    
   

  
};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
