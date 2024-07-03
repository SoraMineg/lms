// ==UserScript==
// @name         LMS: Simple Dashboard
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  LMSのマイコース上に出席，遅刻，欠席が一目でわかるダッシュボードを表示します．
// @author       nihsukah
// @match        https://lms-tokyo.iput.ac.jp/my/courses.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=lms-tokyo.iput.ac.jp
// @grant        none
// ==/UserScript==

(function() {
    "use strict";
    let currentlyOpenWindow = null;

    function createWindowForCourse(course) {
        const windowDiv = document.createElement("div");
        windowDiv.style.position = "absolute";
        windowDiv.style.width = "400px";
        windowDiv.style.border = "none";
        windowDiv.style.borderRadius = "10px";
        windowDiv.style.backgroundColor = "#f9f9f9";
        windowDiv.style.zIndex = "1000";
        windowDiv.style.padding = "20px";
        windowDiv.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.4)";
        windowDiv.style.opacity = "0.95";
        windowDiv.style.overflowY = "auto";

        const title = document.createElement("h3");
        title.innerText = "Dashboard";
        title.style.marginBottom = "20px";
        title.style.fontFamily = "'Meiryo', メイリオ";
        title.style.fontSize = "24px";
        title.style.color = "#333";
        title.style.fontWeight = "bold";
        title.style.borderBottom = "4px solid #ccc";
        title.style.paddingBottom = "10px";
        windowDiv.appendChild(title);

        const content = document.createElement("div");
        content.style.fontFamily = "'Meiryo', メイリオ";
        content.style.fontSize = "16px";
        content.style.color = "#666";
        windowDiv.appendChild(content);

        const rect = course.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        windowDiv.style.top = `${rect.top + window.scrollY}px`;
        if (rect.right + 420 > viewportWidth) {
            windowDiv.style.left = `${rect.left + window.scrollX - 420}px`;
        } else {
            windowDiv.style.left = `${rect.right + window.scrollX + 10}px`;
        }

        document.body.appendChild(windowDiv);
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

            const attendanceCount = Array.from(attendanceCells).filter(td => td.textContent.includes("出席")).length;
            const tardinessCount = Array.from(attendanceCells).filter(td => td.textContent.includes("遅刻")).length;
            const absentCount = Array.from(attendanceCells).filter(td => {
                return td.textContent.includes("欠席") && !td.textContent.includes("今後の欠席を報告する");
            }).length;

            return { attendanceCount, tardinessCount, absentCount };
        } catch (error) {
            console.error("Failed to fetch attendance information:", error);
            return { attendanceCount: 0, tardinessCount: 0, absentCount: 0 };
        }
    }

    async function fetchCourseInfo(courseLink) {
        try {
            const response = await fetch(courseLink);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, "text/html");

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

            if (attendanceLink) {
                const { attendanceCount, tardinessCount, absentCount } = await fetchAttendanceCount(attendanceLink);
                return `
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;">
                        <div style="flex: 1; background-color: #007BBB; color: white; padding: 10px; border-radius: 10px; text-align: start;">
                            <div style="padding-left: 10px; font-family: Arial; font-weight: bold;">Attendance</div>
                            <div style="font-size: 40px; padding-left: 20px; font-family: Arial; font-weight: bold;">${attendanceCount}</div>
                        </div>
                        <div style="flex: 1; background-color: #BBDEFB; color: #007BBB; padding: 10px; border-radius: 10px; text-align: start;">
                            <div style="padding-left: 10px; font-family: Arial; font-weight: bold;">Tardiness</div>
                            <div style="font-size: 40px; padding-left: 20px; font-family: Arial; font-weight: bold;">${tardinessCount}</div>
                        </div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
                        <div style="flex: 1; background-color: #FFCDD2; color: red; padding: 10px; border-radius: 10px; text-align: start;">
                            <div style="padding-left: 10px; font-family: Arial; font-weight: bold;">Absent</div>
                            <div style="font-size: 40px; padding-left: 20px; font-family: Arial; font-weight: bold;">${absentCount}</div>
                        </div>
                    </div>
                `;
            } else {
                return "出欠リンクが見つかりませんでした。";
            }
        } catch (error) {
            console.error("Failed to fetch course information:", error);
            return "Failed to load course information.";
        }
    }

    window.addEventListener("load", function() {
        setTimeout(function() {
            const courses = document.querySelectorAll(".card.dashboard-card");
            if (courses.length === 0) {
                console.error("No courses found. Please check the DOM structure.");
                return;
            }

            courses.forEach(course => {
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
                viewButton.style.fontSize = "20px";
                viewButton.style.transition = "background-color 0.3s ease";

                viewButton.addEventListener("mouseover", function() {
                    viewButton.style.backgroundColor = "#005f8c";
                });

                viewButton.addEventListener("mouseout", function() {
                    viewButton.style.backgroundColor = "#007BBB";
                });

                const dashboardWindow = createWindowForCourse(course);
                viewButton.addEventListener("click", async function() {
                    if (currentlyOpenWindow && currentlyOpenWindow !== dashboardWindow) {
                        currentlyOpenWindow.style.display = "none";
                    }

                    if (dashboardWindow.style.display === "none") {
                        const courseLink = course.querySelector(".aalink.coursename").href;
                        const courseInfo = await fetchCourseInfo(courseLink);
                        dashboardWindow.querySelector("div").innerHTML = courseInfo;
                        dashboardWindow.style.height = 'auto';  // ウィンドウの高さを自動調整
                        dashboardWindow.style.display = "block";
                        currentlyOpenWindow = dashboardWindow;
                    } else {
                        dashboardWindow.style.display = "none";
                        currentlyOpenWindow = null;
                    }
                });

                course.appendChild(viewButton);
            });
        }, 2000);
    });
})();
