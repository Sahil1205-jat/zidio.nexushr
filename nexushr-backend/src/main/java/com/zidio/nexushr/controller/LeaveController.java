package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.LeaveRecord;
import com.zidio.nexushr.repository.LeaveRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/leaves")
@CrossOrigin(origins = "*")
public class LeaveController {

    @Autowired
    private LeaveRepository repo;

    // Leave Apply Karna
    @PostMapping
    public LeaveRecord applyLeave(@RequestBody LeaveRecord leave) {
        leave.setStatus("Pending"); // Default status
        return repo.save(leave);
    }

    // Saari leaves dekhna (Admin ke liye)
    @GetMapping
    public List<LeaveRecord> getAllLeaves() {
        return repo.findAll();
    }

    // Sirf ek employee ki leaves dekhna
    @GetMapping("/{empCode}")
    public List<LeaveRecord> getEmployeeLeaves(@PathVariable String empCode) {
        return repo.findByEmpCode(empCode);
    }

    // Admin dvara Approve/Reject karna
    @PutMapping("/{id}/status")
    public LeaveRecord updateStatus(@PathVariable Long id, @RequestBody String status) {
        LeaveRecord leave = repo.findById(id).orElseThrow();
        leave.setStatus(status.replace("\"", "")); // JSON quotes hatane ke liye
        return repo.save(leave);
    }
}