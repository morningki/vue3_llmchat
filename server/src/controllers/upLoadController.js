import path from 'node:path'

import { uploadConfig } from '../middlewares/uploadMiddleware.js'
import { extractFileTextAndChunks } from '../services/fileService.js'

export const handleUpload = async (req, res) => {
  const file = req.file

  if (!file) {
    return res.status(400).json({
      code: 400,
      message: 'No file uploaded. Please use form-data field name "file".',
    })
  }

  try {
    const textResult = await extractFileTextAndChunks(file)

    return res.json({
      code: 200,
      message: 'File uploaded successfully',
      data: {
        originalName: file.originalname,
        filename: file.filename,
        extension: path.extname(file.originalname).toLowerCase(),
        mimeType: file.mimetype,
        size: file.size,

        readable: textResult.readable,
        textPreview: textResult.textPreview,
        textLength: textResult.textLength,
        textMessage: textResult.message,
        pageCount: textResult.pageCount,

        // 当前只返回 chunk 统计和前 3 个预览，避免上传响应过大。
        chunkCount: textResult.chunks.length,
        chunksPreview: textResult.chunks.slice(0, 3),

        limits: {
          allowedExtensions: uploadConfig.allowedExtensions,
          maxFileSize: uploadConfig.maxFileSize,
        },
      },
    })
  } catch (error) {
    console.error('[upload controller] error:', error)

    return res.status(500).json({
      code: 500,
      message: 'Failed to extract text from uploaded file',
      error: error.message,
      errorCode: 'TEXT_EXTRACTION_FAILED',
    })
  }
}
