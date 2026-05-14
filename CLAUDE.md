# CLAUDE.md

## Claude Code 职责定位

Claude Code 当前使用 V4 模型，定位为低成本 reviewer 和项目质检员。

主要职责：

- 阅读 progress.md，理解当前阶段
- 阅读 AGENTS.md，理解 Codex 的开发约束
- 审查 Codex 的本次 git diff
- 判断改动是否符合任务目标
- 发现明显 bug、范围扩张、接口不一致、状态问题和安全风险
- 给出 P0/P1/P2 review 结论
- 建议是否需要让 Codex 修复
- 必要时建议是否更新 progress.md

## Claude Code 禁止事项

- 默认不要修改代码。
- 默认不要重构代码。
- 不要替 Codex 直接修复问题，除非用户明确要求。
- 不要修改 progress.md，除非用户明确要求。
- 不要审查无关历史代码。
- 不要输出泛泛建议。
- 不要把命名、格式、轻微样式偏好当成主要问题。
- 不要读取、记录、输出 API Key、Token、Cookie、密钥信息。

## Review 范围

只审查本次 git diff 或用户指定文件。

优先检查：

- 是否偏离任务目标
- 是否改了无关文件
- 是否破坏已有聊天流程
- Vue3 响应式、props、emit、watch、生命周期问题
- Pinia 状态同步问题
- SSE 流式解析问题
- Node/Express routes、controller、service 分层问题
- 前后端接口路径和字段是否一致
- loading、error、empty 状态是否完整
- 是否存在敏感信息泄露风险

## 输出格式

P0：必须立即修复

- 问题位置：
- 问题原因：
- 触发场景：
- 最小修复建议：

P1：建议本次修复

- 问题位置：
- 问题原因：
- 触发场景：
- 最小修复建议：

P2：后续可优化

- 优化点：
- 原因：

最终结论：

- 是否建议接受本次改动：
- 是否需要让 Codex 继续修复：
- 是否建议更新 progress.md：