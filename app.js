/**
 * Foung Fitness XLSX Class Schedule Generator
 * App Logic & Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    let state = {
        year: 2026,
        month: 10,
        title: "2026 團體課程表（10月份 October）",
        autoTagOff: true,
        simplifyTeacher: true,
        maxColumns: 3,
        fontSizeScale: 'medium',
        borderStyle: 'grid',
        // Days map: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun
        days: JSON.parse(JSON.stringify(window.DEFAULT_SCHEDULE.days))
    };

    const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", 
                         "July", "August", "September", "October", "November", "December"];
    const DAY_KEYS = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun
    const DAY_LABELS = { 1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六", 0: "日" };

    // --- DOM Elements ---
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const btnLoadDemo = document.getElementById('btnLoadDemo');
    const scheduleTitleInput = document.getElementById('scheduleTitle');
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const autoTagOffCheckbox = document.getElementById('autoTagOff');
    const simplifyTeacherCheckbox = document.getElementById('simplifyTeacher');
    const maxColumnsSelect = document.getElementById('maxColumns');
    const fontSizeScaleSelect = document.getElementById('fontSizeScale');
    const borderStyleSelect = document.getElementById('borderStyleSelect');
    const btnAddSlot = document.getElementById('btnAddSlot');
    const btnExportImage = document.getElementById('btnExportImage');
    const btnPrintPdf = document.getElementById('btnPrintPdf');

    const displayTitle = document.getElementById('displayTitle');
    const scheduleTable = document.getElementById('scheduleTable');
    const scheduleTbody = document.getElementById('scheduleTbody');
    const printableArea = document.getElementById('printableArea');
    const rowCountInfo = document.getElementById('rowCountInfo');

    // Modal Elements
    const editModal = document.getElementById('editModal');
    const closeModal = document.getElementById('closeModal');
    const modalDayOfWeek = document.getElementById('modalDayOfWeek');
    const modalTime = document.getElementById('modalTime');
    const modalTag = document.getElementById('modalTag');
    const modalName = document.getElementById('modalName');
    const modalTeacher = document.getElementById('modalTeacher');
    const editDayIndex = document.getElementById('editDayIndex');
    const editSlotIndex = document.getElementById('editSlotIndex');
    const btnSaveCourse = document.getElementById('btnSaveCourse');
    const btnDeleteCourse = document.getElementById('btnDeleteCourse');

    // --- Initialize ---
    initEventListeners();
    renderSchedule();

    function initEventListeners() {
        // Drag & Drop
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
            }
        });

        // Load Demo Data
        btnLoadDemo.addEventListener('click', () => {
            state.days = JSON.parse(JSON.stringify(window.DEFAULT_SCHEDULE.days));
            state.year = 2026;
            state.month = 10;
            state.title = "2026 團體課程表（10月份 October）";
            updateControlsFromState();
            renderSchedule();
        });

        // Controls Change
        scheduleTitleInput.addEventListener('input', (e) => {
            state.title = e.target.value;
            displayTitle.innerText = state.title;
        });

        displayTitle.addEventListener('blur', () => {
            state.title = displayTitle.innerText;
            scheduleTitleInput.value = state.title;
        });

        yearSelect.addEventListener('change', (e) => {
            state.year = parseInt(e.target.value, 10) || 2026;
            updateTitleFormat();
            renderSchedule();
        });

        monthSelect.addEventListener('change', (e) => {
            state.month = parseInt(e.target.value, 10) || 10;
            updateTitleFormat();
            renderSchedule();
        });

        autoTagOffCheckbox.addEventListener('change', (e) => {
            state.autoTagOff = e.target.checked;
            renderSchedule();
        });

        simplifyTeacherCheckbox.addEventListener('change', (e) => {
            state.simplifyTeacher = e.target.checked;
            renderSchedule();
        });

        maxColumnsSelect.addEventListener('change', (e) => {
            state.maxColumns = parseInt(e.target.value, 10) || 3;
            renderSchedule();
        });

        fontSizeScaleSelect.addEventListener('change', (e) => {
            state.fontSizeScale = e.target.value;
            applyFontSizeScale();
        });

        if (borderStyleSelect) {
            borderStyleSelect.addEventListener('change', (e) => {
                state.borderStyle = e.target.value;
                applyBorderStyle();
            });
        }

        // Add Slot Button
        btnAddSlot.addEventListener('click', () => {
            openModal(1, -1, { time: "19:00", tag: "", name: "新課程", teacher: "老師" });
        });

        // Export Buttons
        btnExportImage.addEventListener('click', exportToPNG);
        btnPrintPdf.addEventListener('click', () => window.print());

        // Modal Controls
        closeModal.addEventListener('click', () => editModal.classList.remove('active'));
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) editModal.classList.remove('active');
        });

        btnSaveCourse.addEventListener('click', saveModalCourse);
        btnDeleteCourse.addEventListener('click', deleteModalCourse);
    }

    function updateTitleFormat() {
        const monthEng = MONTH_NAMES[state.month - 1] || "";
        state.title = `${state.year} 團體課程表（${state.month}月份 ${monthEng}）`;
        scheduleTitleInput.value = state.title;
        displayTitle.innerText = state.title;
        rowCountInfo.innerText = `顯示 ${state.year}/${state.month} 團體課程表`;
    }

    function updateControlsFromState() {
        yearSelect.value = state.year;
        monthSelect.value = state.month;
        scheduleTitleInput.value = state.title;
        displayTitle.innerText = state.title;
        rowCountInfo.innerText = `顯示 ${state.year}/${state.month} 團體課程表`;
        if (borderStyleSelect) borderStyleSelect.value = state.borderStyle;
    }

    function applyFontSizeScale() {
        printableArea.classList.remove('scale-small', 'scale-medium', 'scale-large');
        printableArea.classList.add(`scale-${state.fontSizeScale}`);
    }

    function applyBorderStyle() {
        printableArea.classList.remove('border-grid', 'border-horizontal', 'border-outer', 'border-none');
        printableArea.classList.add(`border-${state.borderStyle}`);
    }

    // --- File Upload & Parse Engine ---
    function handleFileUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                processRawXlsxRows(rawRows);
            } catch (err) {
                alert("解析 XLSX 檔案時發生錯誤，請確認檔案格式是否正確。");
                console.error(err);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function processRawXlsxRows(rows) {
        if (!rows || rows.length < 2) {
            alert("檔案無有效內容！");
            return;
        }

        // Find header row containing 課程日期 and 課程時間
        let headerIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
            const rowStr = (rows[i] || []).join(' ');
            if (rowStr.includes('課程日期') || rowStr.includes('日期') || rowStr.includes('課程時間')) {
                headerIdx = i;
                break;
            }
        }

        if (headerIdx === -1) {
            alert("找不到包含「課程日期」與「課程時間」的欄位標頭，請確認 XLSX 格式。");
            return;
        }

        const headers = rows[headerIdx].map(h => String(h || '').trim());
        const colDate = headers.findIndex(h => h.includes('課程日期') || h.includes('日期'));
        const colTime = headers.findIndex(h => h.includes('課程時間') || h.includes('時間'));
        const colName = headers.findIndex(h => h.includes('課程名稱') || h.includes('名稱'));
        const colTeacher = headers.findIndex(h => h.includes('授課老師') || h.includes('老師'));
        const colStatus = headers.findIndex(h => h.includes('課程狀態') || h.includes('狀態'));

        if (colDate === -1 || colTime === -1 || colName === -1) {
            alert("無法自動對應核心欄位（日期、時間、課程名稱），請檢查欄位名稱。");
            return;
        }

        const parsedEntries = [];
        let detectedYear = null;
        let detectedMonth = null;

        for (let i = headerIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[colDate]) continue;

            const dateStr = String(row[colDate]).trim();
            const timeStr = String(row[colTime] || '').trim();
            const nameStr = String(row[colName] || '').trim();
            const teacherStr = colTeacher !== -1 ? String(row[colTeacher] || '').trim() : '';
            const statusStr = colStatus !== -1 ? String(row[colStatus] || '').trim() : '正常';

            if (!dateStr || !nameStr) continue;

            // Parse Date format YYYY/MM/DD or YYYY-MM-DD
            const dateObj = new Date(dateStr.replace(/-/g, '/'));
            if (isNaN(dateObj.getTime())) continue;

            if (!detectedYear) {
                detectedYear = dateObj.getFullYear();
                detectedMonth = dateObj.getMonth() + 1;
            }

            // Extract start time e.g. "16:10~17:10" -> "16:10"
            let startTime = timeStr;
            if (timeStr.includes('~')) {
                startTime = timeStr.split('~')[0].trim();
            } else if (timeStr.includes('-')) {
                startTime = timeStr.split('-')[0].trim();
            }

            parsedEntries.push({
                date: dateObj,
                dayNum: dateObj.getDate(),
                dayOfWeek: dateObj.getDay(), // 0=Sun, 1=Mon, ..., 6=Sat
                time: startTime,
                name: nameStr,
                teacher: teacherStr,
                status: statusStr
            });
        }

        if (parsedEntries.length === 0) {
            alert("檔案中找不到有效的課程資料！");
            return;
        }

        if (detectedYear && detectedMonth) {
            state.year = detectedYear;
            state.month = detectedMonth;
            updateTitleFormat();
        }

        // Build schedule matrix with auto-deduction logic
        buildScheduleFromParsedEntries(parsedEntries);
        renderSchedule();
    }

    // --- Automatic Schedule Deductive Logic ---
    function buildScheduleFromParsedEntries(entries) {
        // Calculate all calendar dates for target year & month for each weekday
        const year = state.year;
        const month = state.month;
        const totalDaysInMonth = new Date(year, month, 0).getDate();

        // Group dates by dayOfWeek (0~6)
        const monthWeekdayDates = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
        for (let d = 1; d <= totalDaysInMonth; d++) {
            const dt = new Date(year, month - 1, d);
            monthWeekdayDates[dt.getDay()].push(d);
        }

        // Group parsed entries by slot key: (dayOfWeek, time, cleanName)
        const slotGroups = {};

        entries.forEach(entry => {
            if (entry.status === '已取消' || entry.status === '停課') return;

            const cleanName = cleanCourseName(entry.name);
            const cleanTeacher = cleanTeacherName(entry.teacher);
            const key = `${entry.dayOfWeek}_${entry.time}_${cleanName}`;

            if (!slotGroups[key]) {
                slotGroups[key] = {
                    dayOfWeek: entry.dayOfWeek,
                    time: entry.time,
                    name: cleanName,
                    teacher: cleanTeacher,
                    activeDates: new Set()
                };
            }
            slotGroups[key].activeDates.add(entry.dayNum);
        });

        // Reconstruct state.days
        const newDays = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };

        Object.values(slotGroups).forEach(group => {
            const allWeekdayDates = monthWeekdayDates[group.dayOfWeek] || [];
            const missingDates = allWeekdayDates.filter(d => !group.activeDates.has(d)).sort((a, b) => a - b);
            
            let tag = "";
            if (missingDates.length > 0) {
                // If missing some dates
                if (allWeekdayDates.length > 2 && missingDates.length === Math.floor(allWeekdayDates.length / 2)) {
                    // Check if biweekly alternating
                    const isAlternating = missingDates.every((val, idx, arr) => idx === 0 || val - arr[idx - 1] >= 14);
                    if (isAlternating && group.name.includes("空中")) {
                        tag = "隔週";
                    } else {
                        tag = `${formatDateList(missingDates, month)} 停`;
                    }
                } else {
                    tag = `${formatDateList(missingDates, month)} 停`;
                }
            }

            newDays[group.dayOfWeek].push({
                time: group.time,
                tag: tag,
                name: group.name,
                teacher: group.teacher
            });
        });

        // Sort each weekday by start time
        Object.keys(newDays).forEach(dayKey => {
            newDays[dayKey].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
        });

        state.days = newDays;
    }

    function formatDateList(dayNums, month) {
        if (dayNums.length === 1) {
            return `${month}/${dayNums[0]}`;
        }
        // e.g. 5, 19 -> 10/5.19
        return `${month}/${dayNums.join('.')}`;
    }

    function cleanCourseName(name) {
        // Strip English subtitles or keep concise title if needed
        if (!name) return "";
        return name.replace(/\s+[A-Za-z\s]+$/, '').trim();
    }

    function cleanTeacherName(teacher) {
        if (!teacher) return "";
        let t = teacher.trim();
        // Rules: 黃春梅 May -> 春梅, 柔兒老師Zoe -> Zoe, 小芋老師 -> 小芋
        if (t.includes('黃春梅')) return '春梅';
        if (t.includes('柔兒老師')) return 'Zoe';
        if (t.includes('小芋老師')) return '小芋';
        t = t.replace(/老師$/, '');
        return t;
    }

    function timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        return parseInt(parts[0] || 0, 10) * 60 + parseInt(parts[1] || 0, 10);
    }

    // --- Render Table Logic ---
    function renderSchedule() {
        applyFontSizeScale();
        applyBorderStyle();

        // Render Table Headers
        const maxCols = state.maxColumns;
        let thHtml = `<th class="col-day">星期</th>`;
        for (let c = 1; c <= maxCols; c++) {
            thHtml += `<th class="col-course">課程 ${c}</th>`;
        }
        scheduleTable.querySelector('thead tr').innerHTML = thHtml;

        // Render Table Body (Mon ~ Sun)
        let tbodyHtml = '';

        DAY_KEYS.forEach(dayKey => {
            const slots = state.days[dayKey] || [];
            const dayLabel = DAY_LABELS[dayKey];

            tbodyHtml += `<tr>`;
            tbodyHtml += `<td class="day-cell">${dayLabel}</td>`;

            for (let c = 0; c < maxCols; c++) {
                const slot = slots[c];
                if (slot) {
                    const teacherDisplay = state.simplifyTeacher ? cleanTeacherName(slot.teacher) : slot.teacher;
                    const tagDisplay = state.autoTagOff ? slot.tag : '';

                    tbodyHtml += `
                        <td class="course-cell" onclick="handleCellClick(${dayKey}, ${c})">
                            <div class="cell-actions">
                                <button class="btn-icon-mini" onclick="event.stopPropagation(); handleCellEdit(${dayKey}, ${c})"><i class="fa-solid fa-pen"></i></button>
                            </div>
                            <div class="slot-time-row">
                                <span class="slot-time">${slot.time}</span>
                                ${tagDisplay ? `<span class="slot-tag">${tagDisplay}</span>` : ''}
                            </div>
                            <div class="slot-name">${slot.name}</div>
                            <div class="slot-teacher">${teacherDisplay}</div>
                        </td>
                    `;
                } else {
                    tbodyHtml += `
                        <td class="course-cell empty-cell" onclick="handleCellClick(${dayKey}, ${c})">
                            <!-- empty slot placeholder -->
                        </td>
                    `;
                }
            }

            tbodyHtml += `</tr>`;
        });

        scheduleTbody.innerHTML = tbodyHtml;
    }

    // --- Modal & Cell Handlers ---
    window.handleCellClick = function(dayKey, slotIdx) {
        const slot = (state.days[dayKey] || [])[slotIdx];
        if (slot) {
            openModal(dayKey, slotIdx, slot);
        } else {
            openModal(dayKey, -1, { time: "19:00", tag: "", name: "", teacher: "" });
        }
    };

    window.handleCellEdit = function(dayKey, slotIdx) {
        const slot = (state.days[dayKey] || [])[slotIdx];
        if (slot) openModal(dayKey, slotIdx, slot);
    };

    function openModal(dayKey, slotIdx, slotData) {
        editDayIndex.value = dayKey;
        editSlotIndex.value = slotIdx;
        modalDayOfWeek.value = dayKey;
        modalTime.value = slotData.time || "";
        modalTag.value = slotData.tag || "";
        modalName.value = slotData.name || "";
        modalTeacher.value = slotData.teacher || "";
        editModal.classList.add('active');
    }

    function saveModalCourse(e) {
        e.preventDefault();
        const dayKey = parseInt(modalDayOfWeek.value, 10);
        const origDayKey = parseInt(editDayIndex.value, 10);
        const slotIdx = parseInt(editSlotIndex.value, 10);

        const newSlot = {
            time: modalTime.value.trim(),
            tag: modalTag.value.trim(),
            name: modalName.value.trim(),
            teacher: modalTeacher.value.trim()
        };

        if (!newSlot.time || !newSlot.name) {
            alert("請輸入時間與課程名稱！");
            return;
        }

        // If day of week changed or new slot
        if (slotIdx >= 0 && dayKey === origDayKey) {
            state.days[dayKey][slotIdx] = newSlot;
        } else {
            if (slotIdx >= 0 && state.days[origDayKey]) {
                state.days[origDayKey].splice(slotIdx, 1);
            }
            if (!state.days[dayKey]) state.days[dayKey] = [];
            state.days[dayKey].push(newSlot);
        }

        // Sort weekday slots by time
        state.days[dayKey].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

        editModal.classList.remove('active');
        renderSchedule();
    }

    function deleteModalCourse() {
        const dayKey = parseInt(editDayIndex.value, 10);
        const slotIdx = parseInt(editSlotIndex.value, 10);

        if (slotIdx >= 0 && state.days[dayKey]) {
            state.days[dayKey].splice(slotIdx, 1);
            renderSchedule();
        }
        editModal.classList.remove('active');
    }

    // --- Export PNG Image ---
    function exportToPNG() {
        const titleText = state.title || "團體課程表";
        const filename = `${titleText}.png`;

        // Temporarily hide edit mini action buttons for screenshot
        const actions = printableArea.querySelectorAll('.cell-actions');
        actions.forEach(a => a.style.display = 'none');

        html2canvas(printableArea, {
            scale: 2, // High resolution crisp export
            useCORS: true,
            backgroundColor: "#ffffff"
        }).then(canvas => {
            actions.forEach(a => a.style.display = '');

            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            actions.forEach(a => a.style.display = '');
            alert("匯出圖片時發生錯誤。");
            console.error(err);
        });
    }
});
