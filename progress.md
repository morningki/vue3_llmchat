# progress.md

## 项目阶段总览

当前项目是 Vue3 + TypeScript + Pinia + Node.js + Express 的前后端分离 LLM 对话项目。

当前主线目标：

- 前端不再直接请求大模型，改为请求 Node 后端。
- Node 后端代理大模型接口，保护 API Key。
- 后端支持 stream / non-stream 聊天代理。
- 后端支持 txt / md / 文字型 PDF 上传、文本提取、chunk 切分。
- 当前阶段优先完成前端文件上传展示闭环，RAG 闭合暂缓。

## 已完成能力

### 后端基础接口

- `GET /api/health` 已完成，用于验证 Node 服务是否启动。
- `POST /api/chat` 已完成，支持统一聊天接口。
- `/api/chat` 根据请求体 `stream` 字段区分流式和非流式。
- 大模型 API Key 已迁移到后端 `.env`，前端不再保存 API Key。
- `chatController` 负责请求校验和 stream 分支判断。
- `chatService` 负责构造上游大模型请求并转发响应。

### 后端文件上传

- `POST /api/upload` 已完成。
- 使用 `multer` 接收 `multipart/form-data`。
- 文件字段名为 `file`。
- 后端允许类型：`.txt`、`.md`、`.pdf`。
- 后端限制文件大小：20MB。
- 上传成功后返回文件基础信息、文本预览、chunk 数量、前 3 个 chunks 预览。
- 已删除上传响应中的服务器绝对路径 `path`，避免暴露本机目录结构。
- 上传错误响应已统一包含 `errorCode`。

### 文本处理

- `fileService` 已支持：
  - txt / md：使用 Node `fs` 读取文本；
  - 文字型 PDF：使用 `pdf-parse` 的 `PDFParse` 提取文本；
  - 扫描件 PDF：返回不可读提示，OCR 暂不实现。
- `textChunkService` 已支持：
  - 文本清洗；
  - chunk 切分；
  - overlap；
  - 尽量在换行、句号、问号、感叹号附近软切分。
- `retrievalService` 已支持轻量关键词检索：
  - 英文 token；
  - 中文 2~4 字短语；
  - 疑问词清理；
  - 长关键词权重；
  - 命中密度评分。

### 第 7 阶段：前端上传最小闭环

- 新增 `src/utils/uploadApi.ts`。
  - 封装 `uploadFile(file)`。
  - 使用 `FormData` 请求 `/api/upload`。
  - 不手动设置 `Content-Type`。
- 新增 `src/stores/upload.ts`。
  - 保存上传列表、当前文档、上传状态、上传错误。
- 更新 `src/types/chat.ts`。
  - 新增 `UploadedDocument`。
  - 新增 `ChunkPreview`。
  - 新增上传成功/失败响应类型。
- 重写整理 `src/components/ChatInput.vue`。
  - 文档上传按钮真实调用 `/api/upload`。
  - 只允许选择 `.txt,.md,.pdf`。
  - 前端预校验文件大小 20MB。
  - 上传中禁用文档上传和发送按钮。
  - 上传成功后展示文件名、大小、是否解析成功、chunk 数量。
  - 图片上传仍保留本地预览逻辑，不接后端。

## 当前未闭合内容

### RAG 端到端链路未闭合

已完成 RAG 前置积木：

- 文件上传；
- 文本提取；
- 文本清洗；
- chunk 切分；
- 关键词检索；
- `ragService` 草案。

尚未完成闭合：

- upload 产出的 chunks 还没有被 chat 使用。
- `/api/chat` 还没有接收 `documentId`。
- 后端还没有 `documentStore`。
- `ragService` 还没有正式接入 `chatController`。

当前建议：

- 第 7 阶段先完成前端上传展示。
- 第 8 阶段再实现后端内存 `documentStore`。
- 后续采用 `documentId` 方案，而不是让前端保存完整 chunks。

## 近期重要决策

- RAG 暂时不继续深挖 prompt 细节，当前主线回到全栈功能闭环。
- OCR 不纳入当前阶段，只作为未来增强。
- chunks 不建议长期放前端，原因是数据量大、localStorage 不适合、存在信息泄漏风险。
- 更推荐后续用后端内存 Map 做轻量 `documentStore`：
  - upload 保存 chunks；
  - 返回 `documentId`；
  - chat 请求只传 `documentId`；
  - 后端根据 `documentId` 取 chunks 做 RAG。
- 当前暂不接数据库。内存 Map 是原型阶段的轻量状态管理，后续可替换为数据库或向量库。

## 已验证内容

- `pnpm type-check` 通过。
- 后端 upload controller / route 已通过 `node --check`。
- `fileService` 曾验证可正常加载 `pdf-parse@2.x`。
- `/api/upload` 曾通过 Apifox 上传 txt 文件并返回成功结构。

注意：

- `pnpm build` 在当前 Codex 沙箱里被 `esbuild spawn EPERM` 拦截。
- 这更像沙箱权限问题，不是代码类型错误。
- 建议用户在本机终端手动运行 `pnpm build` 验证。

## 下一步建议

### 第 7 阶段继续项

1. 手动启动后端：

```bash
cd server
pnpm dev
```

2. 手动启动前端：

```bash
pnpm dev
```

3. 在页面中测试：

- 上传 `.txt`；
- 上传 `.md`；
- 上传文字型 `.pdf`；
- 上传扫描件 PDF，确认显示不可读提示；
- 上传 `.docx`，确认前端无法选择或后端拒绝；
- 上传超过 20MB 文件，确认前端拦截。

4. 让 Claude Code 对第 7 阶段前端上传接入做一次 review。

### 第 8 阶段计划

第 8 阶段建议实现后端 RAG 闭合：

- 新增 `server/src/stores/documentStore.js`。
- upload 成功后保存完整 chunks 到内存 Map。
- upload 返回 `documentId`。
- `/api/chat` 支持接收 `documentId`。
- `chatController` 根据 `documentId` 取 chunks。
- `ragService` 检索 TopK chunks 并组装 messages。
- `chatService` 使用增强后的 messages 调用大模型。

## 面试表达摘要

可以这样讲当前项目进度：

> 我把原本纯前端直连大模型的 Vue 项目改造成了 Vue + Node.js 前后端分离架构。前端通过 Vite proxy 请求 Node 后端，Node 后端使用 Express 提供 `/api/chat` 和 `/api/upload`。聊天接口由后端代理大模型请求，保护 API Key，并支持 stream / non-stream。上传接口使用 multer 接收 txt、md、文字型 PDF，后端提取文本并切分 chunks。目前前端已经接入上传接口，可以展示解析结果和 chunk 数量。RAG 端到端闭合还在下一阶段，计划使用后端内存 documentStore 返回 documentId，让 chat 阶段根据 documentId 取 chunks 做检索和上下文拼接。

