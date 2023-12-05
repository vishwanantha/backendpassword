import express from 'express';
import dotenv from 'dotenv';
import AppRouters from './src/route/index.js'
import cors from 'cors'
dotenv.config();
//const PORT=process.env.PORT
const app= express();
app.use(cors())
app.use(express.json())
app.use('/', AppRouters)
const PORT=6000
app.listen(PORT,()=>console.log(`app is listening port ${PORT}` ))