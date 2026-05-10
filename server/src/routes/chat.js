import express from 'express'
import { handleChat } from '../controllers/chatController.js'

const router = express.Router()

// 统一聊天接口：POST /api/chat
router.post('/chat', handleChat)

export default router
