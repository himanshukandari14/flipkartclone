const { default: mongoose } = require("mongoose");

const productSchema = mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required:true }, 
    price: { type: Number, required: true },
    categoryId: mongoose.Types.ObjectId,
    category:{type:String, required:true},
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

    module.exports=mongoose.model("Product",productSchema);