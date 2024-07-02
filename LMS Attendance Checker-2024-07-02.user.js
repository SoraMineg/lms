// ==UserScript==
// @name         LMS Attendance Checker
// @namespace    http://tampermonkey.net/
// @version      0.1 beta
// @description  LMSのマイコース上に出席カウント，後何回休めるのかがわかるダッシュボードを表示します．
// @author       nihsukah
// @match        https://lms-tokyo.iput.ac.jp/my/courses.php
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ウインドウのスタイルを設定する
    const windowStyle = `
        position: fixed;
        top: 50px;
        right: 50px;
        width: 300px;
        height: 200px;
        background: white;
        border: 1px solid black;
        padding: 10px;
        z-index: 1000;
    `;

    // ウインドウのHTMLを生成する
    const attendanceWindow = document.createElement('div');
    attendanceWindow.setAttribute('style', windowStyle);
    attendanceWindow.innerHTML = `
        <h3>出席回数記録</h3>
        <label for="attendanceCount">出席回数:</label>
        <input type="number" id="attendanceCount" min="0" value="0" style="width: 50px;">
        <button id="saveAttendance">保存</button>
        <button id="closeWindow">閉じる</button>
    `;

    // ウインドウをページに追加する
    document.body.appendChild(attendanceWindow);
})();
