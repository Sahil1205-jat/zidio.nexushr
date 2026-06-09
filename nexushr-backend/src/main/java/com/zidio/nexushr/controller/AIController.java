package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.Attendance;
import com.zidio.nexushr.entity.Employee;
import com.zidio.nexushr.entity.LeaveRecord;
import com.zidio.nexushr.entity.PerformanceReview;
import com.zidio.nexushr.entity.Task;
import com.zidio.nexushr.entity.Notice;
import com.zidio.nexushr.repository.AttendanceRepository;
import com.zidio.nexushr.repository.EmployeeRepository;
import com.zidio.nexushr.repository.LeaveRepository;
import com.zidio.nexushr.repository.PerformanceReviewRepository;
import com.zidio.nexushr.repository.TaskRepository;
import com.zidio.nexushr.repository.NoticeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private PerformanceReviewRepository performanceReviewRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private NoticeRepository noticeRepository;

    // Response DTO for attrition
    public static class AttritionRiskResponse {
        private String empCode;
        private String name;
        private String department;
        private Double attritionScore;
        private String riskLevel;
        private List<String> riskFactors;
        private String recommendation;
        private Double salary;

        // Getters/Setters
        public String getEmpCode() { return empCode; }
        public void setEmpCode(String empCode) { this.empCode = empCode; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        public Double getAttritionScore() { return attritionScore; }
        public void setAttritionScore(Double attritionScore) { this.attritionScore = attritionScore; }
        public String getRiskLevel() { return riskLevel; }
        public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
        public List<String> getRiskFactors() { return riskFactors; }
        public void setRiskFactors(List<String> riskFactors) { this.riskFactors = riskFactors; }
        public String getRecommendation() { return recommendation; }
        public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
        public Double getSalary() { return salary; }
        public void setSalary(Double salary) { this.salary = salary; }
    }

    // Skills DTO
    public static class SkillItem {
        private String name;
        private int required;
        private int actual;

        public SkillItem(String name, int required, int actual) {
            this.name = name;
            this.required = required;
            this.actual = actual;
        }

        public String getName() { return name; }
        public int getRequired() { return required; }
        public int getActual() { return actual; }
    }

    // Chatbot DTO
    public static class ChatRequest {
        private String message;
        private String empCode;
        private String role;

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getEmpCode() { return empCode; }
        public void setEmpCode(String empCode) { this.empCode = empCode; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class ChatResponse {
        private String reply;
        private List<String> sources;

        public ChatResponse(String reply, List<String> sources) {
            this.reply = reply;
            this.sources = sources;
        }

        public String getReply() { return reply; }
        public List<String> getSources() { return sources; }
    }

    @GetMapping("/attrition")
    public ResponseEntity<List<AttritionRiskResponse>> getAttritionRisks() {
        List<Employee> employees = employeeRepository.findAll();
        List<AttritionRiskResponse> risks = new ArrayList<>();

        for (Employee emp : employees) {
            AttritionRiskResponse risk = new AttritionRiskResponse();
            risk.setEmpCode(emp.getEmpCode());
            risk.setName(emp.getName());
            risk.setDepartment(emp.getDepartment());
            risk.setSalary(emp.getCtc());

            double score = 15.0; // base score
            List<String> factors = new ArrayList<>();

            // Factor 1: CTC comparison
            if (emp.getCtc() != null) {
                if (emp.getCtc() < 40000) {
                    score += 25.0;
                    factors.add("Below market compensation rate (CTC < ₹40K)");
                } else if (emp.getCtc() < 70000) {
                    score += 10.0;
                    factors.add("Moderate compensation discrepancy (CTC < ₹70K)");
                }
            } else {
                score += 20.0;
                factors.add("Compensation baseline not established");
            }

            // Factor 2: Performance Review Rating
            List<PerformanceReview> reviews = performanceReviewRepository.findAll().stream()
                    .filter(r -> r.getEmpCode() != null && r.getEmpCode().equalsIgnoreCase(emp.getEmpCode()))
                    .toList();
            if (!reviews.isEmpty()) {
                OptionalDouble avgRating = reviews.stream()
                        .filter(r -> r.getRating() != null)
                        .mapToDouble(PerformanceReview::getRating)
                        .average();
                if (avgRating.isPresent()) {
                    double rating = avgRating.getAsDouble();
                    if (rating <= 2.0) {
                        score += 30.0;
                        factors.add("Low performance ranking (Average rating <= 2/5)");
                    } else if (rating <= 3.5) {
                        score += 12.0;
                        factors.add("Stagnant performance review trajectory");
                    }
                }
            } else {
                score += 5.0;
                factors.add("No recent performance appraisals logged");
            }

            // Factor 3: Leave frequency / Absences
            List<LeaveRecord> leaves = leaveRepository.findAll().stream()
                    .filter(l -> l.getEmpCode() != null && l.getEmpCode().equalsIgnoreCase(emp.getEmpCode()) && "Approved".equalsIgnoreCase(l.getStatus()))
                    .toList();
            if (leaves.size() > 3) {
                score += 15.0;
                factors.add("High frequency of leave requests (> 3 instances approved)");
            }

            // Factor 4: Attendance / Absenteeism records
            List<Attendance> attendances = attendanceRepository.findAll().stream()
                    .filter(a -> a.getEmpCode() != null && a.getEmpCode().equalsIgnoreCase(emp.getEmpCode()))
                    .toList();
            long absentCount = attendances.stream()
                    .filter(a -> "ABSENT".equalsIgnoreCase(a.getStatus()))
                    .count();
            if (absentCount > 2) {
                score += 20.0;
                factors.add("Unplanned absenteeism patterns (" + absentCount + " absences)");
            }

            // Factor 5: Tenure
            if (emp.getHireDate() != null) {
                long months = ChronoUnit.MONTHS.between(emp.getHireDate(), LocalDate.now());
                if (months < 12) {
                    score += 10.0;
                    factors.add("Short organizational tenure (< 1 year)");
                }
            }

            // Cap score between 5% and 95%
            score = Math.max(5.0, Math.min(95.0, score));
            risk.setAttritionScore(Math.round(score * 10.0) / 10.0);

            // Risk Level classification
            if (score >= 60.0) {
                risk.setRiskLevel("HIGH");
                risk.setRecommendation("Critical: Arrange immediate manager feedback loop and review compensation package.");
            } else if (score >= 30.0) {
                risk.setRiskLevel("MEDIUM");
                risk.setRecommendation("Medium Risk: Conduct routine one-on-one session to address progress and concerns.");
            } else {
                risk.setRiskLevel("LOW");
                risk.setRecommendation("Stable: Standard check-ins are sufficient. High retention probability.");
            }

            if (factors.isEmpty()) {
                factors.add("No significant warning signals detected.");
            }
            risk.setRiskFactors(factors);

            risks.add(risk);
        }

        // Sort: High score first
        risks.sort((a, b) -> Double.compare(b.getAttritionScore(), a.getAttritionScore()));

        return ResponseEntity.ok(risks);
    }

    @GetMapping("/skills/{empCode}")
    public ResponseEntity<List<SkillItem>> getEmployeeSkills(@PathVariable String empCode) {
        Optional<Employee> empOpt = employeeRepository.findAll().stream()
                .filter(e -> e.getEmpCode() != null && e.getEmpCode().equalsIgnoreCase(empCode))
                .findFirst();

        String dept = empOpt.map(Employee::getDepartment).orElse("General");
        List<SkillItem> skills = new ArrayList<>();

        if (dept.equalsIgnoreCase("Engineering") || dept.equalsIgnoreCase("IT")) {
            skills.add(new SkillItem("Java/Backend", 85, 70));
            skills.add(new SkillItem("React/Frontend", 80, 85));
            skills.add(new SkillItem("Spring Boot", 90, 65));
            skills.add(new SkillItem("SQL/Database", 75, 80));
            skills.add(new SkillItem("DevOps/Docker", 70, 50));
        } else if (dept.equalsIgnoreCase("HR")) {
            skills.add(new SkillItem("Recruiting", 90, 85));
            skills.add(new SkillItem("Employee Relations", 85, 80));
            skills.add(new SkillItem("Labor Compliance", 80, 75));
            skills.add(new SkillItem("Benefits Admin", 75, 70));
            skills.add(new SkillItem("HR Analytics", 70, 60));
        } else if (dept.equalsIgnoreCase("Finance")) {
            skills.add(new SkillItem("Financial Modeling", 90, 85));
            skills.add(new SkillItem("Tax Compliance", 85, 80));
            skills.add(new SkillItem("Audit Prep", 85, 75));
            skills.add(new SkillItem("Excel/Sheets", 95, 90));
            skills.add(new SkillItem("ERP Systems", 80, 70));
        } else {
            skills.add(new SkillItem("Communication", 80, 85));
            skills.add(new SkillItem("Teamwork", 80, 80));
            skills.add(new SkillItem("Time Management", 85, 75));
            skills.add(new SkillItem("Problem Solving", 80, 70));
            skills.add(new SkillItem("Documentation", 75, 80));
        }

        return ResponseEntity.ok(skills);
    }

    // PolicyDoc definition
    public static class PolicyDoc {
        private String title;
        private String content;
        private List<String> sources;

        public PolicyDoc(String title, String content, List<String> sources) {
            this.title = title;
            this.content = content;
            this.sources = sources;
        }

        public String getTitle() { return title; }
        public String getContent() { return content; }
        public List<String> getSources() { return sources; }
    }

    private List<PolicyDoc> getPolicies() {
        List<PolicyDoc> policies = new ArrayList<>();
        
        policies.add(new PolicyDoc(
            "Leave Benefits and Accrual Policy",
            "Employees are entitled to the following leave benefits:\n" +
            "1. Casual Leave (CL): 12 days per calendar year (accrued monthly at 1 day per month).\n" +
            "2. Sick Leave (SL): 10 days per calendar year. A medical certificate is required for sick leave requests exceeding 2 consecutive days.\n" +
            "3. Maternity Leave: 26 weeks of fully paid leave for female employees, as per the Maternity Benefit Act.\n" +
            "4. Paternity Leave: 15 days of fully paid leave for male employees, to be taken within 6 months of child birth.\n\n" +
            "Approval Process: All leave requests must be submitted through the Leaves portal. Approval is required from the immediate reporting manager.",
            Arrays.asList("Employee Handbook - Section 4.2 (Leave Benefits)", "HR Policy Memo #102 - Leave Accrual Rules")
        ));

        policies.add(new PolicyDoc(
            "Payroll Cycles and Statutory Deductions",
            "Salary disbursements are processed on the last working day of each calendar month. The base gross salary (CTC) is subject to the following standard deductions:\n" +
            "1. Tax Deducted at Source (TDS): 10% TDS is deducted automatically from CTC, subject to standard slab revisions.\n" +
            "2. Provident Fund (PF): 12% contribution as per statutory guidelines.\n" +
            "3. Employee State Insurance (ESI): 1.75% contribution computed automatically on eligible salary components.\n\n" +
            "Payslips are generated and downloadable via the Payroll Console post-disbursement.",
            Arrays.asList("Finance and Accounting Manual - Section 7.1 (Payroll)", "Tax Slab Guidelines FY 2025-2026")
        ));

        policies.add(new PolicyDoc(
            "Employee Onboarding and Access Security",
            "New hires are automatically provisioned in the enterprise directory during onboarding. A secure, temporary password is automatically generated, and an asynchronous invitation is sent to their registered email address. New hires must change their temporary password immediately upon first login to secure their profile.",
            Arrays.asList("IT Security Policy - User Provisioning", "HR Operations Guide - New Hire Onboarding")
        ));

        policies.add(new PolicyDoc(
            "Performance Appraisal and Goal Reviews",
            "NexusHR operates on a twice-yearly performance review cycle:\n" +
            "1. Mid-Year Evaluation: Focusing on self-appraisal, milestones, and goal alignment.\n" +
            "2. Annual Final Review: Involves manager evaluations, rating score calibration, and performance-based band revision.\n\n" +
            "Goal settings utilize the OKR (Objectives and Key Results) and SMART goal frameworks established under the Performance dashboard.",
            Arrays.asList("Talent Management Directives - Performance & OKRs")
        ));

        policies.add(new PolicyDoc(
            "Code of Conduct and Core Values",
            "We maintain a highly professional, inclusive, and harassment-free workplace. Key values include transparency, ownership, and respect. Security guidelines mandate that all employees protect sensitive enterprise data and prevent sharing credentials.",
            Arrays.asList("Employee Handbook - Section 1 (Code of Conduct)", "Company Ethics Policy")
        ));

        policies.add(new PolicyDoc(
            "Working Hours and Attendance System",
            "Standard working hours are 9:00 AM to 6:00 PM, Monday through Friday. Daily attendance is recorded via the check-in and check-out system on the Attendance portal. A minimum of 8 hours per day is required to be marked present. Monthly summaries of hours are audited for payroll alignment.",
            Arrays.asList("Operations Manual - Section 2 (Attendance & Hours)")
        ));

        return policies;
    }

    private static double calculateOverlapScore(String query, String text) {
        String[] qTokens = query.toLowerCase().split("\\W+");
        String[] tTokens = text.toLowerCase().split("\\W+");
        
        Set<String> qSet = new HashSet<>(Arrays.asList(qTokens));
        Set<String> tSet = new HashSet<>(Arrays.asList(tTokens));
        
        List<String> stopwords = Arrays.asList(
            "a", "an", "the", "and", "or", "but", "is", "are", "was", "were", 
            "to", "for", "in", "on", "at", "by", "of", "with", "what", "how", 
            "why", "who", "show", "get", "me", "my", "please", "can", "you", 
            "tell", "about", "policy", "rules", "guidelines"
        );
        qSet.removeAll(stopwords);
        tSet.removeAll(stopwords);
        
        if (qSet.isEmpty()) return 0.0;
        
        int intersection = 0;
        for (String word : qSet) {
            if (tSet.contains(word)) {
                intersection++;
            }
        }
        
        return (double) intersection / qSet.size();
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> askChatbot(@RequestBody ChatRequest request) {
        String msg = request.getMessage().toLowerCase();
        String reply = "";
        List<String> sources = new ArrayList<>();

        String userEmpCode = request.getEmpCode() != null ? request.getEmpCode().trim() : "";
        String userRole = request.getRole() != null ? request.getRole().trim().toUpperCase() : "EMPLOYEE";

        // 1. Task query handling
        if (msg.contains("task") || msg.contains("todo") || msg.contains("assign") || msg.contains("work list") || msg.contains("pending work") || msg.contains("my job")) {
            if (userEmpCode.isEmpty()) {
                reply = "### NexusHR Task Assistant\n\nI couldn't identify your employee profile. Please ensure you are logged in to check your tasks.";
                sources.add("Authentication Context");
            } else {
                List<Task> tasks = taskRepository.findAllByAssignedToIgnoreCase(userEmpCode);
                if (tasks.isEmpty()) {
                    reply = "### 📋 Your Assigned Tasks\n\nNo pending tasks found! You're completely caught up.";
                } else {
                    StringBuilder sb = new StringBuilder("### 📋 Your Assigned Tasks\n\nHere are the tasks currently assigned to your code (" + userEmpCode + "):\n\n");
                    for (Task t : tasks) {
                        String statusBadge = t.getStatus() != null ? t.getStatus() : "PENDING";
                        String priorityBadge = t.getPriority() != null ? t.getPriority() : "MEDIUM";
                        sb.append("- **[").append(statusBadge).append("]** ")
                          .append(t.getTitle()).append(" (Priority: ").append(priorityBadge)
                          .append(", Due: ").append(t.getDueDate() != null ? t.getDueDate().toString() : "No Date").append(")\n")
                          .append("  *").append(t.getDescription() != null ? t.getDescription() : "No description provided").append("*\n\n");
                    }
                    reply = sb.toString();
                }
                sources.add("NexusHR Task Repository");
            }
        }
        // 2. Leave records query handling
        else if (msg.contains("my leave") || msg.contains("leave balance") || msg.contains("leave status") || msg.contains("leave history") || msg.contains("applied leave")) {
            if (userEmpCode.isEmpty()) {
                reply = "### NexusHR Leave Assistant\n\nI couldn't identify your employee profile. Please log in to check your leave history.";
                sources.add("Authentication Context");
            } else {
                List<LeaveRecord> leaves = leaveRepository.findAll().stream()
                        .filter(l -> l.getEmpCode() != null && l.getEmpCode().equalsIgnoreCase(userEmpCode))
                        .toList();
                if (leaves.isEmpty()) {
                    reply = "### 📅 Your Leave History\n\nYou have not logged any leave applications on this platform.";
                } else {
                    StringBuilder sb = new StringBuilder("### 📅 Your Leave History\n\nHere are the leave requests on file for you:\n\n");
                    for (LeaveRecord lr : leaves) {
                        sb.append("- **Dates**: ").append(lr.getDates() != null ? lr.getDates() : "Not specified")
                          .append(" | **Type**: ").append(lr.getType() != null ? lr.getType() : "General")
                          .append(" | **Status**: ").append(lr.getStatus() != null ? lr.getStatus() : "Pending")
                          .append("\n  *Reason: ").append(lr.getReason() != null ? lr.getReason() : "None provided").append("*\n\n");
                    }
                    reply = sb.toString();
                }
                sources.add("NexusHR Leave Management Records");
            }
        }
        // 3. Performance reviews query handling
        else if (msg.contains("my performance") || msg.contains("my review") || msg.contains("my rating") || msg.contains("feedback") || msg.contains("my goal")) {
            if (userEmpCode.isEmpty()) {
                reply = "### NexusHR Performance Review Assistant\n\nI couldn't identify your employee profile. Please log in to check performance appraisals.";
                sources.add("Authentication Context");
            } else {
                List<PerformanceReview> reviews = performanceReviewRepository.findAll().stream()
                        .filter(r -> r.getEmpCode() != null && r.getEmpCode().equalsIgnoreCase(userEmpCode))
                        .toList();
                if (reviews.isEmpty()) {
                    reply = "### 🏆 Your Performance Appraisal\n\nNo appraisal metrics or manager feedback are logged for your profile yet.";
                } else {
                    StringBuilder sb = new StringBuilder("### 🏆 Your Performance Appraisal\n\nHere are your appraisal records:\n\n");
                    for (PerformanceReview pr : reviews) {
                        sb.append("#### Period: ").append(pr.getPeriod() != null ? pr.getPeriod() : "Annual Review")
                          .append("\n- **Rating**: ").append(pr.getRating() != null ? pr.getRating() + "/5" : "Not rated yet")
                          .append("\n- **Status**: ").append(pr.getStatus() != null ? pr.getStatus() : "Pending")
                          .append("\n- **Current Goals**: ").append(pr.getGoals() != null ? pr.getGoals() : "No goals specified")
                          .append("\n- **Self Assessment**: ").append(pr.getSelfAssessment() != null ? pr.getSelfAssessment() : "Not filled")
                          .append("\n- **Manager Feedback**: ").append(pr.getManagerFeedback() != null ? pr.getManagerFeedback() : "Awaiting evaluation")
                          .append("\n\n");
                    }
                    reply = sb.toString();
                }
                sources.add("NexusHR Performance Appraisal Board");
            }
        }
        // 4. Attrition Risk query handling (Admin Only)
        else if (msg.contains("attrition") || msg.contains("at risk") || msg.contains("risk score") || msg.contains("who is leaving")) {
            if (!"ADMIN".equals(userRole)) {
                reply = "### 🔒 Security Alert: Access Denied\n\nWorkforce attrition forecasting contains highly confidential predictive HR analytics. This information is restricted to administrators and executive management.";
                sources.add("NexusHR Security Matrix");
            } else {
                List<AttritionRiskResponse> risks = getAttritionRisks().getBody();
                if (risks == null || risks.isEmpty()) {
                    reply = "### ⚠️ Predictive Attrition Forecasts\n\nNo workforce risk data is calculated at this time.";
                } else {
                    List<AttritionRiskResponse> highRisks = risks.stream().filter(r -> r.getAttritionScore() >= 40.0).toList();
                    if (highRisks.isEmpty()) {
                        reply = "### ⚠️ Predictive Attrition Forecasts\n\nExcellent! No employees are currently evaluated above the moderate attrition risk threshold (>= 40%).";
                    } else {
                        StringBuilder sb = new StringBuilder("### ⚠️ Attrition Risk Alert (Confidential)\n\nHere are the staff members with elevated risk scores:\n\n");
                        for (AttritionRiskResponse r : highRisks) {
                            sb.append("- **").append(r.getName()).append("** (Code: ").append(r.getEmpCode())
                              .append(", Dept: ").append(r.getDepartment())
                              .append(r.getSalary() != null ? ", Salary: ₹" + String.format("%,.2f", r.getSalary()) + "/mo" : "")
                              .append(")\n")
                              .append("  * **Risk Score**: ").append(r.getAttritionScore()).append("% (Level: ").append(r.getRiskLevel()).append(")\n")
                              .append("  * **Key Factors**: ").append(String.join(", ", r.getRiskFactors())).append("\n")
                              .append("  * **Retention Plan**: ").append(r.getRecommendation()).append("\n\n");
                        }
                        reply = sb.toString();
                    }
                }
                sources.add("NexusHR AI Predictive Risk Core");
            }
        }
        // 5. Notice Board query handling
        else if (msg.contains("notice") || msg.contains("announcement") || msg.contains("news") || msg.contains("bulletin") || msg.contains("broadcast")) {
            List<Notice> notices = noticeRepository.findAllByOrderByIdDesc();
            if (notices.isEmpty()) {
                reply = "### 📢 Latest Announcements\n\nNo corporate notices have been posted to the bulletin board.";
            } else {
                StringBuilder sb = new StringBuilder("### 📢 Latest Announcements\n\nHere are the most recent updates from the company bulletin board:\n\n");
                int limit = Math.min(notices.size(), 3);
                for (int i = 0; i < limit; i++) {
                    Notice n = notices.get(i);
                    sb.append("- **").append(n.getTitle()).append("** (Posted: ").append(n.getCreatedAt() != null ? n.getCreatedAt().toLocalDate().toString() : "Recent").append(")\n")
                      .append("  ").append(n.getContent()).append("\n\n");
                }
                reply = sb.toString();
            }
            sources.add("NexusHR Global Notice Board");
        }
        // 6. User Profile Self-Details
        else if (msg.contains("my profile") || msg.contains("who am i") || msg.contains("my details") || msg.contains("my registration")) {
            if (userEmpCode.isEmpty()) {
                reply = "### Profile Query\n\nI couldn't retrieve profile details because your session employee code is missing.";
                sources.add("Authentication Context");
            } else {
                Optional<Employee> empOpt = employeeRepository.findAll().stream()
                        .filter(e -> e.getEmpCode() != null && e.getEmpCode().equalsIgnoreCase(userEmpCode))
                        .findFirst();
                if (empOpt.isPresent()) {
                    Employee e = empOpt.get();
                    reply = "### 👤 Your Profile Details\n\n" +
                            "- **Full Name**: " + e.getName() + "\n" +
                            "- **Employee Code**: " + e.getEmpCode() + "\n" +
                            "- **Department**: " + e.getDepartment() + "\n" +
                            "- **Corporate Email**: " + e.getEmail() + "\n" +
                            "- **System Role**: " + e.getRole() + "\n" +
                            "- **Status**: " + e.getStatus() + "\n" +
                            "- **Compensation (CTC)**: " + (e.getCtc() != null ? "₹" + e.getCtc() + " / month" : "Not Established") + "\n" +
                            "- **Date of Joining**: " + (e.getHireDate() != null ? e.getHireDate().toString() : "Not Logged");
                } else {
                    reply = "### Profile Query\n\nNo records found matching employee code: " + userEmpCode;
                }
                sources.add("NexusHR Database - Employee Table");
            }
        }
        // 7. General Employee Directory Lookup
        else if (msg.contains("who is") || msg.contains("lookup") || msg.contains("find employee") || msg.contains("search staff") || msg.contains("profile of")) {
            List<Employee> allEmps = employeeRepository.findAll();
            Employee matchedEmp = null;
            for (Employee e : allEmps) {
                if (e.getEmpCode() != null && msg.contains(e.getEmpCode().toLowerCase())) {
                    matchedEmp = e;
                    break;
                }
                if (e.getName() != null && msg.contains(e.getName().toLowerCase())) {
                    matchedEmp = e;
                    break;
                }
            }
            if (matchedEmp != null) {
                StringBuilder sb = new StringBuilder("### 🔍 Staff Profile: " + matchedEmp.getName() + "\n\n");
                sb.append("- **Employee Code**: ").append(matchedEmp.getEmpCode()).append("\n")
                  .append("- **Department**: ").append(matchedEmp.getDepartment()).append("\n")
                  .append("- **Corporate Email**: ").append(matchedEmp.getEmail()).append("\n")
                  .append("- **System Role**: ").append(matchedEmp.getRole()).append("\n")
                  .append("- **Employment Status**: ").append(matchedEmp.getStatus()).append("\n");
                
                // Security check for salary disclosure
                if ("ADMIN".equals(userRole)) {
                    sb.append("- **Compensation (CTC)**: ").append(matchedEmp.getCtc() != null ? "₹" + matchedEmp.getCtc() + " / month" : "Not Established").append("\n");
                } else {
                    sb.append("- **Compensation (CTC)**: [Confidential - Restricted to Admin]\n");
                }
                sb.append("- **Hire Date**: ").append(matchedEmp.getHireDate() != null ? matchedEmp.getHireDate().toString() : "Not Logged");
                
                reply = sb.toString();
                sources.add("NexusHR Active Staff Directory");
            } else {
                reply = "### 🔍 Staff Profile Lookup\n\nI couldn't locate any employee matching your query keyword. Try specifying a full name or employee code.";
                sources.add("NexusHR Active Staff Directory");
            }
        }
        // 8. RAG-based term-overlap policy matcher
        else {
            List<PolicyDoc> policyDocs = getPolicies();
            PolicyDoc bestMatch = null;
            double highestScore = 0.0;
            
            for (PolicyDoc doc : policyDocs) {
                double score = calculateOverlapScore(msg, doc.getTitle() + " " + doc.getContent());
                if (score > highestScore) {
                    highestScore = score;
                    bestMatch = doc;
                }
            }
            
            if (bestMatch != null && highestScore >= 0.15) {
                reply = "### " + bestMatch.getTitle() + "\n\n" + bestMatch.getContent();
                sources.addAll(bestMatch.getSources());
            } else {
                reply = "### NexusHR AI Assistant\n\n" +
                        "I am the NexusHR RAG-powered chatbot. I can answer policy queries regarding:\n" +
                        "• **Leave Policies & Holidays** (Casual leave, Sick leave accrual)\n" +
                        "• **Payroll Cycles & CTC Tax Deductions** (10% TDS, PF, ESI components)\n" +
                        "• **Onboarding & Credential Security** (Temporary passwords, async logins)\n" +
                        "• **Performance Appraisals & OKR Review Processes** (Mid-year/Annual appraisals)\n" +
                        "• **Working Hours & Attendance Systems** (Check-in/out tracking)\n" +
                        "• **Code of Conduct & Core Values** (Workplace inclusion)\n\n" +
                        "Additionally, I can query database records for:\n" +
                        "• **Your active tasks** (\"my tasks\")\n" +
                        "• **Your leave history** (\"my leave balance\")\n" +
                        "• **Your performance reviews** (\"my rating\")\n" +
                        "• **Notice board announcements** (\"show notices\")\n" +
                        "• **Your user profile** (\"my profile\")\n" +
                        "• **Employee directory records** (\"who is [name]\")\n" +
                        "• **ML attrition forecasts** (\"high risk attrition\" - admin only)\n\n" +
                        "Please rephrase your query and I will retrieve the relevant handbook section or system records.";
                sources.add("NexusHR Enterprise Policy Index");
            }
        }

        return ResponseEntity.ok(new ChatResponse(reply, sources));
    }
}
