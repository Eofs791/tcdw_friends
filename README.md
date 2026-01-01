# friends

[吐槽大王部落格](https://www.tcdw.net) 的友情链接页面生成器。

## 提交友情链接

欢迎通过 GitHub Pull Request 提交友情链接申请：

1. Fork 本仓库
2. 编辑 `friends.toml`，在 `[[blogs]]` 或 `[[nonBlogs]]` 部分添加你的站点信息：
   ```toml
   [[blogs]]
   name = "你的站点名称"
   url = "https://your-site.com"
   avatar = "https://secure.gravatar.com/avatar/xxx?s=140&r=g"
   description = "站点简介（可选）"
   ```
3. 提交 Pull Request

### 要求

- 必须开启全站 HTTPS，且没有混入 HTTP 资源
- 头像请使用 Gravatar 或 GitHub 头像 URL
- **跟我的电波能对上**
- 拒绝采集站、内容农场、完全以 AI 生成内容为主的站点

## 开发

安装依赖：

```bash
bun install
```

预览生成的 HTML：

```bash
bun run preview
```

部署到服务器：

```bash
bun run deploy
```
