export function createCourseRegistrationsFeature({ state, refs, auth, showError, clearError }) {
    const API_BASE = '/api/registrations';
    const DAYS = ['', '', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const COLORS = ['#e0e7ff', '#dbfafe', '#dcfce7', '#fef3c7', '#fee2e2', '#f3e8ff'];
    const TEXT_COLORS = ['#3730a3', '#1e40af', '#166534', '#92400e', '#991b1b', '#6b21a8'];

    let cart = [];
    let allSections = [];
    let departments = [];
    let semesters = [];
    let trainingPrograms = [];
    let enrolledSchedule = [];
    let activeDepartment = '';
    let currentSemesterId = '';
    let currentTrainingProgramId = '';

    function authHeaders() {
        return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.authState.token };
    }

    async function loadCourseRegistrations() {
        if (!state.authState || !state.authState.token) return;
        
        clearError();
        refs.courseList.innerHTML = '<div style="text-align:center; padding:2rem; color: #94a3b8;"><i class="fas fa-spinner fa-spin"></i> Đang tải danh sách học kỳ...</div>';
        
        try {
            const semRes = await fetch('/api/semesters', { headers: authHeaders() });
            if (semRes.ok) {
                semesters = await semRes.json();
                renderSemesterFilter();
            }

            const tpRes = await fetch('/api/training-programs', { headers: authHeaders() });
            if (tpRes.ok) {
                trainingPrograms = await tpRes.json();
                renderTrainingProgramFilter();
            }

            const depRes = await fetch('/api/departments', { headers: authHeaders() });
            if (depRes.ok) {
                departments = await depRes.json();
                renderDepartmentFilter();
            }
            
            if (currentSemesterId) {
                await Promise.all([fetchSections(), fetchMySchedule()]);
            } else {
                refs.courseList.innerHTML = '<div style="text-align:center; padding:2rem; color: #94a3b8;">Vui lòng chọn học kỳ để xem danh sách môn học.</div>';
            }
            renderScheduleGrid();
        } catch (e) {
            console.error('API Error:', e);
            refs.courseList.innerHTML = '<div style="text-align:center; padding:2rem; color: #94a3b8;">Lỗi tải dữ liệu. Bạn đã đăng nhập bằng sinh viên chưa?</div>';
        }
    }

    async function fetchSections() {
        if (!currentSemesterId) return;
        refs.courseList.innerHTML = '<div style="text-align:center; padding:2rem; color: #94a3b8;"><i class="bi bi-arrow-repeat spin"></i> Đang tải...</div>';
        try {
            let url = `${API_BASE}/sections?semesterId=${currentSemesterId}`;
            if (activeDepartment) {
                url += `&departmentId=${activeDepartment}`;
            }
            const secRes = await fetch(url, { headers: authHeaders() });
            if (secRes.ok) {
                allSections = await secRes.json();
            } else if (secRes.status === 401) {
                showError('Session Expired. Please login as a STUDENT.');
            } else if (secRes.status === 403) {
                showError('Chỉ Sinh Viên mới được đăng ký học phần.');
            } else {
                showError('Error loading sections');
            }
            applyFilters();
        } catch (e) {
            console.error(e);
            showError('Network error loading sections');
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
                showError('Session Expired. Please login as a STUDENT.');
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

    function renderSemesterFilter() {
        let html = '<option value="">Chọn Học kỳ</option>';
        semesters.forEach(s => {
            html += `<option value="${s.id}">${s.schoolYearName || s.name}</option>`;
        });
        refs.semesterFilter.innerHTML = html;
        if (semesters.length > 0) {
            refs.semesterFilter.value = semesters[0].id;
            currentSemesterId = semesters[0].id;
        }
    }

    function renderTrainingProgramFilter() {
        let html = '<option value="">Tất cả CTĐT</option>';
        trainingPrograms.forEach(tp => {
            html += `<option value="${tp.id}">${tp.code} - ${tp.name}</option>`;
        });
        refs.trainingProgramFilter.innerHTML = html;
    }

    function renderDepartmentFilter() {
        let html = '<option value="">Tất cả Khoa</option>';
        departments.forEach(d => {
            html += `<option value="${d.id}">${d.name}</option>`;
        });
        refs.regDepartmentFilter.innerHTML = html;
        refs.regDepartmentFilter.value = activeDepartment;
    }

    function applyFilters() {
        const keyword = (refs.regSearchInput.value || '').toLowerCase();
        let filtered = allSections.filter(s => {
            if (keyword && !(s.courseName || '').toLowerCase().includes(keyword) 
                && !(s.courseCode || '').toLowerCase().includes(keyword)) return false;
            if (activeDepartment && s.departmentId !== activeDepartment) return false;
            if (currentTrainingProgramId && s.trainingProgramId && s.trainingProgramId !== currentTrainingProgramId) return false;
            return true;
        });
        renderSections(filtered);
    }

    function renderSections(sections) {
        const selectedSem = refs.semesterFilter.options[refs.semesterFilter.selectedIndex]?.text || '';
        refs.courseSummaryText.textContent = `${selectedSem} · ${sections.length} học phần`;

        if (sections.length === 0) {
            refs.courseList.innerHTML = '<div style="text-align:center; padding:2rem; color: #94a3b8;">Không tìm thấy học phần nào</div>';
            return;
        }

        refs.courseList.innerHTML = sections.map(s => {
            const inCart = cart.some(c => c.sectionId === s.sectionId);
            const remaining = s.remainingSlots;
            const schedulesStr = (s.schedules || []).map(sc => `${DAYS[sc.dayOfWeek]} · Tiết ${sc.startPeriod}-${sc.endPeriod}`).join(', ');
            
            let btnClass = 'reg-btn-add', btnText = '+ Thêm', cardClass = '', statusClass = 'reg-seat-green', statusText = `Còn ${remaining} chỗ`;
            
            if (inCart) {
                btnClass = 'reg-btn-selected'; btnText = 'Bỏ chọn'; cardClass = 'status-selected';
            } else if (remaining <= 0) {
                btnClass = 'reg-btn-disabled'; btnText = 'Hết chỗ'; statusClass = 'reg-seat-red'; statusText = 'Hết chỗ';
            }

            return `
            <div class="reg-course-card ${cardClass}">
                <div class="reg-course-info">
                    <h3>${s.courseName || '--'} <span class="reg-course-code">${s.sectionCode || s.courseCode || ''}</span></h3>
                    <div class="reg-course-meta">
                        ${s.lecturerName || 'TBA'} · ${schedulesStr}
                    </div>
                </div>
                <div class="reg-course-action">
                    <div style="display:flex; align-items:center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <span class="reg-credit-badge">${s.credits || 0} tín chỉ</span>
                    </div>
                    <div style="display:flex; align-items:center; gap: 0.75rem;">
                        <span class="reg-seat-badge ${statusClass}">${statusText}</span>
                        <button class="reg-btn-action ${btnClass}" data-action="toggle-cart" data-id="${s.sectionId}" ${remaining<=0 && !inCart ? 'disabled':''}>${btnText}</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    async function toggleCart(sectionId) {
        const inCartIndex = cart.findIndex(c => c.sectionId === sectionId);
        if (inCartIndex >= 0) {
            cart.splice(inCartIndex, 1);
            updateCartAndSchedule();
        } else {
            const section = allSections.find(s => s.sectionId === sectionId);
            if (!section) return;

            const validRes = await validateCartOnline(sectionId);
            if (!validRes.valid) {
                if (window.Swal) {
                    Swal.fire({
                        toast: true, position: 'top-end', icon: 'error',
                        title: validRes.message || 'Lỗi thêm học phần',
                        showConfirmButton: false, timer: 3000
                    });
                } else {
                    alert(validRes.message || 'Lỗi thêm học phần');
                }
                return;
            }

            const colorIdx = cart.length % COLORS.length;
            section._bg = COLORS[colorIdx];
            section._tc = TEXT_COLORS[colorIdx];
            cart.push(section);
            updateCartAndSchedule();
        }
    }

    async function validateCartOnline(sectionId) {
        try {
            const res = await fetch(`${API_BASE}/cart/validate`, {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ sectionId: sectionId, cartSectionIds: cart.map(c => c.sectionId) })
            });
            return await res.json();
        } catch(e) {
            return {valid: false, message: 'Server error'};
        }
    }

    function updateCartAndSchedule() {
        refs.cartCount.textContent = `${cart.length} môn`;
        
        let totalCredits = cart.reduce((sum, c) => sum + (c.credits || 0), 0);
        refs.regTotalCreditsText.textContent = `${totalCredits} tín chỉ`;
        
        refs.btnSubmitRegistration.disabled = cart.length === 0;

        if (cart.length === 0) {
            refs.cartItems.innerHTML = '<div style="padding: 1rem; color: #94a3b8; text-align: center;">Giỏ trống</div>';
        } else {
            refs.cartItems.innerHTML = cart.map(c => `
                <div class="reg-cart-item">
                    <div>
                        <h4>${c.courseName}</h4>
                        <p>${c.credits} tín chỉ · ${c.courseCode}</p>
                    </div>
                    <button class="reg-btn-remove" data-action="toggle-cart" data-id="${c.sectionId}">&times;</button>
                </div>
            `).join('');
        }

        applyFilters(); 
        renderScheduleGrid();
    }

    function buildScheduleEvents() {
        const registeredEvents = enrolledSchedule.map((item, index) => ({
            dayOfWeek: item.dayOfWeek,
            startPeriod: item.startPeriod,
            endPeriod: item.endPeriod,
            shortName: item.courseCode || item.sectionCode || 'REG',
            title: `${item.courseName || item.courseCode || item.sectionCode || 'Lịch học'} (${item.sectionCode || 'Đã đăng ký'})`,
            background: '#dbeafe',
            textColor: '#1d4ed8',
            type: 'registered',
            order: index
        }));

        const cartEvents = cart.flatMap((course, index) =>
            (course.schedules || []).map((schedule) => ({
                dayOfWeek: schedule.dayOfWeek,
                startPeriod: schedule.startPeriod,
                endPeriod: schedule.endPeriod,
                shortName: course.courseCode || course.sectionCode || 'NEW',
                title: `${course.courseName || course.courseCode || 'Môn học'} (${course.sectionCode || 'Giỏ đăng ký'})`,
                background: course._bg || COLORS[index % COLORS.length],
                textColor: course._tc || TEXT_COLORS[index % TEXT_COLORS.length],
                type: 'cart',
                order: index
            }))
        );

        return [...registeredEvents, ...cartEvents];
    }

    function renderScheduleGrid() {
        const periodGroups = [
            { label: '1-2', min: 1, max: 2 },
            { label: '3-4', min: 3, max: 4 },
            { label: '5-6', min: 5, max: 6 },
            { label: '7-8', min: 7, max: 8 },
            { label: '9-10', min: 9, max: 10 }
        ];
        const scheduleEvents = buildScheduleEvents();

        let html = '';
        periodGroups.forEach(pg => {
            html += `<tr><td>${pg.label}</td>`;
            for (let d = 2; d <= 7; d++) {
                const matchedEvents = scheduleEvents
                    .filter((event) =>
                        event.dayOfWeek === d
                        && event.startPeriod <= pg.max
                        && event.endPeriod >= pg.min
                    )
                    .sort((a, b) => {
                        if (a.type === b.type) {
                            return a.order - b.order;
                        }
                        return a.type === 'cart' ? -1 : 1;
                    });

                if (matchedEvents.length > 0) {
                    const block = matchedEvents[0];
                    const shortName = block.shortName.length > 6
                        ? `${block.shortName.substring(0, 6)}...`
                        : block.shortName;
                    const conflictClass = matchedEvents.length > 1 ? ' conflict' : '';
                    html += `<td>
                        <div class="reg-cell-event${conflictClass}" style="background:${block.background}; color:${block.textColor}" title="${matchedEvents.map((event) => event.title).join(' | ')}">
                           ${shortName}
                        </div>
                    </td>`;
                } else {
                    html += `<td></td>`;
                }
            }
            html += `</tr>`;
        });
        refs.regScheduleBody.innerHTML = html;
    }

    async function submitRegistration() {
        if (cart.length === 0) return;
        
        refs.btnSubmitRegistration.disabled = true;
        refs.btnSubmitRegistration.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Xử lý...';
        
        try {
            const res = await fetch(`${API_BASE}/submit`, {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ sectionIds: cart.map(c => c.sectionId) })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                if (window.Swal) Swal.fire('Thành công!', data.message || 'Đã đăng ký thành công.', 'success');
                else alert(data.message || 'Đã đăng ký thành công.');
                
                cart = [];
                updateCartAndSchedule();
                await Promise.all([fetchSections(), fetchMySchedule()]);
            } else {
                let msg = data.message || 'Lỗi không xác định.';
                if (res.status === 403) msg = "Access Denied: Chỉ học sinh mới được đăng ký mạng.";
                if (window.Swal) Swal.fire('Lỗi', msg, 'error');
                else alert('Lỗi: ' + msg);
            }
        } catch(e) {
            if (window.Swal) Swal.fire('Lỗi', 'Không kết nối được đến máy chủ', 'error');
            else alert('Lỗi: Không kết nối được đến máy chủ');
        }
        
        refs.btnSubmitRegistration.disabled = cart.length === 0;
        refs.btnSubmitRegistration.innerHTML = 'Xác nhận đăng ký';
    }

    function bindEvents() {
        refs.regBtnToggleFilters.addEventListener('click', () => {
            refs.regSearchContainer.style.display = refs.regSearchContainer.style.display === 'none' ? 'block' : 'none';
        });

        refs.regSearchInput.addEventListener('input', applyFilters);
        refs.btnSubmitRegistration.addEventListener('click', submitRegistration);

        refs.semesterFilter.addEventListener('change', (e) => {
            currentSemesterId = e.target.value;
            Promise.all([fetchSections(), fetchMySchedule()]);
        });

        refs.trainingProgramFilter.addEventListener('change', (e) => {
            currentTrainingProgramId = e.target.value;
            applyFilters();
        });

        refs.regDepartmentFilter.addEventListener('change', (e) => {
            activeDepartment = e.target.value;
            fetchSections();
        });

        // Use event delegation for toggle-cart buttons since they are re-rendered
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="toggle-cart"]')) {
                const btn = e.target.closest('[data-action="toggle-cart"]');
                const id = btn.getAttribute('data-id');
                if (id) toggleCart(id);
            }
        });
    }

    function showUnauthorizedState() {
        refs.courseList.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Vui lòng đăng nhập với quyền Sinh viên</td></tr>';
    }

    function resetLoggedOutState() {
        cart = [];
        allSections = [];
        departments = [];
        semesters = [];
        trainingPrograms = [];
        enrolledSchedule = [];
        activeDepartment = '';
        currentSemesterId = '';
        currentTrainingProgramId = '';
        
        refs.courseList.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Đang tải...</td></tr>';
        refs.cartItems.innerHTML = '<div style="padding: 1rem; color: #94a3b8; text-align: center;">Giỏ trống</div>';
        refs.regTotalCreditsText.textContent = '0 tín chỉ';
        refs.cartCount.textContent = '0 môn';
        refs.btnSubmitRegistration.disabled = true;
    }

    return {
        loadCourseRegistrations,
        bindEvents,
        showUnauthorizedState,
        resetLoggedOutState
    };
}
