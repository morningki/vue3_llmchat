import fs from 'node:fs/promises'
import path from 'node:path'

import { PDFParse } from 'pdf-parse'
import { splitTextIntoChunks } from './textChunkService.js'

// 文本预览最大长度，避免接口一次性返回过长内容，影响调试体验。
const TEXT_PREVIEW_LIMIT = 2000

// 纯文本类型可以直接按 UTF-8 读取。
const plainTextExtensions = new Set(['.txt', '.md'])

// PDF 需要用 pdf-parse 提取可复制文本。
const pdfExtensions = new Set(['.pdf'])

const DEFAULT_FILE_CHUNK_OPTIONS = {
  chunkSize: 800,
  chunkOverlap: 100,
}

const createTextResult = ({
  readable,
  text = '',
  message,
  pageCount = null,
}) => {
  return {
    readable,
    text,
    textPreview: text.slice(0, TEXT_PREVIEW_LIMIT),
    textLength: text.length,
    pageCount,
    message,
  }
}

const extractPlainText = async (file) => {
  const text = await fs.readFile(file.path, 'utf-8')

  return createTextResult({
    readable: true,
    text,
    message: '文本读取成功',
  })
}

const extractPdfText = async (file) => {
  const buffer = await fs.readFile(file.path)

  // pdf-parse v2 使用 PDFParse 类，而不是旧版 pdf(buffer) 函数写法。
  const parser = new PDFParse({
    data: buffer,
  })

  try {
    const result = await parser.getText()
    const text = result.text || ''
    const normalizedText = text.trim()

    if (!normalizedText) {
      return createTextResult({
        readable: false,
        text: '',
        pageCount: result.total || null,
        message: 'PDF 未提取到文本，可能是扫描件或图片型 PDF，后续可接入 OCR',
      })
    }

    return createTextResult({
      readable: true,
      text,
      pageCount: result.total || null,
      message: 'PDF 文本读取成功',
    })
  } finally {
    // 无论解析成功还是失败，都释放 PDF 解析器资源。
    await parser.destroy()
  }
}

export const extractTextFromFile = async (file) => {
  const extension = path.extname(file.originalname).toLowerCase()

  if (plainTextExtensions.has(extension)) {
    return extractPlainText(file)
  }

  if (pdfExtensions.has(extension)) {
    return extractPdfText(file)
  }

  return createTextResult({
    readable: false,
    text: '',
    message: '当前文件类型暂不支持文本读取',
  })
}

export const extractFileTextAndChunks = async (
  file,
  chunkOptions = DEFAULT_FILE_CHUNK_OPTIONS,
) => {
  const textResult = await extractTextFromFile(file)
  const chunks = textResult.readable
    ? splitTextIntoChunks(textResult.text, chunkOptions)
    : []

  return {
    ...textResult,
    chunks,
  }
}
