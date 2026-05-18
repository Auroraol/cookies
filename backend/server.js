const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const cookieStore = {};

app.post('/cookies', (req, res) => {
    const domain = req.body.domain;
    console.log('========== 收到请求 ==========');
    console.log('时间:', new Date().toISOString());
    console.log('请求头:', JSON.stringify(req.headers, null, 2));
    console.log('请求体:', JSON.stringify(req.body, null, 2));

    if (req.body.cookie) {
        try {
            const cookies = JSON.parse(req.body.cookie);
            cookieStore[domain] = {
                cookies: cookies,
                updatedAt: Date.now()
            };
            console.log(`解析后的 Cookies (共 ${cookies.length} 个):`);
            cookies.forEach((cookie, index) => {
                console.log(`  [${index}] 域名: ${cookie.domain}, 名称: ${cookie.name}, 值: ${cookie.value}`);
            });
            console.log('\n完整 Cookie 字符串:');
            console.log(cookies.map(c => `${c.name}=${c.value}`).join('; '));
        } catch (e) {
            console.log('Cookie 解析失败:', e.message);
        }
    }

    console.log('================================\n');
    res.json({ status: 'success' });
});

app.get('/cookies', (req, res) => {
    const domain = req.query.domain;

    if (domain) {
        const entry = cookieStore[domain];
        if (!entry) return res.status(404).json({ error: 'domain not found' });
        return res.type('text').send(toCookieString(entry.cookies));
    }

    const latest = Object.entries(cookieStore)
        .sort((a, b) => b[1].updatedAt - a[1].updatedAt)[0];

    if (!latest) return res.status(404).json({ error: 'no cookies yet' });
    res.type('text').send(toCookieString(latest[1].cookies));
});

app.get('/cookies/all', (req, res) => {
    const result = {};
    for (const [domain, entry] of Object.entries(cookieStore)) {
        result[domain] = {
            cookieString: toCookieString(entry.cookies),
            count: entry.cookies.length,
            updatedAt: new Date(entry.updatedAt).toISOString()
        };
    }
    res.json(result);
});

function toCookieString(cookies) {
    return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`\n用法:`);
    console.log(`  GET /cookies          - 获取最近更新的 Cookie（纯文本，直接用）`);
    console.log(`  GET /cookies?domain=x - 获取指定域名的 Cookie`);
    console.log(`  GET /cookies/all      - 查看所有域名的 Cookie`);
});
