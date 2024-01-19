require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');
const plm= require('passport-local-mongoose');

const connectionString = process.env.DB_CONNECTION_STRING;

mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const userSchema= mongoose.Schema({
  username:{
    type:String,
    unique:true,
  },
  name:String,
  email:{
    type:String,
    unique:true,
  },
  identity:String,
  password:String,
  profileImage:String,
  bio:String,
  gender:{
    type: String,
    required:true,
  },
  phone:{
    type:Number,
    unique:true,
  },
  products:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'Product'
    }
  ],

  cart:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'Cart'
    }
  ]
    
})
userSchema.plugin(plm)
module.exports=mongoose.model("User",userSchema);