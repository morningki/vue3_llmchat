import fs from 'node:fs/promises'
import path from 'node:path'

import { PDFParse } from 'pdf-parse'

// 文本预览最大长度，避免接口一次性返回过长内容，影响调试体验
const TEXT_PREVIEW_LIMIT = 2000

// 纯文本类型：可以直接按 UTF-8 读取
const plainTextExtensions = new Set(['.txt', '.md'])

// PDF 类型：需要用 pdf-parse 提取可复制文本
const pdfExtensions = new Set(['.pdf'])

// 统一创建文本提取结果，保证 txt / md / pdf 返回结构一致
const createTextResult = ({
  readable,
  text = '',
  message,
  pageCount = null,
}) => {
  return {
    readable,

    // 完整文本：后续 RAG 阶段可以用于文本切分和检索
    text,

    // 预览文本：接口调试时只返回前 2000 个字符即可
    textPreview: text.slice(0, TEXT_PREVIEW_LIMIT),

    // 文本总长度：后续可用来判断是否需要切分 chunk
    textLength: text.length,

    // PDF 页数；txt / md 没有页数，所以默认为 null
    pageCount,

    // 给前端或调试工具看的说明信息
    message,
  }
}

const extractPlainText = async (file) => {
  // txt / md 是普通文本文件，可以直接按 UTF-8 读取
  const text = await fs.readFile(file.path, 'utf-8')

  return createTextResult({
    readable: true,
    text,
    message: '文本读取成功',
  })
}

const extractPdfText = async (file) => {
  // PDF 是二进制文件，要先读取为 Buffer
  const buffer = await fs.readFile(file.path)

  // pdf-parse v2 使用 PDFParse 类，而不是旧版的 pdf(buffer) 函数写法
  const parser = new PDFParse({
    data: buffer,
  })

  try {
    // getText 会提取文字型 PDF 中可复制的文本
    const result = await parser.getText()
    const text = result.text || ''
    const normalizedText = text.trim()

    // 如果提取不到文字，通常说明 PDF 可能是扫描件或图片型 PDF
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
    // 释放 PDF 解析器资源，避免内存占用
    await parser.destroy()
  }
}

export const extractTextFromFile = async (file) => {
  // 根据原始文件名获取扩展名，例如 .txt / .md / .pdf
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
