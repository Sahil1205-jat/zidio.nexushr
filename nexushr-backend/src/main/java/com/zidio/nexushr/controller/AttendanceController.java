package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.Attendance;
import com.zidio.nexushr.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    public Attendance checkIn(@PathVariable String empCode) {
        try {
            if(repo.findByEmpCodeAndDate(empCode, LocalDate.now()).isPresent()) {
                return null;
            }
            Attendance a = new Attendance();
            a.setEmpCode(empCode);
            a.setDate(LocalDate.now());
            a.setCheckInTime(LocalTime.now());
            a.setStatus("PRESENT");
            a.setTotalHours("0h 0m");
            return repo.save(a);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("DB Error: " + e.getMessage());
        }
    }

    @PutMapping("/check-out/{empCode}")
    public Attendance checkOut(@PathVariable String empCode) {
        Attendance a = repo.findByEmpCodeAndDate(empCode, LocalDate.now())
                .orElseThrow(() -> new RuntimeException("No record found"));
        a.setCheckOutTime(LocalTime.now());
        Duration d = Duration.between(a.getCheckInTime(), a.getCheckOutTime());
        a.setTotalHours(d.toHours() + "h " + (d.toMinutes() % 60) + "m");
        return repo.save(a);
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