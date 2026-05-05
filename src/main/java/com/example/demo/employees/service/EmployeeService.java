package com.example.demo.employees.service;

import com.example.demo.department.model.Department;
import com.example.demo.department.repository.DepartmentRepository;
import com.example.demo.employees.model.Employee;
import com.example.demo.employees.model.Position;
import com.example.demo.employees.repository.EmployeeRepository;
import com.example.demo.employees.repository.PositionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import com.example.demo.users.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository repo;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final UserRepository userRepository;

    public EmployeeService(EmployeeRepository repo,
                           DepartmentRepository departmentRepository,
                           PositionRepository positionRepository,
                           UserRepository userRepository) {
        this.repo = repo;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
        this.userRepository = userRepository;
    }

    public List<Employee> getAll() {
        List<Employee> employees = repo.findAll().stream()
            .filter(e -> e.getDeletedAt() == null)
            .filter(e -> e.getIsActive() == null || Boolean.TRUE.equals(e.getIsActive()))
            .collect(Collectors.toList());
        attachNames(employees);
        return employees;
    }

    public Employee getById(UUID id) {
        Employee employee = repo.findByIdAndDeletedAtIsNull(id).orElse(null);
        if (employee != null) {
            attachName(employee);
        }
        return employee;
    }

    public Employee create(Employee employee) {
        employee.setId(null);
        employee.setIsActive(employee.getIsActive() == null ? true : employee.getIsActive());
        employee.setDeletedAt(null);
        employee.setUpdatedAt(LocalDateTime.now());
        Employee saved = repo.save(employee);
        attachName(saved);
        return saved;
    }

    public Employee update(UUID id, Employee employee) {
        Employee old = repo.findByIdAndDeletedAtIsNull(id).orElse(null);
        if (old == null) {
            return null;
        }

        if (employee.getCode() != null) old.setCode(employee.getCode());
        if (employee.getFullName() != null) old.setFullName(employee.getFullName());
        if (employee.getDateOfBirth() != null) old.setDateOfBirth(employee.getDateOfBirth());
        if (employee.getGender() != null) old.setGender(employee.getGender());
        if (employee.getEmail() != null) old.setEmail(employee.getEmail());
        if (employee.getPhone() != null) old.setPhone(employee.getPhone());
        if (employee.getAddress() != null) old.setAddress(employee.getAddress());
        old.setUserId(employee.getUserId()); // allow clearing or setting userId
        if (employee.getDepartmentId() != null) old.setDepartmentId(employee.getDepartmentId());
        if (employee.getPositionId() != null) old.setPositionId(employee.getPositionId());
        if (employee.getHireDate() != null) old.setHireDate(employee.getHireDate());
        if (employee.getContractType() != null) old.setContractType(employee.getContractType());
        if (employee.getSalaryCoefficient() != null) old.setSalaryCoefficient(employee.getSalaryCoefficient());
        if (employee.getAcademicDegree() != null) old.setAcademicDegree(employee.getAcademicDegree());
        if (employee.getAcademicTitle() != null) old.setAcademicTitle(employee.getAcademicTitle());
        if (employee.getSpecialization() != null) old.setSpecialization(employee.getSpecialization());
        old.setIsActive(employee.getIsActive() == null ? old.getIsActive() : employee.getIsActive());
        old.setUpdatedAt(LocalDateTime.now());

        Employee saved = repo.save(old);
        attachName(saved);
        return saved;
    }

    public void delete(UUID id) {
        Employee employee = repo.findByIdAndDeletedAtIsNull(id).orElse(null);
        if (employee == null) {
            return;
        }
        employee.setDeletedAt(LocalDateTime.now());
        employee.setIsActive(false);
        employee.setUpdatedAt(LocalDateTime.now());
        repo.save(employee);
    }

    public Page<Employee> search(String keyword, int page, int size) {
        return repo.searchByKeyword(keyword, PageRequest.of(page, size))
            .map(this::attachName);
    }

    private Employee attachName(Employee employee) {
        if (employee == null) return null;

        if (employee.getDepartmentId() != null) {
            departmentRepository.findById(employee.getDepartmentId())
                .ifPresent(d -> employee.setDepartmentName(d.getName()));
        }
        if (employee.getPositionId() != null) {
            positionRepository.findById(employee.getPositionId())
                .ifPresent(p -> employee.setPositionName(p.getName()));
        }
        if (employee.getUserId() != null) {
            userRepository.findById(employee.getUserId())
                .ifPresent(u -> employee.setUsername(u.getUsername()));
        }
        return employee;
    }

    private void attachNames(List<Employee> employees) {
        employees.forEach(this::attachName);
    }
}
