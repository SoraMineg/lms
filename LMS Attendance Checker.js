// ==UserScript==
// @name         LMS-Simple-Dashboard
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

    function createWindowForCourse(course) {
        // ウインドウの要素を作成
        const windowDiv = document.createElement("div");
        windowDiv.style.position = "absolute";
        windowDiv.style.width = "800px";
        windowDiv.style.height = "300px";
        windowDiv.style.border = "2px solid #ccc";
        windowDiv.style.backgroundColor = "#fff";
        windowDiv.style.zIndex = "1000";
        windowDiv.style.padding = "10px";
        windowDiv.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.1)";
        windowDiv.style.opacity = "0.8";
        windowDiv.style.overflowY = "auto";

        // タイトル
        const title = document.createElement("h3");
        title.innerText = "Dashboard";
        windowDiv.appendChild(title);

        // 内容を置き換える
        const content = document.createElement("div");
        windowDiv.appendChild(content);

        // コースカードの右に配置
        const rect = course.getBoundingClientRect();
        windowDiv.style.top = `${rect.top + window.scrollY}px`;
        windowDiv.style.left = `${rect.right + window.scrollX + 10}px`; // コースカードの右に10pxの余白を追加

        // ドキュメントに追加する
        document.body.appendChild(windowDiv);

        // 初期状態では非表示
        windowDiv.style.display = "none";

        return windowDiv;
    }

    async function fetchCourseInfo(courseLink) {
        try {
            const response = await fetch(courseLink);
            const text = await response.text();
            return text;
        } catch (error) {
            console.error("Failed to fetch course information:", error);
            return "Failed to load course information.";
        }
    }

    // ページ読み込み後に各コースカードに対してボタンとウィンドウを生成
    window.addEventListener("load", function() {
        setTimeout(function() {
            const courses = document.querySelectorAll(".card.dashboard-card");
            courses.forEach(course => {
                // "View Dashboard" ボタンを作成
                const viewButton = document.createElement("button");
                viewButton.innerText = "View Dashboard";
                viewButton.style.marginTop = "10px";
                viewButton.style.display = "block";
                viewButton.style.padding = "10px 20px";
                viewButton.style.border = "none";
                viewButton.style.borderRadius = "5px";
                viewButton.style.backgroundColor = "#007bff";
                viewButton.style.color = "#fff";
                viewButton.style.cursor = "pointer";
                viewButton.style.fontSize = "14px";
                viewButton.style.transition = "background-color 0.3s ease";

                viewButton.addEventListener("mouseover", function() {
                    viewButton.style.backgroundColor = "#0056b3";
                });

                viewButton.addEventListener("mouseout", function() {
                    viewButton.style.backgroundColor = "#007bff";
                });

                // ボタンをクリックしたときにウィンドウを表示
                const dashboardWindow = createWindowForCourse(course);
                viewButton.addEventListener("click", async function() {
                    if (dashboardWindow.style.display === "none") {
                        const courseLink = course.querySelector(".aalink.coursename").href;
                        const courseInfo = await fetchCourseInfo(courseLink);
                        dashboardWindow.querySelector("div").innerText = courseInfo;
                        dashboardWindow.style.display = "block";
                    } else {
                        dashboardWindow.style.display = "none";
                    }
                });

                // コースカードにボタンを追加
                course.appendChild(viewButton);
            });
        }, 1000);
    });

})();
