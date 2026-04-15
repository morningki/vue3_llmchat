export const messageHandler = {
  formatMessage(role, content, reasoning_content = '', files = []) {
    return {
      id: Date.now(),
      role,
      content,
      reasoning_content,
      files,
      completion_tokens: 0,
      speed: 0,
      loading: false,
    }
  },

  // 处理流式响应
  async handleStreamResponse(response, updateCallback) {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    let accumulatedContent = ''
    let accumulatedReasoning = ''
    let startTime = Date.now()

    // 用来缓存“上一次没读完整的内容”
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      // 流结束时，把 decoder 里剩余的内容也冲出来
      if (done) {
        buffer += decoder.decode()
        break
      }

      // 这里用 stream: true，表示后面还有数据
      buffer += decoder.decode(value, { stream: true })

      // 按换行拆分
      const lines = buffer.split(/\r?\n/)

      // 最后一项可能是不完整的，先留到下一轮
      buffer = lines.pop() || ''

      for (const rawLine of lines) {
        const line = rawLine.trim()

        // 跳过空行
        if (!line) continue

        // 跳过结束标记
        if (line === 'data: [DONE]') continue

        // 只处理 data: 开头的行
        if (!line.startsWith('data: ')) continue

        try {
          // 注意这里更严谨应该 slice(6)，因为 'data: ' 有 6 个字符
          const data = JSON.parse(line.slice(6))

          const content = data.choices?.[0]?.delta?.content || ''
          const reasoning = data.choices?.[0]?.delta?.reasoning_content || ''

          accumulatedContent += content
          accumulatedReasoning += reasoning

          updateCallback(
            accumulatedContent,
            accumulatedReasoning,
            data.usage?.completion_tokens || 0,
            (
              (data.usage?.completion_tokens || 0) /
              ((Date.now() - startTime) / 1000 || 1)
            ).toFixed(2),
          )
        } catch (error) {
          console.error('解析流式数据失败：', line, error)
        }
      }
    }

    // 循环结束后，buffer 里可能还残留最后一行
    const finalLine = buffer.trim()
    if (
      finalLine &&
      finalLine !== 'data: [DONE]' &&
      finalLine.startsWith('data: ')
    ) {
      try {
        const data = JSON.parse(finalLine.slice(6))

        const content = data.choices?.[0]?.delta?.content || ''
        const reasoning = data.choices?.[0]?.delta?.reasoning_content || ''

        accumulatedContent += content
        accumulatedReasoning += reasoning

        updateCallback(
          accumulatedContent,
          accumulatedReasoning,
          data.usage?.completion_tokens || 0,
          (
            (data.usage?.completion_tokens || 0) /
            ((Date.now() - startTime) / 1000 || 1)
          ).toFixed(2),
        )
      } catch (error) {
        console.error('解析最后残留数据失败：', finalLine, error)
      }
    }
  },

  // 处理非流式响应
  handleNormalResponse(response, updateCallback) {
    updateCallback(
      response.choices[0].message.content,
      response.choices[0].message.reasoning_content || '',
      response.usage.completion_tokens,
      response.speed,
    )
  },

  // 统一的响应处理函数
  async handleResponse(response, isStream, updateCallback) {
    if (isStream) {
      await this.handleStreamResponse(response, updateCallback)
    } else {
      this.handleNormalResponse(response, updateCallback)
    }
  },
}
