package com.zidio.nexushr.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "performance_reviews")
public class PerformanceReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String empCode;
    private String period;

    @Column(columnDefinition = "TEXT")
    private String goals;

    @Column(columnDefinition = "TEXT")
    private String selfAssessment;

    @Column(columnDefinition = "TEXT")
    private String managerFeedback;

    private Integer rating;
    private String status; // "Pending Self-Assessment", "Pending Manager Review", "Completed"

    // Default Constructor
    public PerformanceReview() {
        this.status = "Pending Self-Assessment";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmpCode() { return empCode; }
    public void setEmpCode(String empCode) { this.empCode = empCode; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public String getGoals() { return goals; }
    public void setGoals(String goals) { this.goals = goals; }

    public String getSelfAssessment() { return selfAssessment; }
    public void setSelfAssessment(String selfAssessment) { this.selfAssessment = selfAssessment; }

    public String getManagerFeedback() { return managerFeedback; }
    public void setManagerFeedback(String managerFeedback) { this.managerFeedback = managerFeedback; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}