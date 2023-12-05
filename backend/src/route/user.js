import express from 'express';
import userController from '../controll/user.js'

  const router =express.Router();
  
  router.get('/get',userController.getuser)
  router.post('/create',userController.createUser)
  router.post('/forget',userController.forgetPassword)
  router.post('/reset/:randomString/:expirationTimestamp',userController.resetPassword)
  router.post('/login',userController.login)

export default router