# Cookie 接收后端服务

这是一个简单的 Node.js 后端服务，用于接收 Chrome 扩展发送的 Cookie 数据。

## 使用方法

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 启动服务器

```bash
npm start
```

或者使用开发模式（支持自动重启）：

```bash
npm run dev
```

### 3. 配置 Chrome 扩展

- 打开 Chrome 扩展的设置页面
- 在 "Server Address" 中输入：`http://localhost:8080/cookies`
- 可选：配置 Authentication Token、Cookie Names 等
- 点击保存

### 4. 测试

访问任意网站，后端会在控制台打印接收到的请求信息。

## 输出示例

```
服务器运行在 http://localhost:8080
等待接收 Cookie 数据...
========== 收到请求 ==========
时间: 2026-05-14T10:30:45.123Z
请求头: {
  "authentication": "mytoken123",
  "content-type": "application/json;charset=utf-8"
}
请求体: {
  "cookie": "[{\"domain\":\".example.com\",\"name\":\"sessionId\",\"value\":\"abc123\"}]",
  "domain": "example.com"
}
解析后的 Cookies:
  [0] 域名: .bilibili.com, 名称: buvid3, 值: 2DBF7A6C-2B02
================================
```
