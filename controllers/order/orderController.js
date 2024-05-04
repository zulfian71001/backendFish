const cartModel = require("../../models/cartModel");
const categoryModel = require("../../models/categoryModel");
const customerOrder = require("../../models/customerOrder");
const authOrderModel = require("../../models/authOrderModel");
const responseReturn = require("../../utils/response");
const moment = require("moment");

const paymentCheck = async (id)=>{
  try{
const order = await customerOrder.findById(id)
if(order.payment_method == "transfer"){
  if(order.payment_status === "unpaid"){
await customerOrder.findByIdAndUpdate(id,{
  delivery_status:"cancelled"
})
await authOrderModel.updateMany({
  orderId:id
},{
  delivery_status:"cancelled"
})
  }
}
  return true
  }
  catch(error){
console.log(error.message)
  }
}
const place_order = async (req, res) => {
    // console.log(req.body)
  const {price, products, shipping_fee, shippingInfo, userId } = req.body;
  let authorOrderData =[]
  let cartId =[]
  let payment_method = shippingInfo.payment
  const tempDate = moment(Date.now()).format("LLL")
  let customerOrderProduct = []
  for(let i = 0; i < products.length; i++){
    const pro = products[i].products
    for(let j = 0; j < pro.length; j++){
        let tempCusPro = pro[j].productInfo
        customerOrderProduct.push(tempCusPro)
        if(pro[j]._id){
            cartId.push(pro[j]._id)
        }
    }
  }
 
  try {
   const order = await customerOrder.create({
       customerId:userId,
       shippingInfo,
       products:customerOrderProduct,
       price:price + shipping_fee,
       payment_method:payment_method,
       delivery_status:"pending",
       payment_status:"unpaid",
       date: tempDate
   })
   for(let i = 0; i < products.length; i++){
    const pro = products[i].products
    const pri = products[i].price
    const sellerId = products[i].sellerId
    const shopName = products[i].shopName
    let storePro = []
    for(let j = 0; j < pro.length; j++){
        let tempPro = pro[j].productInfo
        tempPro.quantity = pro[j].quantity
        storePro.push(tempPro)

    }
    authorOrderData.push({
        orderId:order.id,
        sellerId,
        products:storePro,
        price:pri,
        payment_status:"unpaid",
        payment_method:payment_method,
        shippingInfo:shopName,
        delivery_status:"pending",
        date: tempDate
    })
  }
 await authOrderModel.insertMany(authorOrderData)
  for(let k=0; k < cartId.length; k++){
await cartModel.findByIdAndDelete(cartId[k])
  }
  setTimeout(()=>{
    paymentCheck(order.id)
  },60000)
      return responseReturn(res, 201, {
        message: "Order berhasil dibuat",
        orderId: order.id,
        order,
      });
    
  } catch (error) {
    return responseReturn(res, 500, { error: error.message });
  }
};



module.exports = { place_order };
