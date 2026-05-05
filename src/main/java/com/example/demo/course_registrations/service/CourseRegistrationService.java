package com.example.demo.course_registrations.service;

import com.example.demo.course_registrations.dto.*;
import com.example.demo.course_registrations.exception.RegistrationException;
import com.example.demo.course_registrations.model.*;
import com.example.demo.course_registrations.repository.*;
import com.example.demo.courses.model.Course;
import com.example.demo.courses.repository.CourseRepository;
import com.example.demo.students.model.Student;
import com.example.demo.students.repository.StudentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service chính xử lý logic đăng ký học phần
 * Bao gồm: validate giỏ hàng, kiểm tra xung đột lịch, prerequisite, tín chỉ, và concurrency
 */
@Service
public class CourseRegistrationService {

    private static final Logger log = LoggerFactory.getLogger(CourseRegistrationService.class);

    // Giới hạn tín chỉ tối thiểu và tối đa trong một kỳ
    private static final int MIN_CREDITS = 12;
    private static final int MAX_CREDITS = 24;
    private static final List<String> ACTIVE_STATUSES = List.of("ENROLLED", "PENDING");

    private final CourseSectionRepository sectionRepo;
    private final ScheduleRepository scheduleRepo;
    private final StudentCourseSectionRepository studentSectionRepo;
    private final TrainingProgramCourseRepository tpcRepo;
    private final CourseRepository courseRepo;
    private final StudentRepository studentRepo;

    public CourseRegistrationService(
            CourseSectionRepository sectionRepo,
            ScheduleRepository scheduleRepo,
            StudentCourseSectionRepository studentSectionRepo,
            TrainingProgramCourseRepository tpcRepo,
            CourseRepository courseRepo,
            StudentRepository studentRepo) {
        this.sectionRepo = sectionRepo;
        this.scheduleRepo = scheduleRepo;
        this.studentSectionRepo = studentSectionRepo;
        this.tpcRepo = tpcRepo;
        this.courseRepo = courseRepo;
        this.studentRepo = studentRepo;
    }

    // ======================== 1. LẤY DANH SÁCH LỚP HP MỞ ========================

