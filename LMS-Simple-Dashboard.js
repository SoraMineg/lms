// ==UserScript==
// @name         LMS Simple Dashboard
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
    // 開いているウインドウの状態を保持する
    let currentlyOpenWindow = null;

    function createWindowForCourse(course) {
        // ウインドウの要素を作成
        const windowDiv = document.createElement("div");
        windowDiv.style.position = "absolute";
        windowDiv.style.width = "500px";
        windowDiv.style.height = "300px";
        windowDiv.style.border = "none";
        windowDiv.style.borderRadius = "10px";
        windowDiv.style.backgroundColor = "#f9f9f9";
        windowDiv.style.zIndex = "1000";
        windowDiv.style.padding = "20px";
        windowDiv.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
        windowDiv.style.opacity = "0.95";
        windowDiv.style.overflowY = "auto";

        // タイトル
        const title = document.createElement("h3");
        title.innerText = "Dashboard";
        title.style.marginBottom = "20px";
        title.style.fontFamily = "'Meiryo', メイリオ";
        title.style.fontSize = "24px";
        title.style.color = "#333";
        windowDiv.appendChild(title);

        // 内容を置き換える
        const content = document.createElement("div");
        content.style.fontFamily = "'Meiryo', メイリオ";
        content.style.fontSize = "16px";
        content.style.color = "#666";
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

    async function fetchAttendanceCount(attendanceLink) {
        try {
            const response = await fetch(attendanceLink);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");
            const attendanceCells = doc.querySelectorAll('td.statuscol.cell.c2');

            // "出席" のカウント
            const attendanceCount = Array.from(attendanceCells).filter(td => td.textContent.includes("出席")).length;

            // "遅刻" のカウント
            const tardyCount = Array.from(attendanceCells).filter(td => td.textContent.includes("遅刻")).length;

            // "欠席" のカウント（"今後の欠席を報告する"を除外）
            const absentCount = Array.from(attendanceCells).filter(td => {
                return td.textContent.includes("欠席") && !td.textContent.includes("今後の欠席を報告する");
            }).length;

            return { attendanceCount, tardyCount, absentCount };
        } catch (error) {
            console.error("Failed to fetch attendance information:", error);
            return { attendanceCount: 0, tardyCount: 0, absentCount: 0 };
        }
    }

    async function fetchCourseInfo(courseLink) {
        try {
            const response = await fetch(courseLink);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");

            // <div class="snap-assettype">出欠</div> の要素を見つける
            const attendanceDivs = doc.querySelectorAll('div.snap-assettype');
            let attendanceLink = null;

            for (let div of attendanceDivs) {
                if (div.textContent.trim() === "出欠") {
                    const modLink = div.closest('.activityinstance').querySelector('a.mod-link');
                    if (modLink) {
                        attendanceLink = modLink.href + "&view=5";
                        break;
                    }
                }
            }

            // リンクが見つかった場合、そのリンクから出席数、遅刻数、欠席数をカウント
            if (attendanceLink) {
                const { attendanceCount, tardyCount, absentCount } = await fetchAttendanceCount(attendanceLink);
                return `<p>出席の数: ${attendanceCount}</p>
                        <p>遅刻の数: ${tardyCount}</p>
                        <p>欠席の数: ${absentCount}</p>`;
            } else {
                return "出欠リンクが見つかりませんでした。";
            }
        } catch (error) {
            console.error("Failed to fetch course information:", error);
            return "Failed to load course information.";
        }
    }

    // ページ読み込み後に各コースカードに対してボタンとウィンドウを生成
    window.addEventListener("load", function() {
        setTimeout(function() {
            const courses = document.querySelectorAll(".card.dashboard-card");
            if (courses.length === 0) {
                console.error("No courses found. Please check the DOM structure.");
                return;
            }

            courses.forEach(course => {
                // "View Dashboard" ボタンを作成
                const viewButton = document.createElement("button");
                viewButton.innerText = "View Dashboard";
                viewButton.style.marginTop = "10px";
                viewButton.style.display = "block";
                viewButton.style.padding = "10px 20px";
                viewButton.style.border = "none";
                viewButton.style.borderRadius = "5px";
                viewButton.style.backgroundColor = "#007BBB";
                viewButton.style.color = "#fff";
                viewButton.style.cursor = "pointer";
                viewButton.style.fontFamily = "'Meiryo', メイリオ";
                viewButton.style.fontSize = "15px";
                viewButton.style.transition = "background-color 0.3s ease";

                viewButton.addEventListener("mouseover", function() {
                    viewButton.style.backgroundColor = "#005f8c";
                });

                viewButton.addEventListener("mouseout", function() {
                    viewButton.style.backgroundColor = "#007BBB";
                });

                // ボタンをクリックしたときにウィンドウを表示
                const dashboardWindow = createWindowForCourse(course);
                viewButton.addEventListener("click", async function() {
                    // ウインドウが既に開かれている場合は削除する
                    if (currentlyOpenWindow && currentlyOpenWindow !== dashboardWindow) {
                        currentlyOpenWindow.style.display = "none";
                    }

                    if (dashboardWindow.style.display === "none") {
                        const courseLink = course.querySelector(".aalink.coursename").href;
                        const courseInfo = await fetchCourseInfo(courseLink);
                        dashboardWindow.querySelector("div").innerHTML = courseInfo;
                        dashboardWindow.style.display = "block";
                        // 現在のウインドウ状態を更新する
                        currentlyOpenWindow = dashboardWindow;
                    } else {
                        dashboardWindow.style.display = "none";
                        // ウインドウを閉じる
                        currentlyOpenWindow = null;
                    }
                });

                // コースカードにボタンを追加
                course.appendChild(viewButton);
            });
        // ページローディング2秒後に生成
        }, 2000);
    });

})();
