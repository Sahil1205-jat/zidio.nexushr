package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.LeaveRecord;
import com.zidio.nexushr.repository.LeaveRepository;
import com.zidio.nexushr.repository.EmployeeRepository;
import com.zidio.nexushr.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = "*")
public class LeaveController {

    @Autowired
    private LeaveRepository repo;

    @Autowired
    private EmployeeRepository employeeRepo;

    @Autowired
    private EmailService emailService;

    @PostMapping
    public ResponseEntity<?> applyLeave(@RequestBody LeaveRecord leave) {
        if (leave.getEmpCode() == null || leave.getEmpCode().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Employee code is required.");
        }
        
        String empCode = leave.getEmpCode().trim().toUpperCase();
        if (!employeeRepo.findByEmpCode(empCode).isPresent()) {
            return ResponseEntity.badRequest().body("Employee with code '" + empCode + "' does not exist.");
        }
        
        leave.setEmpCode(empCode);
        leave.setStatus("Pending"); // Default status
        LeaveRecord saved = repo.save(leave);
        
        CompletableFuture.runAsync(() -> {
            try {
                String empName = employeeRepo.findByEmpCode(empCode)
                        .map(com.zidio.nexushr.entity.Employee::getName)
                        .orElse(empCode);

                List<com.zidio.nexushr.entity.Employee> admins = employeeRepo.findAll().stream()
                        .filter(emp -> "ADMIN".equalsIgnoreCase(emp.getRole()))
                        .toList();

                String subject = "🔔 New Leave Request from " + empName;
                String body = "Hi Admin,\n\n" +
                        empName + " has submitted a new leave request.\n\n" +
                        "Type: " + leave.getType() + "\n" +
                        "Dates: " + leave.getDates() + "\n" +
                        "Reason: " + leave.getReason() + "\n\n" +
                        "Please login to NexusHR Admin Dashboard to review this request.";

                for (com.zidio.nexushr.entity.Employee admin : admins) {
                    if (admin.getEmail() != null && !admin.getEmail().trim().isEmpty()) {
                        emailService.sendEmail(admin.getEmail(), subject, body);
                    }
                }
            } catch (Exception e) {
                System.err.println("❌ Failed to send leave application email notification: " + e.getMessage());
            }
        });
        
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<LeaveRecord> getAllLeaves() {
        return repo.findAll();
    }

    @GetMapping("/{empCode}")
    public List<LeaveRecord> getEmployeeLeaves(@PathVariable String empCode) {
        return repo.findByEmpCode(empCode);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody String status) {
        Optional<LeaveRecord> leaveOpt = repo.findById(id);
        if (!leaveOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Leave record not found.");
        }
        
        LeaveRecord leave = leaveOpt.get();
        String cleanStatus = status.replace("\"", "").trim();
        leave.setStatus(cleanStatus);
        LeaveRecord saved = repo.save(leave);
        
        CompletableFuture.runAsync(() -> {
            try {
                employeeRepo.findByEmpCode(leave.getEmpCode())
                        .ifPresent(emp -> {
                            if (emp.getEmail() != null && !emp.getEmail().trim().isEmpty()) {
                                String subject = "📢 Leave Request Update: " + cleanStatus.toUpperCase();
                                String body = "Hi " + emp.getName() + ",\n\n" +
                                        "Your leave request has been " + cleanStatus.toLowerCase() + " by the management.\n\n" +
                                        "DETAILS:\n" +
                                        "Type: " + leave.getType() + "\n" +
                                        "Dates: " + leave.getDates() + "\n" +
                                        "Status: " + cleanStatus + "\n\n" +
                                        "Log in to NexusHR to check details.";
                                emailService.sendEmail(emp.getEmail(), subject, body);
                            }
                        });
            } catch (Exception e) {
                System.err.println("❌ Failed to send leave status update email notification: " + e.getMessage());
            }
        });
        
        return ResponseEntity.ok(saved);
    }
}