import { normalChatService, streamChatService } from '../services/chatService.js'

const isValidMessage = (message) => {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.role === 'string' &&
    typeof message.content === 'string'
  )
}

const setStreamHeaders = (res) => {
  // 告诉客户端这是 SSE / 文本流响应
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')

  // 禁止缓存，避免流式内容被浏览器或代理攒在一起
  res.setHeader('Cache-Control', 'no-cache')

  // 保持连接，便于持续写入模型输出
  res.setHeader('Connection', 'keep-alive')

  // 针对 Nginx 等代理，提示不要缓冲响应
  res.setHeader('X-Accel-Buffering', 'no')
}

const sendStreamError = (res, error) => {
  if (res.writableEnded) {
    return
  }

  res.write(
    `data: ${JSON.stringify({
      error: {
        message: error.message || '服务端处理流式响应时发生异常',
      },
    })}\n\n`,
  )

  res.end()
}

export const handleChat = async (req, res) => {
  try {
    const {
      messages,
      stream = true,
      model,
      temperature,
      max_tokens,
      top_p,
      top_k,
    } = req.body

    const isStream = stream !== false

    console.log('[chat controller] POST /api/chat', {
      isStream,
      hasMessages: Array.isArray(messages),
      messageCount: Array.isArray(messages) ? messages.length : 0,
      model,
      temperature,
      max_tokens,
      top_p,
      top_k,
    })

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'messages 参数不能为空，且必须是数组',
      })
    }

    if (!messages.every(isValidMessage)) {
      return res.status(400).json({
        code: 400,
        message: 'messages 中每一项都必须包含 role 和 content 字符串',
      })
    }

    const chatPayload = {
      messages,
      stream: isStream,
      model,
      temperature,
      max_tokens,
      top_p,
      top_k,
    }

    if (isStream) {
      setStreamHeaders(res)
      await streamChatService(chatPayload, res)
      return
    }

    const data = await normalChatService(chatPayload)
    return res.json(data)
  } catch (error) {
    console.error('[chat controller] error:', error)

    if (!res.headersSent && !res.writableEnded) {
      return res.status(500).json({
        code: 500,
        message: error.message || '聊天接口处理失败',
      })
    }

    sendStreamError(res, error)
  }
}
