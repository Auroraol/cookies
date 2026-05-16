function uploadCookies(domain, cookie) {
    chrome.storage.sync.get(["serverAddress"], function (result) {
        console.log("serverAddress: " + JSON.stringify(result));
        if (result.serverAddress === undefined) {
            return;
        }

        let serverUrl = result.serverAddress;
        chrome.storage.sync.get(["token"], function (result) {
            console.log("token: " + JSON.stringify(result));
            if (result.token === undefined) {
                result.token = "";
            }
            let token = result.token;

            chrome.storage.sync.get(["extraBody"], function (result) {
                console.log("extraBody: " + JSON.stringify(result));
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
                        console.log("Update cookie success");
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    chrome.storage.sync.get(["domainFilter"], function (result) {
        if (!matchDomain(result.domainFilter, request.domain)) {
            console.log("Domain not matched, skip: " + request.domain);
            return;
        }

        chrome.storage.sync.get(["cookieNames"], function (result) {
            if (result.cookieNames === undefined) {
                result.cookieNames = "";
            }
            let cookieNames = result.cookieNames.split(",");

            chrome.storage.sync.get(["rootDomain"], function (result) {
            console.log("rootDomain: " + JSON.stringify(result));
            if (result.rootDomain === undefined) {
                result.rootDomain = "false";
            }
            let domain = request.domain
            let rootDomain = result.rootDomain === "true";
            if (rootDomain) {
                domain = parseRootDomain(domain)
            }

            let url = request.url;
            try {
                let urlObj = new URL(request.url);
                if (rootDomain) {
                    urlObj.hostname = domain;
                }
                url = urlObj.origin + "/";
            } catch (e) {}

            chrome.cookies.getAll({url: url}, function (cookies) {
                console.log("cookies found: " + cookies.length + " for url: " + url);
                let cookie = cookies.map((item) => parseNeedCookie(cookieNames, item))
                    .filter(value => value !== undefined)
                    .reduce((a, b) => a.concat(b), []);

                uploadCookies(request.domain, JSON.stringify(cookie))
            });
        });
        });
    });

    return true;
});


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
