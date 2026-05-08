/**
 * 检查 Node 后端服务是否正常运行
 *
 * 前端调用的是 /api/health
 * 但由于 vite.config.js 中配置了 proxy，
 * 所以开发环境下它会被转发到：
 * http://localhost:3000/api/health
 */
export async function checkServerHealth() {
  const response = await fetch('/api/health')

  /**
   * response.ok 表示 HTTP 状态码是否在 200-299 范围内
   * 如果后端返回 404、500 等错误，这里会进入判断
   */
  if (!response.ok) {
    throw new Error(`后端服务请求失败，状态码：${response.status}`)
  }

  /**
   * 将后端返回的 JSON 字符串解析成 JavaScript 对象
   */
  const data = await response.json()

  return data
}
