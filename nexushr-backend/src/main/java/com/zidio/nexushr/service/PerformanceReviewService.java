package com.zidio.nexushr.service;

import com.zidio.nexushr.entity.PerformanceReview;
import com.zidio.nexushr.repository.PerformanceReviewRepository;
import com.zidio.nexushr.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
public class PerformanceReviewService {

    @Autowired
    private PerformanceReviewRepository repository;

    @Autowired
    private EmployeeRepository employeeRepo;

    @Autowired
    private EmailService emailService;

    @Transactional
    public PerformanceReview createReview(PerformanceReview review) {
        if (review.getEmpCode() == null || review.getEmpCode().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee code is required.");
        }
        String empCode = review.getEmpCode().trim().toUpperCase();
        // Check if employee exists
        if (!employeeRepo.findByEmpCode(empCode).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Employee with code '" + empCode + "' does not exist.");
        }
        review.setEmpCode(empCode);

        if (review.getStatus() == null) {
            review.setStatus("Pending Self-Assessment");
        }
        PerformanceReview saved = repository.save(review);

        // Notify the employee asynchronously that a new cycle has been created
        CompletableFuture.runAsync(() -> {
            try {
                employeeRepo.findByEmpCode(empCode).ifPresent(emp -> {
                    if (emp.getEmail() != null && !emp.getEmail().trim().isEmpty()) {
                        String subject = "🔔 Performance Review Cycle Started";
                        String body = "Hi " + emp.getName() + ",\n\n" +
                                "A new performance review cycle has been started for you.\n\n" +
                                "Please log in to NexusHR to complete your self-assessment.\n\n" +
                                "Review Period: " + (review.getPeriod() != null ? review.getPeriod() : "Current Period") + "\n\n" +
                                "Best regards,\nHR Department";
                        emailService.sendEmail(emp.getEmail(), subject, body);
                    }
                });
            } catch (Exception e) {
                System.err.println("❌ Failed to send performance review creation email notification: " + e.getMessage());
            }
        });

        return saved;
    }

    public List<PerformanceReview> getAllReviews() {
        return repository.findAll();
    }

    public List<PerformanceReview> getReviewsByEmpCode(String empCode) {
        return repository.findByEmpCode(empCode);
    }

    @Transactional
    public Optional<PerformanceReview> updateReview(Long id, PerformanceReview updateRequest) {
        return repository.findById(id).map(existing -> {
            boolean selfAssessmentUpdated = updateRequest.getSelfAssessment() != null 
                    && !updateRequest.getSelfAssessment().equals(existing.getSelfAssessment());
            
            boolean managerUpdated = (updateRequest.getManagerFeedback() != null 
                    && !updateRequest.getManagerFeedback().equals(existing.getManagerFeedback()))
                    || (updateRequest.getRating() != null && !updateRequest.getRating().equals(existing.getRating()));

            if (updateRequest.getSelfAssessment() != null) {
                existing.setSelfAssessment(updateRequest.getSelfAssessment());
            }
            if (updateRequest.getManagerFeedback() != null) {
                existing.setManagerFeedback(updateRequest.getManagerFeedback());
            }
            if (updateRequest.getRating() != null) {
                existing.setRating(updateRequest.getRating());
            }
            if (updateRequest.getStatus() != null) {
                existing.setStatus(updateRequest.getStatus());
            }
            PerformanceReview saved = repository.save(existing);

            // Notify admins asynchronously if self-assessment was updated
            if (selfAssessmentUpdated) {
                CompletableFuture.runAsync(() -> {
                    try {
                        String empName = employeeRepo.findByEmpCode(saved.getEmpCode())
                                .map(com.zidio.nexushr.entity.Employee::getName)
                                .orElse(saved.getEmpCode());

                        List<com.zidio.nexushr.entity.Employee> admins = employeeRepo.findAll().stream()
                                .filter(emp -> "ADMIN".equalsIgnoreCase(emp.getRole()))
                                .toList();

                        String subject = "📝 Performance Self-Assessment Submitted by " + empName;
                        String body = "Hi Admin,\n\n" +
                                empName + " has submitted their performance self-assessment.\n\n" +
                                "Review Period: " + (saved.getPeriod() != null ? saved.getPeriod() : "Current Period") + "\n" +
                                "Self-Assessment: " + saved.getSelfAssessment() + "\n\n" +
                                "Please log in to the HR Portal to submit your manager feedback and rating.";

                        for (com.zidio.nexushr.entity.Employee admin : admins) {
                            if (admin.getEmail() != null && !admin.getEmail().trim().isEmpty()) {
                                emailService.sendEmail(admin.getEmail(), subject, body);
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("❌ Failed to send self-assessment update email notification: " + e.getMessage());
                    }
                });
            }

            // Notify employee asynchronously if manager feedback/rating was updated
            if (managerUpdated) {
                CompletableFuture.runAsync(() -> {
                    try {
                        employeeRepo.findByEmpCode(saved.getEmpCode()).ifPresent(emp -> {
                            if (emp.getEmail() != null && !emp.getEmail().trim().isEmpty()) {
                                String subject = "⭐ Performance Review Updated";
                                String body = "Hi " + emp.getName() + ",\n\n" +
                                        "Your manager has updated your performance review with feedback and rating.\n\n" +
                                        "Feedback: " + (saved.getManagerFeedback() != null ? saved.getManagerFeedback() : "N/A") + "\n" +
                                        "Rating: " + (saved.getRating() != null ? saved.getRating() : "N/A") + "\n" +
                                        "Status: " + saved.getStatus() + "\n\n" +
                                        "Please log in to NexusHR to view details.";
                                emailService.sendEmail(emp.getEmail(), subject, body);
                            }
                        });
                    } catch (Exception e) {
                        System.err.println("❌ Failed to send manager review update email notification: " + e.getMessage());
                    }
                });
            }

            return saved;
        });
    }

    @Transactional
    public void deleteReview(Long id) {
        repository.deleteById(id);
    }
}