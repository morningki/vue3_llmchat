import path from 'node:path'

import { uploadConfig } from '../middlewares/uploadMiddleware.js'
import { extractTextFromFile } from '../services/fileService.js'

// 上传成功后的业务处理函数
// multer 会先解析 multipart/form-data，并把文件信息挂到 req.file 上
export const handleUpload = async(req, res) => {
  const file = req.file

  if (!file) {
    return res.status(400).json({
      code: 400,
      message: 'No file uploaded. Please use form-data field name "file".',
    })
  }

  try {
    // 调用 service 层读取 txt / md 文本内容
    const textResult = await extractTextFromFile(file)

    return res.json({
      code: 200,
      message: 'File uploaded successfully',
      data: {
        originalName: file.originalname,
        filename: file.filename,
        extension: path.extname(file.originalname).toLowerCase(),
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,

        // 文本是否在当前阶段可读取
        readable: textResult.readable,

        // 文本预览，不直接返回超长全文，方便调试
        textPreview: textResult.textPreview,

        // 原始文本长度
        textLength: textResult.textLength,

        // 读取说明
        textMessage: textResult.message,
        pageCount: textResult.pageCount,


        limits: {
          allowedExtensions: uploadConfig.allowedExtensions,
          maxFileSize: uploadConfig.maxFileSize,
        },
      },
    })
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Failed to extract text from uploaded file',
      error: error.message,
    })
  }
}
