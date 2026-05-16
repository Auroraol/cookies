function saveSettings() {
    let serverAddress = document.getElementById("serverAddress").value;
    let cookieNames = document.getElementById("cookieNames").value;
    let token = document.getElementById("token").value;
    let extraBody = document.getElementById("extraBody").value;
    let rootDomain = document.getElementById("rootDomain").value;
    let domainFilter = document.getElementById("domainFilter").value;

    chrome.storage.sync.set({
        "serverAddress": serverAddress
    }, function () {
        console.log("Save serverAddress completed")
    });
    chrome.storage.sync.set({
        "cookieNames": cookieNames
    }, function () {
        console.log("Save cookieNames completed")
    });
    chrome.storage.sync.set({
        "token": token
    }, function () {
        console.log("Save token completed")
    });
    chrome.storage.sync.set({
        "extraBody": extraBody
    }, function () {
        console.log("Save extraBody completed")
    });
    chrome.storage.sync.set({
        "rootDomain": rootDomain
    }, function () {
        console.log("Save rootDomain completed")
    });
    chrome.storage.sync.set({
        "domainFilter": domainFilter
    }, function () {
        console.log("Save domainFilter completed")
    });
}

function resetSettings() {
    chrome.storage.sync.remove("serverAddress", function () {
        document.getElementById("serverAddress").value = "";
        console.log("Remove serverAddress completed")
    });
    chrome.storage.sync.remove("cookieNames", function () {
        document.getElementById("cookieNames").value = "";
        console.log("Remove cookieNames completed")
    });
    chrome.storage.sync.remove("token", function () {
        document.getElementById("token").value = "";
        console.log("Remove token completed")
    });
    chrome.storage.sync.remove("extraBody", function () {
        document.getElementById("extraBody").value = "";
        console.log("Remove extraBody completed")
    });
    chrome.storage.sync.remove("rootDomain", function () {
        document.getElementById("rootDomain").value = "false";
        console.log("Remove rootDomain completed")
    });
    chrome.storage.sync.remove("domainFilter", function () {
        document.getElementById("domainFilter").value = "";
        console.log("Remove domainFilter completed")
    });
}

function loadSettings() {
    chrome.storage.sync.get(["serverAddress"], function (result) {
        if (result.serverAddress === undefined) {
            result.serverAddress = "";
        }
        document.getElementById("serverAddress").value = result.serverAddress;
    })
    chrome.storage.sync.get(["cookieNames"], function (result) {
        if (result.cookieNames === undefined) {
            result.cookieNames = "";
        }
        document.getElementById("cookieNames").value = result.cookieNames;
    })
    chrome.storage.sync.get(["token"], function (result) {
        if (result.token === undefined) {
            result.token = "";
        }
        document.getElementById("token").value = result.token;
    })
    chrome.storage.sync.get(["extraBody"], function (result) {
        if (result.extraBody === undefined) {
            result.extraBody = "";
        }
        document.getElementById("extraBody").value = result.extraBody;
    })
    chrome.storage.sync.get(["rootDomain"], function (result) {
        if (result.rootDomain === undefined) {
            result.rootDomain = "false";
        }
        document.getElementById("rootDomain").value = result.rootDomain;
    })
    chrome.storage.sync.get(["domainFilter"], function (result) {
        if (result.domainFilter === undefined) {
            result.domainFilter = "";
        }
        document.getElementById("domainFilter").value = result.domainFilter;
    })
}

document.addEventListener("DOMContentLoaded", loadSettings);
document.getElementById("saveButton").addEventListener("click", saveSettings);
document.getElementById("resetButton").addEventListener("click", resetSettings);
