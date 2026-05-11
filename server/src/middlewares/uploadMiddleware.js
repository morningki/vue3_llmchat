import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import multer from 'multer'

// 当前文件所在目录：server/src/middlewares
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 上传文件保存目录：server/uploads
// 这里放在 server 目录下，后续可以统一加入 .gitignore，避免把用户上传文件提交到仓库
const uploadDir = path.resolve(__dirname, '../../uploads')

// 如果 uploads 目录不存在，就自动创建
// recursive: true 表示父目录不存在时也会一起创建
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 当前阶段只允许轻量 RAG 后续会用到的三类文件
const allowedExtensions = new Set(['.txt', '.md', '.pdf'])

// 限制单个文件大小：20MB
// txt / md 通常很小，pdf 可能稍大一些，先用 20MB 做学习阶段的安全上限
const maxFileSize = 20 * 1024 * 1024

// 配置 multer 的磁盘存储策略
const storage = multer.diskStorage({
  destination(req, file, callback) {
    // 告诉 multer 文件应该保存到哪个目录
    callback(null, uploadDir)
  },
  filename(req, file, callback) {
    // extname 获取原文件扩展名，例如 .pdf
    const ext = path.extname(file.originalname).toLowerCase()

    // 用时间戳和随机数生成服务端文件名，避免重名覆盖
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`

    callback(null, safeName)
  },
})

// 文件类型过滤：只根据扩展名做第一层限制
// 注意：扩展名校验不是绝对安全，后续如果进入生产环境，还应结合文件内容嗅探做更严格校验
const fileFilter = (req, file, callback) => {
  const ext = path.extname(file.originalname).toLowerCase()

  if (!allowedExtensions.has(ext)) {
    const error = new Error('Only txt, md and pdf files are allowed')
    error.code = 'INVALID_FILE_TYPE'
    callback(error)
    return
  }

  callback(null, true)
}

// 创建 multer 上传中间件
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
  },
})

// single('file') 表示前端 form-data 中的文件字段名必须叫 file
export const uploadSingleFile = upload.single('file')

// 导出上传配置，方便 controller 返回限制信息，也方便后续维护
export const uploadConfig = {
  uploadDir,
  allowedExtensions: Array.from(allowedExtensions),
  maxFileSize,
}
