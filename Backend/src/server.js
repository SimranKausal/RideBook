const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const User = require("./models/user")
require ('dotenv').config()


const authRoutes = require('./auth/authRoutes');
const rideRoutes = require('./routes/rides');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rides',rideRoutes);

app.get("/",(req,res)=>{
    res.send("RideBook Backend Running")    
})

mongoose.connect("mongodb+srv://kaushalsimran620_db_user:Simran252001@cluster0.a0fxt2w.mongodb.net/?appName=Cluster0")
.then(()=>{
console.log("MongoDB Connected")
}).catch((error)=>{
console.log("MongoDB Error:", error)
})

app.listen(5000,()=>{
    console.log("port listening on 5000")
})