import express from 'express'
const router = express.Router()

router.get('/health',(req,res) =>{
  res.json({
    code:200,
    message:'Node server is running',
    time:new Date().toISOString()
  })
})

export default router
