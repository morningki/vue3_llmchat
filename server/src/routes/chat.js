import express from 'express'
import { streamChatCompletion } from '../services/llmService.js'

// 创建聊天路由对象
const router = express.Router()

/**
 * 流式聊天接口
 *
 * 当前文件中定义的路径是：
 * POST /chat/stream
 *
 * 如果在 server/src/index.js 中这样挂载：
 * app.use('/api', chatRouter)
 * 
 * 那么最终访问路径就是：
 * POST /api/chat/stream
 */
router.post('/chat/stream', async (req, res) => {
  try {
    // 打印请求入口日志，用于确认请求是否真正进入当前接口
    console.log('【chat 路由】进入 POST /api/chat/stream 接口')

    /**
     * 从请求体中取出前端传来的参数
     *
     * messages：对话消息数组，是最核心的参数
     * model：可选，指定模型
     * temperature：可选，控制回答随机性
     * max_tokens：可选，控制最大输出长度
     * top_p / top_k：可选，采样参数
     */
    const { messages, model, temperature, max_tokens, top_p, top_k } = req.body

    // 打印请求体摘要，不直接打印完整 messages，避免日志太长
    console.log('【chat 路由】请求体摘要：', {
      hasMessages: Array.isArray(messages),
      messageCount: Array.isArray(messages) ? messages.length : 0,
      model,
      temperature,
      max_tokens,
      top_p,
      top_k,
    })

    /**
     * 第一步参数校验：
     * messages 必须是数组，并且不能为空。
     *
     * 正确格式示例：
     * {
     *   "messages": [
     *     {
     *       "role": "user",
     *       "content": "你好"
     *     }
     *   ]
     * }
     */
    if (!Array.isArray(messages) || messages.length === 0) {
      console.log('【chat 路由】参数校验失败：messages 不能为空，且必须是数组')

      return res.status(400).json({
        code: 400,
        message: 'messages 参数不能为空，且必须是数组',
      })
    }

    /**
     * 第二步参数校验：
     * messages 数组中的每一项都应该是一个对象，
     * 并且至少包含 role 和 content 两个字符串字段。
     *
     * role 常见值：
     * - user
     * - assistant
     * - system
     */
    const isValidMessages = messages.every((item) => {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.role === 'string' &&
        typeof item.content === 'string'
      )
    })

    if (!isValidMessages) {
      console.log('【chat 路由】参数校验失败：messages 内部结构不正确')

      return res.status(400).json({
        code: 400,
        message: 'messages 中每一项都必须包含 role 和 content 字符串',
      })
    }

    /**
     * 设置流式响应头
     *
     * Content-Type: text/event-stream
     * 表示当前接口不是普通 JSON 一次性返回，
     * 而是会持续返回一段一段的数据。
     */
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')

    /**
     * 禁止缓存。
     * 流式响应需要实时返回，不能被浏览器或代理服务器缓存。
     */
    res.setHeader('Cache-Control', 'no-cache')

    /**
     * 保持连接不断开。
     * 因为流式输出需要在同一个 HTTP 连接中持续返回数据。
     */
    res.setHeader('Connection', 'keep-alive')

    /**
     * 这个响应头主要用于某些 Nginx 反向代理场景。
     * 它的作用是告诉代理服务器不要缓冲响应内容。
     *
     * 本地开发阶段加不加都可以，保留也没问题。
     */
    res.setHeader('X-Accel-Buffering', 'no')

    /**
     * flushHeaders 的作用：
     * 立即把响应头发给客户端。
     *
     * 但是学习阶段建议先不要主动调用。
     * 因为一旦响应头提前发出，后面如果 API Key 错误、上游接口报错，
     * 就不能再返回普通 JSON 错误了，只能返回流式错误信息。
     *
     * 所以这里先注释掉，等你后面完全理解流式接口后再打开也可以。
     */
    // if (typeof res.flushHeaders === 'function') {
    //   res.flushHeaders()
    // }

    console.log('【chat 路由】已设置流式响应头，准备调用 llmService')

    /**
     * 调用 service 层。
     *
     * route 层只负责：
     * - 接收请求
     * - 校验参数
     * - 设置响应头
     * - 处理异常
     *
     * 真正请求大模型和转发流式数据的逻辑，
     * 放在 llmService.js 中。
     */
    await streamChatCompletion(
      {
        messages,
        model,
        temperature,
        max_tokens,
        top_p,
        top_k,
      },
      res,
    )
  } catch (error) {
    console.error('【chat 路由】接口处理异常：', error)

    /**
     * 情况 1：
     * 响应头还没有发送，并且响应也没有结束。
     *
     * 这说明还没有进入真正的流式输出阶段，
     * 所以可以安全返回普通 JSON 错误。
     */
    if (!res.headersSent && !res.writableEnded) {
      return res.status(500).json({
        code: 500,
        message: error.message || '流式聊天接口处理失败',
      })
    }

    /**
     * 情况 2：
     * 响应已经结束。
     *
     * 这说明 service 层里可能已经执行过 res.end()。
     * 这时不能再 res.write()，也不能再 res.end()。
     *
     * 否则可能会报：
     * Error [ERR_STREAM_WRITE_AFTER_END]: write after end
     */
    if (res.writableEnded) {
      console.log('【chat 路由】响应已经结束，不再重复写入错误信息')
      return
    }

    /**
     * 情况 3：
     * 响应头已经发送，但响应还没有结束。
     *
     * 这时已经不能返回普通 JSON 了，
     * 因为 HTTP 响应格式已经开始按流式方式返回。
     *
     * 所以这里只能继续按照 SSE 的格式写一条错误消息。
     */
    res.write(
      `data: ${JSON.stringify({
        error: {
          message: error.message || '服务端处理流式响应时发生异常',
        },
      })}\n\n`,
    )

    // 最后关闭响应
    res.end()
  }
})

export default router
