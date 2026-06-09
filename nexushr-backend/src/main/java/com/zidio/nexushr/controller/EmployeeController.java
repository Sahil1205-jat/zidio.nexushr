package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.Attendance;
import com.zidio.nexushr.entity.Employee;
import com.zidio.nexushr.entity.LeaveRecord;
import com.zidio.nexushr.entity.Task;
import com.zidio.nexushr.repository.AttendanceRepository;
import com.zidio.nexushr.repository.EmployeeRepository;
import com.zidio.nexushr.repository.LeaveRepository;
import com.zidio.nexushr.repository.TaskRepository;
import com.zidio.nexushr.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/employees")
@CrossOrigin(origins = "*")
public class EmployeeController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final int PASSWORD_LENGTH = 8;

    // Helper method to generate a random password
    private String generateRandomPassword() {
        SecureRandom random = new SecureRandom();
        StringBuilder password = new StringBuilder(PASSWORD_LENGTH);
        for (int i = 0; i < PASSWORD_LENGTH; i++) {
            password.append(PASSWORD_CHARS.charAt(random.nextInt(PASSWORD_CHARS.length())));
        }
        return password.toString();
    }

    // DTO for Change Password Request
    public static class ChangePasswordRequest {
        private String empCode;
        private String oldPassword;
        private String newPassword;

        public String getEmpCode() {
            return empCode;
        }

        public void setEmpCode(String empCode) {
            this.empCode = empCode;
        }

        public String getOldPassword() {
            return oldPassword;
        }

        public void setOldPassword(String oldPassword) {
            this.oldPassword = oldPassword;
        }

        public String getNewPassword() {
            return newPassword;
        }

        public void setNewPassword(String newPassword) {
            this.newPassword = newPassword;
        }
    }

    // 1. Naya Employee Add karna + Welcome Email (Async)
    @PostMapping
    public ResponseEntity<java.util.Map<String, Object>> addEmployee(@RequestBody Employee employee) {
        String randomPassword = generateRandomPassword();
        employee.setPassword(passwordEncoder.encode(randomPassword));
        Employee savedEmp = employeeRepository.save(employee);

        // Execute email sending in a background worker thread
        // This prevents the SMTP connection or server-side blocks from hanging the request thread!
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                String subject = "Your NexusHR Account Details";
                String body = "Hi " + savedEmp.getName() + ",\n\n" +
                        "Welcome to NexusHR! Your account has been successfully created.\n\n" +
                        "Here are your login credentials:\n" +
                        "Username: " + savedEmp.getEmpCode() + "\n" +
                        "Temporary Password: " + randomPassword + "\n\n" +
                        "For security reasons, please change your password after your first login.";
                emailService.sendEmail(savedEmp.getEmail(), subject, body);
            } catch (Exception e) {
                System.err.println("Async Email failed to send: " + e.getMessage());
            }
        });

        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("id", savedEmp.getId());
        response.put("empCode", savedEmp.getEmpCode());
        response.put("name", savedEmp.getName());
        response.put("email", savedEmp.getEmail());
        response.put("department", savedEmp.getDepartment());
        response.put("status", savedEmp.getStatus());
        response.put("role", savedEmp.getRole());
        response.put("hireDate", savedEmp.getHireDate() != null ? savedEmp.getHireDate().toString() : "");
        response.put("ctc", savedEmp.getCtc());
        response.put("tempPassword", randomPassword);

        return ResponseEntity.ok(response);
    }

    // 2. Saare Employees dekhna
    @GetMapping
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    // Change Password
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest request) {
        System.out.println("API: Received password change request for empCode: '" + request.getEmpCode() + "'");
        String cleanEmpCode = request.getEmpCode().trim().toUpperCase();
        Optional<Employee> employeeOpt = employeeRepository.findByEmpCode(cleanEmpCode);

        if (!employeeOpt.isPresent()) {
            System.err.println("API: Employee lookup FAILED for empCode: '" + cleanEmpCode + "'");
            return ResponseEntity.status(404).body("Employee not found.");
        }

        Employee employee = employeeOpt.get();

        if (!passwordEncoder.matches(request.getOldPassword(), employee.getPassword())) {
            return ResponseEntity.status(400).body("Incorrect current password.");
        }

        employee.setPassword(passwordEncoder.encode(request.getNewPassword()));
        employeeRepository.save(employee);

        return ResponseEntity.ok("Password changed successfully.");
    }

    // 3. Employee Delete karna (🔥 Naya Feature)
    @Transactional
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteEmployee(@PathVariable Long id) {
        // Step 1: Find the employee to get their empCode
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
        String empCode = employee.getEmpCode();

        // Step 2: Delete associated tasks
        List<Task> tasksToDelete = taskRepository.findAll().stream()
                .filter(task -> task.getAssignedTo().equalsIgnoreCase(empCode))
                .toList();
        taskRepository.deleteAll(tasksToDelete);

        // Step 3: Delete associated leave records
        List<LeaveRecord> leavesToDelete = leaveRepository.findAll().stream()
                .filter(leave -> leave.getEmpCode().equalsIgnoreCase(empCode))
                .toList();
        leaveRepository.deleteAll(leavesToDelete);

        // Step 4: Delete associated attendance records
        List<Attendance> attendanceToDelete = attendanceRepository.findAll().stream()
                .filter(att -> att.getEmpCode().equalsIgnoreCase(empCode))
                .toList();
        attendanceRepository.deleteAll(attendanceToDelete);

        // Step 5: Delete the employee record itself
        employeeRepository.delete(employee);

        return ResponseEntity.ok("Employee '" + employee.getName() + "' and all associated data have been deleted.");
    }

    // 4. EmpCode se search
    @GetMapping("/code/{empCode}")
    public Optional<Employee> getEmployeeByCode(@PathVariable String empCode) {
        String cleanEmpCode = empCode.trim().toUpperCase();
        return employeeRepository.findByEmpCode(cleanEmpCode);
    }

    // 5. CTC Update karna
    @PutMapping("/{id}/ctc")
    public Employee updateCtc(@PathVariable Long id, @RequestBody Double ctc) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        emp.setCtc(ctc);
        return employeeRepository.save(emp);
    }
}