import { API_CONFIG } from '../core/config.js';
import { buildAuthHeaders, fetchJson } from '../services/http.js';

/**
 * Module lịch giảng dạy cá nhân cho giảng viên
 */
export function createLecturerScheduleFeature({ state, refs, auth, showError, clearError }) {
  const DAYS = ['', '', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const COLORS = ['#e0e7ff', '#dbfafe', '#dcfce7', '#fef3c7', '#fee2e2', '#f3e8ff', '#fdf2f8', '#ecfdf5'];
  const TEXT_COLORS = ['#3730a3', '#1e40af', '#166534', '#92400e', '#991b1b', '#6b21a8', '#9d174d', '#065f46'];

  let semesters = [];
  let scheduleData = [];
  let currentSemesterId = '';

  function authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.authState.token };
  }

  async function loadSchedule() {
    if (!state.authState || !state.authState.token) return;
    clearError();

    try {
      // Load semesters
      const semRes = await fetch('/api/semesters', { headers: authHeaders() });
      if (semRes.ok) {
        semesters = await semRes.json();
        renderSemesterFilter();
      }

      if (currentSemesterId) {
        await fetchMySchedule();
      } else if (semesters.length > 0) {
        currentSemesterId = semesters[0].id;
        if (refs.lecturerScheduleSemesterFilter) {
          refs.lecturerScheduleSemesterFilter.value = currentSemesterId;
        }
        await fetchMySchedule();
      } else {
        renderEmptyState();
      }
    } catch (e) {
      console.error('[LecturerSchedule] Error:', e);
      showError('Lỗi tải lịch giảng dạy.');
    }
  }

  function renderSemesterFilter() {
    if (!refs.lecturerScheduleSemesterFilter) return;
    let html = '<option value="">-- Chọn học kỳ --</option>';
    semesters.forEach(s => {
      const selected = s.id === currentSemesterId ? 'selected' : '';
      html += `<option value="${s.id}" ${selected}>${s.schoolYearName || s.name}</option>`;
    });
    refs.lecturerScheduleSemesterFilter.innerHTML = html;
  }

  async function fetchMySchedule() {
    if (!currentSemesterId) {
      scheduleData = [];
      renderScheduleGrid();
      return;
    }

    try {
      const res = await fetch(
        `${API_CONFIG.lecturer}/my-schedule?semesterId=${currentSemesterId}`,
        { headers: authHeaders() }
      );

      if (res.ok) {
        scheduleData = await res.json();
      } else {
        scheduleData = [];
        if (res.status === 404) {
          showError('Không tìm thấy hồ sơ giảng viên.');
        }
      }
    } catch (e) {
      console.error('[LecturerSchedule] Fetch error:', e);
      scheduleData = [];
    }

    renderScheduleGrid();
  }

  function renderScheduleGrid() {
    if (!refs.lecturerScheduleContent) return;

    if (scheduleData.length === 0) {
      refs.lecturerScheduleContent.innerHTML =
        '<div class="text-muted text-center py-4"><i class="bi bi-calendar-x fs-1 d-block mb-2"></i>Không có lịch giảng dạy trong học kỳ này.</div>';
      return;
    }

    const periodGroups = [
      { buoi: 'Sáng', label: '1–3', min: 1, max: 3, first: true },
      { buoi: 'Sáng', label: '4–6', min: 4, max: 6, first: false },
      { buoi: 'Chiều', label: '1–3', min: 7, max: 9, first: true },
      { buoi: 'Chiều', label: '4–6', min: 10, max: 12, first: false },
    ];

    const events = scheduleData.map((item, index) => ({
      dayOfWeek: item.dayOfWeek,
      startPeriod: item.startPeriod,
      endPeriod: item.endPeriod,
      shortName: item.courseName || item.courseCode || item.sectionCode || 'Môn học',
      title: `${item.courseName || item.courseCode || 'Lịch dạy'} – ${item.sectionCode || ''}`,
      background: COLORS[index % COLORS.length],
      textColor: TEXT_COLORS[index % TEXT_COLORS.length],
    }));

    let tableHtml = '<div class="table-responsive"><table class="reg-schedule-matrix w-100">' +
      '<thead><tr>' +
      '<th style="width:90px">Buổi</th><th style="width:60px">Tiết</th>' +
      '<th>T2</th><th>T3</th><th>T4</th><th>T5</th><th>T6</th><th>T7</th>' +
      '</tr></thead><tbody>';

    periodGroups.forEach(pg => {
      tableHtml += '<tr>';
      if (pg.first) {
        tableHtml += `<td rowspan="2" style="white-space:nowrap; font-weight:600; vertical-align:middle; text-align:center; background:#f8f9fa; border-right:1px solid #dee2e6;">${pg.buoi}</td>`;
      }
      tableHtml += `<td class="text-muted" style="white-space:nowrap; font-size:0.82rem; vertical-align:middle; text-align:center;">${pg.label}</td>`;

      for (let d = 2; d <= 7; d++) {
        const matched = events.filter(ev =>
          ev.dayOfWeek === d &&
          ev.startPeriod <= pg.max &&
          ev.endPeriod >= pg.min
        );

        if (matched.length > 0) {
          const block = matched[0];
          const shortName = block.shortName.length > 14
            ? `${block.shortName.substring(0, 14)}...`
            : block.shortName;
          const conflictClass = matched.length > 1 ? ' conflict' : '';
          tableHtml += `<td>
            <div class="reg-cell-event${conflictClass}" style="background:${block.background}; color:${block.textColor}" title="${matched.map(e => e.title).join(' | ')}">
              ${shortName}
            </div>
          </td>`;
        } else {
          tableHtml += '<td></td>';
        }
      }
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table></div>';

    // Summary info
    const uniqueCourses = new Set(scheduleData.map(s => s.courseName || s.courseCode || ''));
    const summaryHtml = '<div class="mb-3 d-flex gap-3 flex-wrap">' +
      '<span class="badge bg-primary fs-6 px-3 py-2"><i class="bi bi-journal-text me-1"></i>' + uniqueCourses.size + ' môn học</span>' +
      '<span class="badge bg-info fs-6 px-3 py-2"><i class="bi bi-clock me-1"></i>' + scheduleData.length + ' buổi dạy/tuần</span>' +
      '</div>';

    refs.lecturerScheduleContent.innerHTML = summaryHtml + tableHtml;
  }

  function renderEmptyState() {
    if (refs.lecturerScheduleContent) {
      refs.lecturerScheduleContent.innerHTML =
        '<div class="text-muted text-center py-4"><i class="bi bi-calendar-x fs-1 d-block mb-2"></i>Chưa có dữ liệu học kỳ.</div>';
    }
  }

  function bindEvents() {
    if (refs.lecturerScheduleSemesterFilter) {
      refs.lecturerScheduleSemesterFilter.addEventListener('change', (e) => {
        currentSemesterId = e.target.value;
        fetchMySchedule();
      });
    }
  }

  function showUnauthorizedState() {
    if (refs.lecturerScheduleContent) {
      refs.lecturerScheduleContent.innerHTML =
        '<div class="alert alert-danger">Không có quyền truy cập.</div>';
    }
  }

  function resetLoggedOutState() {
    scheduleData = [];
    currentSemesterId = '';
    semesters = [];
    if (refs.lecturerScheduleSemesterFilter) {
      refs.lecturerScheduleSemesterFilter.innerHTML = '<option value="">-- Chọn học kỳ --</option>';
    }
    if (refs.lecturerScheduleContent) {
      refs.lecturerScheduleContent.innerHTML = '';
    }
  }

  return {
    loadSchedule,
    bindEvents,
    showUnauthorizedState,
    resetLoggedOutState,
  };
}
