function saveSettings() {
    let serverAddress = document.getElementById("serverAddress").value;
    let cookieNames = document.getElementById("cookieNames").value;
    let token = document.getElementById("token").value;
    let extraBody = document.getElementById("extraBody").value;
    let rootDomain = document.getElementById("rootDomain").value;
    let domainFilter = document.getElementById("domainFilter").value;
    let uploadMode = document.getElementById("uploadMode").value;
    let uploadInterval = document.getElementById("uploadInterval").value || "30";

    chrome.storage.sync.set({
        serverAddress, cookieNames, token, extraBody, rootDomain, domainFilter, uploadMode, uploadInterval
    }, function () {
        console.log("Settings saved");
        chrome.runtime.sendMessage({ action: "updateAlarm" });
        showStatus("✓ 保存成功");
    });
}

function resetSettings() {
    chrome.storage.sync.clear(function () {
        document.getElementById("serverAddress").value = "";
        document.getElementById("cookieNames").value = "";
        document.getElementById("token").value = "";
        document.getElementById("extraBody").value = "";
        document.getElementById("rootDomain").value = "false";
        document.getElementById("domainFilter").value = "";
        document.getElementById("uploadMode").value = "manual";
        document.getElementById("uploadInterval").value = "30";
        toggleIntervalGroup();
        chrome.runtime.sendMessage({ action: "updateAlarm" });
        console.log("Settings reset");
    });
}

function loadSettings() {
    chrome.storage.sync.get(
        ["serverAddress", "cookieNames", "token", "extraBody", "rootDomain", "domainFilter", "uploadMode", "uploadInterval"],
        function (result) {
            document.getElementById("serverAddress").value = result.serverAddress || "";
            document.getElementById("cookieNames").value = result.cookieNames || "";
            document.getElementById("token").value = result.token || "";
            document.getElementById("extraBody").value = result.extraBody || "";
            document.getElementById("rootDomain").value = result.rootDomain || "false";
            document.getElementById("domainFilter").value = result.domainFilter || "";
            document.getElementById("uploadMode").value = result.uploadMode || "manual";
            document.getElementById("uploadInterval").value = result.uploadInterval || "30";
            toggleIntervalGroup();
        }
    );
}

function toggleIntervalGroup() {
    let mode = document.getElementById("uploadMode").value;
    document.getElementById("intervalGroup").style.display = mode === "timer" ? "block" : "none";
}

function showStatus(text) {
    let el = document.getElementById("saveStatus");
    el.textContent = text;
    el.style.display = "inline";
    setTimeout(function () {
        el.style.display = "none";
    }, 2000);
}

document.addEventListener("DOMContentLoaded", loadSettings);
document.getElementById("saveButton").addEventListener("click", saveSettings);
document.getElementById("resetButton").addEventListener("click", resetSettings);
document.getElementById("uploadMode").addEventListener("change", toggleIntervalGroup);
