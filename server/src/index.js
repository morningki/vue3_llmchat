// 1. 导入需要的包
import express from 'express'    // 后端框架
import cors from 'cors'          // 解决跨域
import dotenv from 'dotenv'      // 读取 .env 环境变量
import healthRouter from './routes/health.js'  // 导入健康检查接口

dotenv.config() // 让 .env 文件生效

const app = express() // 创建服务器实例

// 从环境变量读取 端口 和 前端地址
const PORT = process.env.PORT || 3000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

// 配置跨域：只允许你的前端访问
app.use(cors({
  origin: FRONTEND_ORIGIN
}))

// 让服务器能接收 JSON 格式数据
app.use(express.json())

// 挂载接口：访问 /api/health 就能用
app.use('/api', healthRouter)

// 访问不存在的接口 → 返回404
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'API not found'
  })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
