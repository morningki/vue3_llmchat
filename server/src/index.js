import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import chatRouter from './routes/chat.js'
import healthRouter from './routes/health.js'
import uploadRouter from './routes/upload.js'

// 读取 server/.env 中的环境变量，例如 PORT、FRONTEND_ORIGIN、LLM_API_KEY
dotenv.config()

// 创建 Express 应用实例，它就是我们的后端服务器对象
const app = express()

// 从环境变量读取端口和前端地址；没有配置时使用本地开发默认值
const PORT = process.env.PORT || 3000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

// 配置跨域，允许 Vite 前端访问 Node 后端
app.use(cors({
  origin: FRONTEND_ORIGIN,
}))

// 解析 application/json 请求体，聊天接口会用到
app.use(express.json())

// 统一挂载 API 路由：
// GET  /api/health  用于健康检查
// POST /api/chat    用于大模型聊天代理
// POST /api/upload  用于文件上传
app.use('/api', healthRouter)
app.use('/api', chatRouter)
app.use('/api', uploadRouter)

// 访问不存在的接口时，统一返回 404，方便前端和 Apifox 排查路径问题
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'API not found',
  })
})

// 启动后端服务
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