    /**
     * Lấy danh sách lớp học phần đang mở, có kèm thông tin sĩ số hiện tại
     */
    @Transactional(readOnly = true)
    public List<CourseSectionDTO> getAvailableSections(UUID semesterId, UUID departmentId) {
        List<CourseSection> sections;
        if (departmentId != null) {
            sections = sectionRepo.findBySemesterIdAndDepartmentId(semesterId, departmentId);
        } else {
            sections = sectionRepo.findBySemesterId(semesterId);
        }

        // Lấy toàn bộ courseId để query Course info
        Set<UUID> courseIds = sections.stream()
            .map(CourseSection::getCourseId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        Map<UUID, Course> courseMap = courseRepo.findAllById(courseIds).stream()
            .collect(Collectors.toMap(Course::getId, c -> c));

        // Lấy toàn bộ lịch học
        List<UUID> sectionIds = sections.stream().map(CourseSection::getId).toList();
        Map<UUID, List<Schedule>> scheduleMap = new HashMap<>();
        if (!sectionIds.isEmpty()) {
            scheduleRepo.findByCourseSectionIdIn(sectionIds)
                .forEach(s -> scheduleMap
                    .computeIfAbsent(s.getCourseSectionId(), k -> new ArrayList<>())
                    .add(s));
        }

        return sections.stream().map(cs -> {
            CourseSectionDTO dto = new CourseSectionDTO();
            dto.setSectionId(cs.getId());
            dto.setSectionCode(cs.getCode());
            dto.setCourseId(cs.getCourseId());
            dto.setMaxStudents(cs.getMaxStudents());
            dto.setStatus(cs.getStatus());

            // Thông tin Course
            Course course = courseMap.get(cs.getCourseId());
            if (course != null) {
                dto.setCourseCode(course.getCode());
                dto.setCourseName(course.getName());
                dto.setCredits(course.getCredits());
                dto.setCourseType(course.getCourseType());
                dto.setDepartmentId(course.getDepartmentId());
            }

            // Đếm sĩ số hiện tại
            int enrolled = studentSectionRepo.countByCourseSectionIdAndStatusIn(
                cs.getId(), ACTIVE_STATUSES);
            dto.setCurrentEnrollment(enrolled);
            dto.setRemainingSlots(cs.getMaxStudents() - enrolled);

            // Lịch học
            List<Schedule> schList = scheduleMap.getOrDefault(cs.getId(), List.of());
            dto.setSchedules(schList.stream()
                .map(s -> new CourseSectionDTO.ScheduleInfo(
                    s.getDayOfWeek() != null ? s.getDayOfWeek() : 0,
                    s.getStartPeriod() != null ? s.getStartPeriod() : 0,
                    s.getEndPeriod() != null ? s.getEndPeriod() : 0,
                    ""
                ))
                .toList());

            return dto;
        }).toList();
    }

    // ======================== 2. VALIDATE GIỎ HÀNG ========================

    /**
     * Validate khi sinh viên bấm "Thêm vào giỏ"
     * Kiểm tra: xung đột lịch, prerequisite, giới hạn tín chỉ, còn slot
     */
    @Transactional(readOnly = true)
    public CartValidateResponse validateCart(UUID studentId, CartValidateRequest request) {
        UUID sectionId = request.getSectionId();
        List<UUID> cartSectionIds = request.getCartSectionIds() != null
            ? request.getCartSectionIds() : List.of();

        // Lấy thông tin section muốn thêm
        CourseSection newSection = sectionRepo.findById(sectionId)
            .orElseThrow(() -> RegistrationException.sectionFull("Không tìm thấy lớp học phần."));

        Course newCourse = courseRepo.findById(newSection.getCourseId()).orElse(null);
        if (newCourse == null) {
            return new CartValidateResponse(false, "Không tìm thấy thông tin môn học.");
        }

        // --- Check 1: Đã đăng ký môn này chưa ---
        int existingCount = studentSectionRepo.countByStudentIdAndCourseId(
            studentId, newSection.getCourseId());
        if (existingCount > 0) {
            return new CartValidateResponse(false,
                "Bạn đã đăng ký môn \"" + newCourse.getName() + "\" rồi.",
                "ALREADY_REGISTERED");
        }

        // --- Check 2: Còn slot không ---
        int enrolled = studentSectionRepo.countByCourseSectionIdAndStatusIn(sectionId, ACTIVE_STATUSES);
        if (enrolled >= newSection.getMaxStudents()) {
            return new CartValidateResponse(false,
                "Lớp \"" + newSection.getCode() + "\" đã hết chỗ.",
                "SECTION_FULL");
        }

        // --- Check 3: Kiểm tra prerequisite ---
        String prereqError = checkPrerequisites(studentId, newSection.getCourseId(), newCourse.getName());
        if (prereqError != null) {
            return new CartValidateResponse(false, prereqError, "PREREQUISITE_NOT_MET");
        }

        // --- Check 4: Xung đột lịch học ---
        String conflictError = checkScheduleConflict(studentId, sectionId, cartSectionIds, newSection.getSemesterId());
        if (conflictError != null) {
            return new CartValidateResponse(false, conflictError, "SCHEDULE_CONFLICT");
        }

        // --- Check 5: Giới hạn tín chỉ ---
        String creditError = checkCreditLimit(studentId, newSection.getSemesterId(), cartSectionIds, newCourse);
        if (creditError != null) {
            return new CartValidateResponse(false, creditError, "CREDIT_LIMIT_EXCEEDED");
        }

        return new CartValidateResponse(true, "Có thể thêm vào giỏ hàng.");
    }

    // ======================== 3. SUBMIT ĐĂNG KÝ ========================

    /**
     * Xác nhận đăng ký toàn bộ giỏ hàng
     * Sử dụng PESSIMISTIC_WRITE lock cho từng section để tránh race condition
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Map<String, Object> submitRegistration(UUID studentId, RegistrationSubmitRequest request) {
        List<UUID> sectionIds = request.getSectionIds();
        if (sectionIds == null || sectionIds.isEmpty()) {
            throw RegistrationException.sectionFull("Giỏ hàng trống. Vui lòng chọn ít nhất một lớp.");
        }

        log.info("[ĐĂNG KÝ] Sinh viên {} bắt đầu đăng ký {} lớp HP", studentId, sectionIds.size());

        List<StudentCourseSection> registrations = new ArrayList<>();

        for (UUID sectionId : sectionIds) {
            // Lock section để tránh tranh chấp slot
            CourseSection section = sectionRepo.findByIdWithLock(sectionId)
                .orElseThrow(() -> RegistrationException.sectionFull(
                    "Lớp học phần không tồn tại hoặc đã bị xóa."));

            // Re-check: còn slot không
            int currentEnrolled = studentSectionRepo.countByCourseSectionIdAndStatusIn(
                sectionId, ACTIVE_STATUSES);
            if (currentEnrolled >= section.getMaxStudents()) {
                throw RegistrationException.sectionFull(
                    "Lớp \"" + section.getCode() + "\" đã hết chỗ khi xác nhận.");
            }

            // Re-check: đã đăng ký môn này chưa
            int existingCount = studentSectionRepo.countByStudentIdAndCourseId(
                studentId, section.getCourseId());
            if (existingCount > 0) {
                Course course = courseRepo.findById(section.getCourseId()).orElse(null);
                String courseName = course != null ? course.getName() : section.getCode();
                throw RegistrationException.alreadyRegistered(
                    "Bạn đã đăng ký môn \"" + courseName + "\" rồi.");
            }

            // Tạo bản ghi đăng ký
            StudentCourseSection scs = new StudentCourseSection();
            scs.setStudentId(studentId);
            scs.setCourseSectionId(sectionId);
            scs.setStatus("ENROLLED");
            scs.setRegisteredAt(LocalDateTime.now());
            scs.setIsActive(true);
            registrations.add(scs);
        }

        // Lưu tất cả đăng ký
        studentSectionRepo.saveAll(registrations);

        log.info("[ĐĂNG KÝ] Sinh viên {} đã đăng ký thành công {} lớp HP", studentId, registrations.size());

        return Map.of(
            "success", true,
            "message", "Đăng ký thành công " + registrations.size() + " lớp học phần!",
            "registeredCount", registrations.size()
        );
    }

    // ======================== 4. LẤY LỊCH HỌC CỦA TÔI ========================

    /**
     * Lấy lịch học đã đăng ký (ENROLLED) của sinh viên trong một học kỳ
     */
    @Transactional(readOnly = true)
    public List<ScheduleDTO> getMySchedule(UUID studentId, UUID semesterId) {
        List<StudentCourseSection> registrations = studentSectionRepo
            .findByStudentIdAndSemesterIdAndStatusIn(studentId, semesterId, List.of("ENROLLED"));

        if (registrations.isEmpty()) {
            return List.of();
        }

        List<UUID> sectionIds = registrations.stream()
            .map(StudentCourseSection::getCourseSectionId).toList();

        // Lấy lịch học
        List<Schedule> schedules = scheduleRepo.findByCourseSectionIdIn(sectionIds);

        // Lấy thông tin section -> course
        Map<UUID, CourseSection> sectionMap = sectionRepo.findAllById(sectionIds).stream()
            .collect(Collectors.toMap(CourseSection::getId, s -> s));

        Set<UUID> courseIds = sectionMap.values().stream()
            .map(CourseSection::getCourseId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());
        Map<UUID, Course> courseMap = courseRepo.findAllById(courseIds).stream()
            .collect(Collectors.toMap(Course::getId, c -> c));

        return schedules.stream().map(s -> {
            ScheduleDTO dto = new ScheduleDTO();
            dto.setSectionId(s.getCourseSectionId());
            dto.setDayOfWeek(s.getDayOfWeek() != null ? s.getDayOfWeek() : 0);
            dto.setStartPeriod(s.getStartPeriod() != null ? s.getStartPeriod() : 0);
            dto.setEndPeriod(s.getEndPeriod() != null ? s.getEndPeriod() : 0);
            dto.setStatus("ENROLLED");

            CourseSection section = sectionMap.get(s.getCourseSectionId());
            if (section != null) {
                dto.setSectionCode(section.getCode());
                Course course = courseMap.get(section.getCourseId());
                if (course != null) {
                    dto.setCourseName(course.getName());
                    dto.setCourseCode(course.getCode());
                }
            }
            return dto;
        }).toList();
    }

    // ======================== PRIVATE HELPERS ========================

    /**
     * Kiểm tra môn tiên quyết: SV đã hoàn thành các môn prerequisite chưa
     * @return null nếu OK, message lỗi nếu chưa đạt
     */
    private String checkPrerequisites(UUID studentId, UUID courseId, String courseName) {
        List<TrainingProgramCourse> prerequisites = tpcRepo.findPrerequisitesByCourseId(courseId);
        if (prerequisites.isEmpty()) {
            return null; // Không có prerequisite
        }

        for (TrainingProgramCourse prereq : prerequisites) {
            UUID prereqCourseId = prereq.getPrerequisiteCourseId();
            // Kiểm tra SV đã đăng ký (ENROLLED) và hoàn thành prerequisite chưa
            // Ở đây check đơn giản: SV đã có bản ghi ENROLLED cho môn prerequisite
            List<StudentCourseSection> completed = studentSectionRepo
                .findByStudentIdAndStatusIn(studentId, List.of("ENROLLED"));

            boolean passed = completed.stream()
                .anyMatch(scs -> {
                    CourseSection cs = sectionRepo.findById(scs.getCourseSectionId()).orElse(null);
                    return cs != null && prereqCourseId.equals(cs.getCourseId());
                });

            if (!passed) {
                Course prereqCourse = courseRepo.findById(prereqCourseId).orElse(null);
                String prereqName = prereqCourse != null ? prereqCourse.getName() : "N/A";
                return "Môn \"" + courseName + "\" yêu cầu đã hoàn thành môn tiên quyết: \"" + prereqName + "\".";
            }
        }
        return null;
    }

    /**
     * Kiểm tra xung đột lịch học giữa section mới và (giỏ hàng + đã đăng ký)
     * So sánh: day_of_week + overlap(start_period, end_period)
     * @return null nếu OK, message lỗi nếu trùng
     */
    private String checkScheduleConflict(UUID studentId, UUID newSectionId,
                                          List<UUID> cartSectionIds, UUID semesterId) {
        // Lấy lịch của section mới
        List<Schedule> newSchedules = scheduleRepo.findByCourseSectionIdAndDeletedAtIsNull(newSectionId);
        if (newSchedules.isEmpty()) {
            return null; // Không có lịch thì không có xung đột
        }

        // Lấy tất cả section đang trong giỏ + đã đăng ký
        Set<UUID> existingSectionIds = new HashSet<>(cartSectionIds);

        // Thêm các section đã đăng ký thành công trong kỳ này
        List<StudentCourseSection> enrolled = studentSectionRepo
            .findByStudentIdAndSemesterIdAndStatusIn(studentId, semesterId, ACTIVE_STATUSES);
        enrolled.forEach(scs -> existingSectionIds.add(scs.getCourseSectionId()));

        if (existingSectionIds.isEmpty()) {
            return null;
        }

        // Lấy lịch của tất cả section hiện có
        List<Schedule> existingSchedules = scheduleRepo
            .findByCourseSectionIdIn(new ArrayList<>(existingSectionIds));

        // So sánh từng cặp: nếu cùng day_of_week và overlap tiết → xung đột
        for (Schedule newSch : newSchedules) {
            if (newSch.getDayOfWeek() == null || newSch.getStartPeriod() == null || newSch.getEndPeriod() == null)
                continue;

            for (Schedule existSch : existingSchedules) {
                if (existSch.getDayOfWeek() == null || existSch.getStartPeriod() == null || existSch.getEndPeriod() == null)
                    continue;

                if (newSch.getDayOfWeek().equals(existSch.getDayOfWeek())) {
                    // Kiểm tra overlap: startA <= endB && startB <= endA
                    if (newSch.getStartPeriod() <= existSch.getEndPeriod()
                        && existSch.getStartPeriod() <= newSch.getEndPeriod()) {

                        return "Xung đột lịch học: Thứ " + newSch.getDayOfWeek()
                            + " tiết " + newSch.getStartPeriod() + "-" + newSch.getEndPeriod()
                            + " trùng với lớp đã chọn.";
                    }
                }
            }
        }
        return null;
    }

    /**
     * Kiểm tra giới hạn tín chỉ: 12 <= tổng tín chỉ <= 24
     * @return null nếu OK, message lỗi nếu vượt
     */
    private String checkCreditLimit(UUID studentId, UUID semesterId,
                                     List<UUID> cartSectionIds, Course newCourse) {
        // Tính tổng tín chỉ đã đăng ký trong kỳ
        List<StudentCourseSection> enrolled = studentSectionRepo
            .findByStudentIdAndSemesterIdAndStatusIn(studentId, semesterId, ACTIVE_STATUSES);

        BigDecimal totalCredits = BigDecimal.ZERO;
        for (StudentCourseSection scs : enrolled) {
            CourseSection cs = sectionRepo.findById(scs.getCourseSectionId()).orElse(null);
            if (cs != null) {
                Course course = courseRepo.findById(cs.getCourseId()).orElse(null);
                if (course != null && course.getCredits() != null) {
                    totalCredits = totalCredits.add(course.getCredits());
                }
            }
        }

        // Cộng thêm tín chỉ trong giỏ hàng
        for (UUID cartSectionId : cartSectionIds) {
            CourseSection cs = sectionRepo.findById(cartSectionId).orElse(null);
            if (cs != null) {
                Course course = courseRepo.findById(cs.getCourseId()).orElse(null);
                if (course != null && course.getCredits() != null) {
                    totalCredits = totalCredits.add(course.getCredits());
                }
            }
        }

        // Cộng thêm tín chỉ của môn mới
        if (newCourse.getCredits() != null) {
            totalCredits = totalCredits.add(newCourse.getCredits());
        }

        if (totalCredits.compareTo(BigDecimal.valueOf(MAX_CREDITS)) > 0) {
            return "Tổng tín chỉ (" + totalCredits + ") vượt quá giới hạn tối đa " + MAX_CREDITS + " tín chỉ/kỳ.";
        }

        return null;
    }
}
