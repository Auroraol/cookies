function uploadCookies(domain, cookie) {
    chrome.storage.sync.get(["serverAddress"], function (result) {
        if (result.serverAddress === undefined) {
            return;
        }

        let serverUrl = result.serverAddress;
        chrome.storage.sync.get(["token"], function (result) {
            if (result.token === undefined) {
                result.token = "";
            }
            let token = result.token;

            chrome.storage.sync.get(["extraBody"], function (result) {
                let extraBody = {};
                if (result.extraBody && result.extraBody.trim() !== '') {
                    try {
                        extraBody = JSON.parse(result.extraBody);
                    } catch (e) {
                        console.error("Failed to parse extraBody:", e);
                    }
                }
                fetch(serverUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json;charset=utf-8",
                        "Authentication": token
                    },
                    body: JSON.stringify(Object.assign({
                        "cookie": cookie,
                        "domain": domain
                    }, extraBody))
                }).then(response => {
                    if (response.ok) {
                        console.log("Update cookie success for " + domain);
                    } else {
                        console.error("Update cookie failed, status: " + response.status);
                    }
                }).catch(err => {
                    console.error("Update cookie failed, err: " + err);
                });
            });
        })
    })
}

function parseRootDomain(domain) {
    return domain.split(".").reverse().splice(0, 2).reverse().join(".")
}

function matchDomain(domainFilter, hostname) {
    if (!domainFilter || domainFilter.trim() === '') {
        return true;
    }
    let filters = domainFilter.split(",").map(f => f.trim()).filter(f => f !== '');
    if (filters.length === 0) {
        return true;
    }
    return filters.some(filter => {
        let regexMatch = filter.match(/^\/(.+)\/([gimsuy]*)$/);
        if (regexMatch) {
            try {
                let regex = new RegExp(regexMatch[1], regexMatch[2]);
                return regex.test(hostname);
            } catch (e) {
                return false;
            }
        } else {
            return hostname === filter || hostname.endsWith('.' + filter);
        }
    });
}

function collectAndUpload(domain, url) {
    chrome.storage.sync.get(["domainFilter"], function (result) {
        if (!matchDomain(result.domainFilter, domain)) {
            return;
        }

        chrome.storage.sync.get(["cookieNames"], function (result) {
            if (result.cookieNames === undefined) {
                result.cookieNames = "";
            }
            let cookieNames = result.cookieNames.split(",");

            chrome.storage.sync.get(["rootDomain"], function (result) {
                if (result.rootDomain === undefined) {
                    result.rootDomain = "false";
                }
                let rootDomain = result.rootDomain === "true";
                let effectiveDomain = rootDomain ? parseRootDomain(domain) : domain;

                let effectiveUrl = url;
                try {
                    let urlObj = new URL(url);
                    if (rootDomain) {
                        urlObj.hostname = effectiveDomain;
                    }
                    effectiveUrl = urlObj.origin + "/";
                } catch (e) {}

                chrome.cookies.getAll({url: effectiveUrl}, function (cookies) {
                    console.log("cookies found: " + cookies.length + " for url: " + effectiveUrl);
                    let cookie = cookies.map((item) => parseNeedCookie(cookieNames, item))
                        .filter(value => value !== undefined)
                        .reduce((a, b) => a.concat(b), []);

                    uploadCookies(domain, JSON.stringify(cookie));
                });
            });
        });
    });
}

// 处理 content.js 发来的手动消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateAlarm") {
        setupAlarm();
        return;
    }
    collectAndUpload(request.domain, request.url);
    return true;
});

// 定时器触发：获取所有打开的 tab 的 cookie 并上传（去重）
chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name !== "cookieUpload") return;

    chrome.tabs.query({}, function (tabs) {
        let processed = new Set();
        tabs.forEach(function (tab) {
            if (tab.url && (tab.url.startsWith("http://") || tab.url.startsWith("https://"))) {
                try {
                    let url = new URL(tab.url);
                    let key = url.hostname;
                    if (!processed.has(key)) {
                        processed.add(key);
                        collectAndUpload(url.hostname, tab.url);
                    }
                } catch (e) {}
            }
        });
    });
});

// 根据设置启用/停用定时器
function setupAlarm() {
    chrome.alarms.clear("cookieUpload", function () {
        chrome.storage.sync.get(["uploadMode", "uploadInterval"], function (result) {
            if (result.uploadMode === "timer") {
                let interval = Math.max(parseInt(result.uploadInterval) || 30, 10);
                let periodInMinutes = interval / 60;
                chrome.alarms.create("cookieUpload", { periodInMinutes: periodInMinutes });
                console.log("Alarm set: every " + interval + " seconds");
            } else {
                console.log("Alarm cleared: manual mode");
            }
        });
    });
}

// 启动时初始化定时器
setupAlarm();

function filterCookies(cookieRegex, cookie) {
    let cookieName = cookie.name;
    let trimmed = cookieRegex.trim();
    let regexMatch = trimmed.match(/^\/(.+)\/([gimsuy]*)$/);

    if (regexMatch) {
        try {
            let regex = new RegExp(regexMatch[1], regexMatch[2]);
            return regex.test(cookieName);
        } catch (e) {
            console.error("Invalid regex:", trimmed, e);
            return false;
        }
    } else {
        return trimmed === cookieName;
    }
}

function toCookieString(cookie) {
    let cookieObject = {}
    cookieObject.domain = cookie.domain;
    cookieObject.name = cookie.name;
    cookieObject.value = cookie.value;
    return cookieObject;
}

function parseNeedCookie(cookieNames, cookie) {
    if (cookieNames.length > 0) {
        if (cookieNames[0] === "*") {
            return [toCookieString(cookie)];
        } else {
            return cookieNames.filter(name => filterCookies(name, cookie))
                .map(name => toCookieString(cookie));
        }
    }
}
