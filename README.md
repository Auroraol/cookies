# Cookie 浏览器扩展

访问指定网站时自动获取 Cookie，发送给后端服务，供脚本调用。

## 使用场景

工作中经常需要脚本访问网站 API，这些 API 需要 Cookie 鉴权。手动复制 Cookie 麻烦且会过期，模拟登录又太复杂。这个扩展在你正常浏览网页时自动把 Cookie 同步到本地服务端，脚本直接从服务端取最新的 Cookie 即可。

## 安装

### 1. 安装扩展

1. 打开 `chrome://extensions`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」，选择项目根目录
4. 在扩展详情中，将「网站访问权限」设置为 **在所有网站上**

### 2. 启动后端

```bash
cd backend
npm install
node server.js
```

![image-20260517005903699](C:/Users/16658/AppData/Roaming/Typora/typora-user-images/image-20260517005903699.png)

![image-20260517005927804](C:/Users/16658/AppData/Roaming/Typora/typora-user-images/image-20260517005927804.png)

![image-20260517011958859](C:/Users/16658/AppData/Roaming/Typora/typora-user-images/image-20260517011958859.png)

## 扩展配置

点击扩展图标，弹出配置面板：

| 字段 | 说明 | 示例 |
|------|------|------|
| 服务器地址 | 后端接收 Cookie 的地址 | `http://localhost:8080/cookies` |
| 鉴权 Token | 附加在请求头 `Authentication` 中（可选） | |
| 监听域名 | 只在这些域名触发上传，留空=所有网站 | `taobao.com,jd.com` |
| Cookie 名称 | 要抓取的 Cookie，`*` 表示全部 | `*` |
| 获取根域名 Cookie | 是否获取父域名下的 Cookie | 是 |
| 额外请求体 | 合并到请求 body 的 JSON（可选） | `{"app":"my-script"}` |

### 监听域名格式

- 精确匹配：`taobao.com`（自动匹配所有子域名如 `work.open.taobao.com`）
- 不需要匹配路径。同一个域名下所有路径用的是同一套 Cookie。
- 正则匹配：`/taobao\.com$/`
- 多个用逗号分隔：`taobao.com,tmall.com`
- 留空：监听所有网站

### Cookie 名称格式

- `*` — 抓取所有 Cookie（推荐，确保接口能用）
- 精确名称：`_tb_token_,cookie2,unb`
- 正则：`/token/i,/^_m_h5_tk/`
- 混合使用：`/token/i,cookie2,unb,sgcookie,/^_m_h5_tk/,cna,skt,isg`

## 后端 API

### 接收 Cookie（扩展自动调用）

```
POST /cookies
```

### 获取 Cookie

```bash
# 获取最近更新的 Cookie（纯文本，直接可用）
curl http://localhost:8080/cookies

# 获取指定域名的 Cookie
curl http://localhost:8080/cookies?domain=work.open.taobao.com

# 查看所有域名
curl http://localhost:8080/cookies/all
```

示例:

![image-20260517005428515](C:/Users/16658/AppData/Roaming/Typora/typora-user-images/image-20260517005428515.png)

## 后端部署

```dockerfile
方案 A：把它们放到同一个 Docker 网络（推荐）

  # 查看 openclaw-gateway 用的网络
  docker inspect openclaw-gateway --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'

  # 把你的 cookie-server 也加入那个网络，修改 docker-compose.yml：

  修改 docker-compose.yml：

  services:
    cookie-server:
      build: ./backend  #根据 build: ./backend 找到 backend/Dockerfile，自动 build 
      ports:
        - "8080:8080"
      restart: unless-stopped
      networks:
        - openclaw-net

  networks:
    openclaw-net:
      external: true   # 使用 openclaw-gateway 已有的网络

  然后在你的代码里用容器名访问：http://openclaw-gateway:18789

```

```
docker-compose up -d --build  每次都重新构建镜像再启动
```

![image-20260518225918856](C:/Users/16658/AppData/Roaming/Typora/typora-user-images/image-20260518225918856.png)

```
  │ cookie-server    │ openclaw-gateway │ http://openclaw-gateway:18789 
  │ openclaw-gateway │ cookie-server    │ http://cookie-server:8080    
```

使用

```
curl http://cookie-server:8080/cookies/all   
```

![image-20260518231357612](C:/Users/16658/AppData/Roaming/Typora/typora-user-images/image-20260518231357612.png)

## 使用示例

### 在 curl 中使用

```bash
curl "https://example.com/api/list?page=1" \
  -H "Cookie: $(curl -s http://localhost:8080/cookies)"
```

### 在脚本中使用（Node.js）

```javascript
const cookieResp = await fetch('http://localhost:8080/cookies');
const cookie = await cookieResp.text();

const data = await fetch('https://example.com/api/list?page=1', {
    headers: { 'Cookie': cookie }
});
```

### 在脚本中使用（Python）

```python
import requests

cookie = requests.get('http://localhost:8080/cookies').text

resp = requests.get('https://example.com/api/list?page=1',
                    headers={'Cookie': cookie})
```

## 工作原理

1. 浏览器访问配置的目标网站
2. 扩展 content script 触发，发送域名信息给 background service worker
3. Service worker 检查域名是否匹配监听配置
4. 匹配则通过 `chrome.cookies` API 获取该域名的 Cookie
5. 按配置的 Cookie 名称过滤后，POST 到后端服务器
6. 后端存储 Cookie，脚本通过 GET 接口获取最新值

## 注意事项

- Cookie 会过期，扩展在每次页面加载时自动更新，保持浏览器打开即可
- 如果接口返回 401，先把 Cookie 名称改为 `*` 排查是否遗漏了必要字段
- 后端 Cookie 存储在内存中，重启后需要刷新网页重新获取
