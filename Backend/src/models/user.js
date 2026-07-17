const mongoose = require ("mongoose")

const userSchema = mongoose.Schema({

fullname:{
    type:String,
    default: "",
},

email:{
    type:String,
    default: "",
},

phone:{
type:String,
required:true,
unique:true
},

homeAddress:{
type:String,
default:''
},

workAddress:{
    type:String,
    default:''
  },
  fcmToken: {
    type: String,
    default: ''
  }
}, {
    timestamps:true
})

// ✅ This checks the existing models pool first before compiling a new one
module.exports = mongoose.models.User || mongoose.model('User', userSchema);