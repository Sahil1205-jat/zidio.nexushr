package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.Employee;
import com.zidio.nexushr.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private EmployeeRepository repo;

    @Autowired
    private PasswordEncoder encoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String empCode = body.get("empCode");
        String password = body.get("password");

        if (empCode == null || empCode.trim().isEmpty()) {
            return ResponseEntity.status(400).body("Employee ID cannot be empty.");
        }

        String cleanEmpCode = empCode.trim().toUpperCase();
        Optional<Employee> employeeOpt = repo.findByEmpCode(cleanEmpCode);

        if (!employeeOpt.isPresent()) {
            return ResponseEntity.status(401).body("Invalid Credentials");
        }

        Employee emp = employeeOpt.get();

        if (encoder.matches(password, emp.getPassword())) {
            // Return just the employee object, as it was before
            return ResponseEntity.ok(emp);
        }

        return ResponseEntity.status(401).body("Invalid Credentials");
    }
}