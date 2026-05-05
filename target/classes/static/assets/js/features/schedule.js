export function createScheduleFeature({ state, refs, auth, showError, clearError }) {
    const API_BASE = '/api/registrations';
    const DAYS = ['', '', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const COLORS = ['#e0e7ff', '#dbfafe', '#dcfce7', '#fef3c7', '#fee2e2', '#f3e8ff'];
    const TEXT_COLORS = ['#3730a3', '#1e40af', '#166534', '#92400e', '#991b1b', '#6b21a8'];

    let semesters = [];
    let enrolledSchedule = [];
    let currentSemesterId = '';

    function authHeaders() {
        return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.authState.token };
    }

    async function loadSchedule() {
        if (!state.authState || !state.authState.token) return;
        clearError();

        refs.scheduleSection.classList.remove('d-none');

        try {
            const semRes = await fetch('/api/semesters', { headers: authHeaders() });
            if (semRes.ok) {
                semesters = await semRes.json();
                renderSemesterFilter();
            }

            if (currentSemesterId) {
                await fetchMySchedule();
            } else {
                refs.scheduleBody.innerHTML = '';
            }
        } catch (e) {
            console.error('Schedule error:', e);
            showError('Lỗi tải lịch học.');
        }
    }

    function renderSemesterFilter() {
        let html = '<option value="">-- Chọn học kỳ --</option>';
        semesters.forEach(s => {
            const selected = s.id === currentSemesterId ? 'selected' : '';
            html += `<option value="${s.id}" ${selected}>${s.schoolYearName || s.name}</option>`;
        });
        refs.scheduleSemesterFilter.innerHTML = html;
        if (!currentSemesterId && semesters.length > 0) {
            currentSemesterId = semesters[0].id;
            refs.scheduleSemesterFilter.value = currentSemesterId;
        }
    }

    async function fetchMySchedule() {
        if (!currentSemesterId) {
            enrolledSchedule = [];
            renderScheduleGrid();
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/my-schedule?semesterId=${currentSemesterId}`, {
                headers: authHeaders()
            });

            if (res.ok) {
                enrolledSchedule = await res.json();
            } else if (res.status === 401) {
                enrolledSchedule = [];
                showError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            } else if (res.status === 403) {
                enrolledSchedule = [];
                showError('Chỉ Sinh Viên mới được xem lịch học.');
            } else {
                enrolledSchedule = [];
            }
        } catch (e) {
            console.error(e);
            enrolledSchedule = [];
        }

        renderScheduleGrid();
    }

    function renderScheduleGrid() {
        const periodGroups = [
            { buoi: 'Sáng', label: '1–3', min: 1, max: 3, first: true },
            { buoi: 'Sáng', label: '4–6', min: 4, max: 6, first: false },
            { buoi: 'Chiều', label: '1–3', min: 7, max: 9, first: true },
            { buoi: 'Chiều', label: '4–6', min: 10, max: 12, first: false },
        ];

        const events = enrolledSchedule.map((item, index) => ({
            dayOfWeek: item.dayOfWeek,
            startPeriod: item.startPeriod,
            endPeriod: item.endPeriod,
            shortName: item.courseName || item.courseCode || item.sectionCode || 'Môn học',
            title: `${item.courseName || item.courseCode || 'Lịch học'} – ${item.sectionCode || 'Đã đăng ký'}`,
            background: COLORS[index % COLORS.length],
            textColor: TEXT_COLORS[index % TEXT_COLORS.length],
        }));

        let html = '';
        periodGroups.forEach(pg => {
            html += `<tr>`;
            if (pg.first) {
                html += `<td rowspan="2" style="white-space:nowrap; font-weight:600; vertical-align:middle; text-align:center; background:#f8f9fa; border-right:1px solid #dee2e6;">${pg.buoi}</td>`;
            }
            html += `<td class="text-muted" style="white-space:nowrap; font-size:0.82rem; vertical-align:middle; text-align:center;">${pg.label}</td>`;
            for (let d = 2; d <= 7; d++) {
                const matched = events.filter(ev =>
                    ev.dayOfWeek === d &&
                    ev.startPeriod <= pg.max &&
                    ev.endPeriod >= pg.min
                );

                if (matched.length > 0) {
                    const block = matched[0];
                    const shortName = block.shortName.length > 12
                        ? `${block.shortName.substring(0, 12)}...`
                        : block.shortName;
                    const conflictClass = matched.length > 1 ? ' conflict' : '';
                    html += `<td>
                        <div class="reg-cell-event${conflictClass}" style="background:${block.background}; color:${block.textColor}" title="${matched.map(e => e.title).join(' | ')}">
                           ${shortName}
                        </div>
                    </td>`;
                } else {
                    html += `<td></td>`;
                }
            }
            html += `</tr>`;
        });

        refs.scheduleBody.innerHTML = html;
    }

    function bindEvents() {
        refs.scheduleSemesterFilter.addEventListener('change', (e) => {
            currentSemesterId = e.target.value;
            fetchMySchedule();
        });
    }

    function showUnauthorizedState() {
        refs.scheduleBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-3">Vui lòng đăng nhập với quyền Sinh viên</td></tr>';
    }

    function resetLoggedOutState() {
        enrolledSchedule = [];
        currentSemesterId = '';
        semesters = [];
        refs.scheduleSemesterFilter.innerHTML = '<option value="">-- Chọn học kỳ --</option>';
        refs.scheduleBody.innerHTML = '';
    }

    return {
        loadSchedule,
        bindEvents,
        showUnauthorizedState,
        resetLoggedOutState
    };
}
