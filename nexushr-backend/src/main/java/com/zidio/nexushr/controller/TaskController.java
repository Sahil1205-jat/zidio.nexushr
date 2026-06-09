package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.Task;
import com.zidio.nexushr.entity.Employee;
import com.zidio.nexushr.repository.TaskRepository;
import com.zidio.nexushr.repository.EmployeeRepository;
import com.zidio.nexushr.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    private static final Logger log = LoggerFactory.getLogger(TaskController.class);

    @Autowired
    private TaskRepository taskRepo;

    @Autowired
    private EmployeeRepository employeeRepo;

    @Autowired
    private EmailService emailService;

    // 1. Create Task and Notify Assigned Employee
    @PostMapping
    public Task createTask(@RequestBody Task task) {
        if(task.getStatus() == null) task.setStatus("PENDING");
        Task savedTask = taskRepo.save(task);
        log.info("New task created with ID: {}", savedTask.getId());

        // Notify assigned employee via email
        try {
            employeeRepo.findByEmpCode(savedTask.getAssignedTo().trim().toUpperCase())
                    .ifPresent(emp -> {
                        String subject = "🚀 New Project Task: " + savedTask.getTitle();
                        String body = "Hi " + emp.getName() + ",\n\n" +
                                "A new task has been assigned to your profile.\n\n" +
                                "TASK: " + savedTask.getTitle() + "\n" +
                                "PRIORITY: " + savedTask.getPriority() + "\n" +
                                "DEADLINE: " + savedTask.getDueDate() + "\n\n" +
                                "Please login to NexusHR to start working on it.";
                        emailService.sendEmail(emp.getEmail(), subject, body);
                        log.info("Task notification sent to: {}", emp.getEmail());
                    });
        } catch (Exception e) {
            log.error("Task assigned but email notification failed: {}", e.getMessage());
        }

        return savedTask;
    }

    // 2. Get All Tasks (For Admin)
    @GetMapping("/all")
    public List<Task> getAllTasks() {
        log.info("Admin request for all tasks");
        return taskRepo.findAll();
    }

    // 3. Get Tasks for Specific Employee
    @GetMapping("/emp/{empCode}")
    public List<Task> getMyTasks(@PathVariable String empCode) {
        log.info("Fetching tasks for employee: {}", empCode);
        return taskRepo.findAllByAssignedToIgnoreCase(empCode);
    }

    // 4. Update Task Status (Employee side)
    @PatchMapping("/{id}/status")
    public ResponseEntity<Task> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> statusUpdate) {
        String newStatus = statusUpdate.get("status");
        log.info("Request to update task {} to status: {}", id, newStatus);

        return taskRepo.findById(id)
                .map(task -> {
                    task.setStatus(newStatus);
                    Task updatedTask = taskRepo.save(task);
                    log.info("Task {} status updated successfully", id);
                    return ResponseEntity.ok(updatedTask);
                })
                .orElseGet(() -> {
                    log.error("Attempted to update non-existent task with ID: {}", id);
                    return ResponseEntity.notFound().build();
                });
    }

    // 5. Delete Task
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTask(@PathVariable Long id) {
        if (taskRepo.existsById(id)) {
            taskRepo.deleteById(id);
            log.info("Task with ID: {} deleted successfully", id);
            return ResponseEntity.ok("Task removed successfully");
        } else {
            log.error("Attempted to delete non-existent task with ID: {}", id);
            return ResponseEntity.notFound().build();
        }
    }
}