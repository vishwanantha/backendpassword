import userModel from '../model/user.js'
import dotenv from 'dotenv'
import randomstring from  'randomstring';
import nodemailer from 'nodemailer'
import Auth from '../common/auth.js';
dotenv.config();


const getuser=async(req,res)=>{
       
     try {
           //get all the users
           let users=await userModel.find({},{password:0,randomString:0});
           res.status(200).send({
                 message:"data fetched  sucessfully",
                 users
            })
     } catch (error) {
           res.status(500).send({
                 message:"Internal servar error",
                 error:error.message
           })
     }
}
const createUser=async(req,res)=>{
     
     try {
          //hashing the password
          req.body.password= await Auth.hashPassword(req.body.password);
           let user=await userModel.create(req.body);  

          res.status(201).send({
                message:"user created sucessfully",
                user
          })

     } catch (error) {
          console.log(error);
          res.status(500).send({
               message:"Internel server Error"
          })
     }
       
}

const forgetPassword=async(req,res)=>{
     try {

          //check if user exist in the db
          let user = await userModel.findOne({email:req.body.email})
          if(user){

               const randomString = randomstring.generate({
                    length: 10,
                    charset: "alphanumeric"
               });
               // Calculate the expiration timestamp (2 minutes from the current time)
               const expirationTimestamp = Date.now() + 2 * 60 * 1000; // 2 minutes in milliseconds

               // Store the random string and its expiration time in the user's record or in the URL
               const resetLink = `${process.env.ResetUrl}/reset-password/${randomString}/${expirationTimestamp}`;
             
               //send email using nodemailer
               const transporter= nodemailer.createTransport({
                    service:"gmail",
                    auth:{
                        user:process.env.EMAIL_ID,
                        pass:process.env.EMAIL_PASS
                    }
               })
               const mailOptions={
                    from: process.env.EMAIL_ID,
                    to: user.email,
                    subject:"Password-Reset-Link",
                    text:`Click the following Link to reset your password \n ${resetLink}`
               } 

               transporter.sendMail(mailOptions,(error,info)=>{
                      if(error){
                         console.log(error);
                           res.status(500).send({
                               message:"Failed to send the password reset mail"
                           })
                      }
                      else{
                         console.log("password reset email sent" + info.response);
                         res.status(200).send({
                              message:"password reset mail sent sucessfully"
                         })

                      }
               })
               // store random string in db and send resetlink in mail
               user.randomString=randomString;
               await user.save();
               res.status(201).send({
                     message:"Reset password email sent sucessfully and random string update in db"
               })
          }
          else{
               res.status(400).send({
                     message:`user with ${req.body.email} is exists`
               })
          }

     } catch (error) {
          console.log(error);
          res.status(500).send({
               message:"Internel server Error"
          })
     }
     
}

const resetPassword = async (req, res) => {
     try {
       // get the random string and expirationTimestamp from params
       const { randomString, expirationTimestamp } = req.params;
   
       // find the user present or not using randomString
       const user = await userModel.findOne({ randomString: randomString });
   
       if (!user || user.randomString !== randomString) {

          res.status(400).send({
               message: "Invalid random string",
          });

       } else {
         // check expiration time
               if (expirationTimestamp && expirationTimestamp < Date.now()) {
                    return res.status(400).send({
                    message: "expirationTimestamp token has expired. Please request a new reset link.",
                    });
               } else {
                    // Check if req.body.newPassword is defined and not empty
                    if (req.body.newPassword) {
                         // create a new password
                         const newPassword = await Auth.hashPassword(req.body.newPassword);
               
                         // new password store in the database, and random string value changed to null
                         user.password = newPassword;
                         user.randomString = null;
                         await user.save();
               
                         res.status(201).send({
                              message: "Your new password has been updated.",
                         });
                    } else {
                         res.status(400).send({
                              message: "Invalid password provided",
                         });
                    }
               }
       }
     } catch (error) {
          console.log(error);
          res.status(500).send({
          message: "Internal server error",
          });
     }
   };
   
const login= async(req,res)=>{
        
       try {
          //check user present or exists in db
          const user= await userModel.findOne({email:req.body.email})
          if(user){
               // comapare these two  password
               const hashCompare= await Auth.hashCompare(req.body.password,user.password)
               if(hashCompare){
               res.status(201).send({
                    message:"Login sucessfull",
                    user
               }) 
               }
               else{
                    res.status(400).send({
                         message:"Invalid password"
                    })
               }
          }else{
               res.status(400).send({
                    message:`Account with ${req.body.email} does not exists`
               })
          }
          
       } catch (error) {
          console.log(error);
          res.status(500).send({
               message:"Internel server Error"
          })
       }

}


export default {
     createUser,
     forgetPassword,
     resetPassword,
     getuser,
     login
}