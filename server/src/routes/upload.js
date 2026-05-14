import express from 'express'
import multer from 'multer'

import { handleUpload } from '../controllers/upLoadController.js'
import { uploadSingleFile } from '../middlewares/uploadMiddleware.js'

const router = express.Router()

// POST /api/upload
// 前端或 Apifox 需要使用 multipart/form-data，并且文件字段名必须叫 file
router.post('/upload', (req, res) => {
  uploadSingleFile(req, res, (error) => {
    if (error) {
      // multer 自带错误：例如文件超过 limits.fileSize
      if (error instanceof multer.MulterError) {
        return res.status(400).json({
          code: 400,
          message: 'Upload failed',
          error: error.message,
          errorCode: error.code || 'MULTER_ERROR',
        })
      }

      // 自定义错误：例如文件扩展名不是 txt / md / pdf
      return res.status(400).json({
        code: 400,
        message: 'Upload failed',
        error: error.message,
        errorCode: error.code || 'UNKNOWN_ERROR',
      })
    }

    // 文件解析成功后，交给 controller 组织响应数据
    return handleUpload(req, res)
  })
})

export default router
