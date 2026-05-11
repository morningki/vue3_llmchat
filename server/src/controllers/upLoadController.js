import path from 'node:path'

import { uploadConfig } from '../middlewares/uploadMiddleware.js'

// 上传成功后的业务处理函数
// multer 会先解析 multipart/form-data，并把文件信息挂到 req.file 上
export const handleUpload = (req, res) => {
  const file = req.file

  if (!file) {
    return res.status(400).json({
      code: 400,
      message: 'No file uploaded. Please use form-data field name "file".',
    })
  }

  return res.json({
    code: 200,
    message: 'File uploaded successfully',
    data: {
      // 用户上传时的原始文件名
      originalName: file.originalname,

      // 后端保存后的文件名，避免重名覆盖
      filename: file.filename,

      // 文件扩展名，例如 .txt / .md / .pdf
      extension: path.extname(file.originalname).toLowerCase(),

      // 浏览器或客户端声明的文件类型
      mimeType: file.mimetype,

      // 文件大小，单位是 byte
      size: file.size,

      // 文件在服务端磁盘中的保存路径
      path: file.path,

      // 返回当前上传限制，方便前端后续展示提示
      limits: {
        allowedExtensions: uploadConfig.allowedExtensions,
        maxFileSize: uploadConfig.maxFileSize,
      },
    },
  })
}
