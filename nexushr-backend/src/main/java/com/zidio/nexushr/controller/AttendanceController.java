package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.Attendance;
import com.zidio.nexushr.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    @Autowired
    private AttendanceRepository repo;
    @GetMapping("/all")
    public List<Attendance> getAllAttendance() {
        return repo.findAll(); // Admin ko sabka data dikhane ke liye
    }
    @PostMapping("/check-in/{empCode}")
    public ResponseEntity<?> checkIn(@PathVariable String empCode) {
        try {
            String cleanEmpCode = empCode.trim().toUpperCase();
            if (repo.findByEmpCodeAndDate(cleanEmpCode, LocalDate.now()).isPresent()) {
                return ResponseEntity.status(400).body("Already checked in for today.");
            }
            Attendance a = new Attendance();
            a.setEmpCode(cleanEmpCode);
            a.setDate(LocalDate.now());
            a.setCheckInTime(LocalTime.now());
            a.setStatus("PRESENT");
            a.setTotalHours("0h 0m");
            Attendance saved = repo.save(a);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("DB Error: " + e.getMessage());
        }
    }

    @PutMapping("/check-out/{empCode}")
    public ResponseEntity<?> checkOut(@PathVariable String empCode) {
        try {
            String cleanEmpCode = empCode.trim().toUpperCase();
            Optional<Attendance> attendanceOpt = repo.findByEmpCodeAndDate(cleanEmpCode, LocalDate.now());
            if (!attendanceOpt.isPresent()) {
                return ResponseEntity.status(400).body("No check-in record found for today.");
            }
            Attendance a = attendanceOpt.get();
            if (a.getCheckOutTime() != null) {
                return ResponseEntity.status(400).body("Already checked out for today.");
            }
            a.setCheckOutTime(LocalTime.now());
            Duration d = Duration.between(a.getCheckInTime(), a.getCheckOutTime());
            a.setTotalHours(d.toHours() + "h " + (d.toMinutes() % 60) + "m");
            Attendance saved = repo.save(a);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("DB Error: " + e.getMessage());
        }
    }

    @GetMapping("/stats/{empCode}")
    public Map<String, Object> getStats(@PathVariable String empCode) {
        List<Attendance> history = repo.findByEmpCode(empCode);
        Map<String, Object> res = new HashMap<>();
        res.put("totalDays", history.size());
        res.put("totalHours", "Calculated"); // Simplified for now
        res.put("history", history);
        return res;
    }
}