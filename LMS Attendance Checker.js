// ==UserScript==
// @name         LMS Attendance Checker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  LMSのマイコース上に出席カウント，後何回休めるのかがわかるダッシュボードを表示します．
// @author       nihsukah
// @match        https://lms-tokyo.iput.ac.jp/my/courses.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lms-tokyo.iput.ac.jp
// @grant        none
// ==/UserScript==

(function() {
    "use strict";

    function createWindow() {
    // ウインドウの要素を作成
    const windowDiv = document.createElement("div");
    windowDiv.style.position = "absolute";
    windowDiv.style.top = "10px";
    windowDiv.style.right = "50%";
    windowDiv.style.width = "400px";
    windowDiv.style.height = "300px";
    windowDiv.style.border = "2px solid #ccc";
    windowDiv.style.backgroundColor = "#fff";
    windowDiv.style.zIndex = "1000";
    windowDiv.style.padding = "10px";
    windowDiv.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.1)";
    windowDiv.style.opacity = "0.8"

        // タイトル
        const title = document.createElement("h3");
        title.innerText = "Dashboard";
        windowDiv.appendChild(title);

        // 内容
        const content = document.createElement("div");
        content.innerText = "テスト！";
        windowDiv.appendChild(content);

        // ドキュメントに追加する
        document.body.appendChild(windowDiv);
    }

    // ページ読み込み後にウインドウ生成
    window.addEventListener("load", function() {
        // 1秒待つ
        this.setTimeout(createWindow, 1000);
    });

})();
