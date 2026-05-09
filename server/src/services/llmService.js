/**
 * 调用上游大模型的流式聊天接口
 * 这里不直接返回完整 JSON，而是把上游返回的数据块持续写给前端
 */
export async function streamChatCompletion(payload, res) {
  // 从环境变量中读取大模型接口地址和 API Key
  const API_KEY = process.env.LLM_API_KEY
  const BASE_URL = process.env.LLM_BASE_URL || 'https://api.siliconflow.cn/v1'
  const DEFAULT_MODEL = process.env.LLM_MODEL || 'deepseek-ai/DeepSeek-R1'

  // 标记 service 层开始执行，确认请求已经从路由层进入业务层
  console.log('【llmService】开始执行 streamChatCompletion')

  // 打印环境变量读取情况，注意这里只打印是否存在，不输出真实密钥
  console.log('【llmService】环境变量检查：', {
    hasApiKey: !!API_KEY,
    baseUrl: BASE_URL,
    defaultModel: DEFAULT_MODEL,
  })

  // 如果没有配置 API Key，直接抛错，交给上层统一处理
  if (!API_KEY) {
    console.log('【llmService】缺少 LLM_API_KEY，无法请求上游模型接口')
    throw new Error('缺少 LLM_API_KEY 环境变量配置')
  }

  // 组装请求体，这里强制 stream: true，因为当前接口专门用于流式代理
  const requestBody = {
    model: payload.model || DEFAULT_MODEL,
    messages: payload.messages,
    stream: true,
    temperature: payload.temperature ?? 0.7,
    max_tokens: payload.max_tokens ?? 4096,
    top_p: payload.top_p ?? 0.7,
    top_k: payload.top_k ?? 50,
  }

  // 打印发往上游接口的请求摘要，帮助确认最终发送的参数是否正确
  console.log('【llmService】准备请求上游接口，请求体摘要：', {
    model: requestBody.model,
    messageCount: Array.isArray(requestBody.messages) ? requestBody.messages.length : 0,
    stream: requestBody.stream,
    temperature: requestBody.temperature,
    max_tokens: requestBody.max_tokens,
    top_p: requestBody.top_p,
    top_k: requestBody.top_k,
  })

  // 打印上游接口地址，便于确认请求是否发到了正确的目标
  console.log('【llmService】请求上游地址：', `${BASE_URL}/chat/completions`)

  let response

  try {
    // 请求上游大模型接口
    response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    // 打印上游响应状态码，快速判断是本地路由问题还是第三方平台问题
    console.log('【llmService】上游响应状态码：', response.status)

    // 如果上游接口返回非 2xx，读取错误文本并打印，便于直接看到平台报错
    if (!response.ok) {
      const errorText = await response.text()
      console.error('【llmService】上游接口返回错误：', errorText)
      throw new Error(`上游大模型接口请求失败：${response.status} - ${errorText}`)
    }

    // 上游必须返回可读流，否则无法进行流式转发
    if (!response.body) {
      throw new Error('上游接口未返回可读流 response.body')
    }

    // 上游流可读时打印日志，说明后续将进入逐块转发阶段
    console.log('【llmService】上游已返回可读流，开始转发给前端')

    // 获取可读流 reader
    const reader = response.body.getReader()

    // 统计本次转发的数据块数量，帮助观察流是否持续进行
    let chunkCount = 0

    try {
      while (true) {
        // 持续从上游读取数据块
        const { done, value } = await reader.read()

        // done 为 true 表示流已经读取完成
        if (done) {
          console.log(`【llmService】流式响应结束，共转发 ${chunkCount} 个数据块`)
          break
        }

        // 每收到一个数据块就累加一次，方便观察流式返回是否正常推进
        chunkCount += 1
        console.log(`【llmService】已转发第 ${chunkCount} 个数据块`)

        // 将 Uint8Array 数据块原样写回给前端
        res.write(value)
      }
    } catch (error) {
      // 流读取或流转发阶段的异常日志，帮助定位卡在上游读取还是下游写出
      console.error('【llmService】流式转发异常：', error)
      throw error
    } finally {
      // 无论正常结束还是异常中断，最终都关闭响应
      console.log('【llmService】准备结束本次响应')
      res.end()
    }
  } catch (error) {
    // service 层统一异常日志，帮助定位是环境变量、上游请求还是流处理问题
    console.error('【llmService】执行异常：', error)
    throw error
  }
}
