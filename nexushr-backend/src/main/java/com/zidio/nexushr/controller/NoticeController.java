package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.Notice;
import com.zidio.nexushr.entity.Employee;
import com.zidio.nexushr.repository.NoticeRepository;
import com.zidio.nexushr.repository.EmployeeRepository;
import com.zidio.nexushr.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notices")
@CrossOrigin(origins = "*")
public class NoticeController {

    @Autowired
    private NoticeRepository noticeRepo;

    @Autowired
    private EmployeeRepository employeeRepo;

    @Autowired
    private EmailService emailService;

    // 1. Create Notice and Email All Employees
    @PostMapping
    public Notice addNotice(@RequestBody Notice notice) {
        Notice savedNotice = noticeRepo.save(notice);

        // Background mein sabko mail bhejne ka logic
        try {
            List<Employee> allEmployees = employeeRepo.findAll();
            String subject = "📢 NexusHR Official Notice: " + savedNotice.getTitle();
            String body = "Attention Team,\n\n" +
                    "A new official update has been posted:\n\n" +
                    "TITLE: " + savedNotice.getTitle() + "\n" +
                    "MESSAGE: " + savedNotice.getContent() + "\n\n" +
                    "Check your 'Notice Board' for more info.\n\n" +
                    "Regards,\nNexusHR Management";

            // Loop through all employees and send email
            for (Employee emp : allEmployees) {
                if (emp.getEmail() != null && !emp.getEmail().isEmpty()) {
                    emailService.sendEmail(emp.getEmail(), subject, body);
                }
            }
            System.out.println("✅ Global Broadcast Sent for Notice: " + savedNotice.getTitle());
        } catch (Exception e) {
            System.err.println("❌ Notice saved but email broadcast failed: " + e.getMessage());
        }

        return savedNotice;
    }

    // 2. Get All Notices for Frontend
    @GetMapping
    public List<Notice> getAllNotices() {
        return noticeRepo.findAll();
    }

    // 3. Delete Notice (Optional but good to have)
    @DeleteMapping("/{id}")
    public String deleteNotice(@PathVariable Long id) {
        noticeRepo.deleteById(id);
        return "Notice deleted successfully";
    }
}