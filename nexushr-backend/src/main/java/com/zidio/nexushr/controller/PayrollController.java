package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.Employee;
import com.zidio.nexushr.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/payroll")
@CrossOrigin(origins = "*")
public class PayrollController {

    @Autowired
    private EmployeeRepository employeeRepository;

    // In-memory store for payroll runs to simulate batch job outputs
    private static final List<Map<String, Object>> payrollRuns = new ArrayList<>();

    static {
        // Seed some history
        Map<String, Object> run1 = new HashMap<>();
        run1.put("id", 1L);
        run1.put("period", "April 2026");
        run1.put("processedEmployees", 5L);
        run1.put("totalGross", 245000.0);
        run1.put("totalDeductions", 58175.0);
        run1.put("totalNet", 186825.0);
        run1.put("status", "COMPLETED");
        run1.put("processedAt", LocalDate.of(2026, 4, 30).toString());
        payrollRuns.add(run1);

        Map<String, Object> run2 = new HashMap<>();
        run2.put("id", 2L);
        run2.put("period", "May 2026");
        run2.put("processedEmployees", 5L);
        run2.put("totalGross", 245000.0);
        run2.put("totalDeductions", 58175.0);
        run2.put("totalNet", 186825.0);
        run2.put("status", "COMPLETED");
        run2.put("processedAt", LocalDate.of(2026, 5, 31).toString());
        payrollRuns.add(run2);
    }

    @GetMapping("/runs")
    public ResponseEntity<List<Map<String, Object>>> getPayrollRuns() {
        return ResponseEntity.ok(payrollRuns);
    }

    @PostMapping("/run")
    public ResponseEntity<Map<String, Object>> runPayrollBatch(@RequestParam String period) {
        // Check if already processed
        for (Map<String, Object> run : payrollRuns) {
            if (period.equalsIgnoreCase((String) run.get("period"))) {
                return ResponseEntity.status(400).body(Map.of("message", "Payroll for " + period + " has already been processed and locked."));
            }
        }

        List<Employee> employees = employeeRepository.findAll();
        if (employees.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("message", "No active employees found to execute payroll."));
        }

        double totalGross = 0.0;
        double totalDeductions = 0.0;
        double totalNet = 0.0;

        for (Employee emp : employees) {
            double ctc = emp.getCtc() != null ? emp.getCtc() : 0.0;
            if (ctc == 0.0) {
                ctc = 25000.0; // fallback standard package
            }

            // Calculation of tax slab and deductions
            double tds = Math.round(ctc * 0.10); // 10% TDS
            double pf = Math.round(ctc * 0.12);  // 12% PF
            double esi = Math.round(ctc * 0.0175); // 1.75% ESI

            double gross = ctc;
            double deductions = tds + pf + esi;
            double net = gross - deductions;

            totalGross += gross;
            totalDeductions += deductions;
            totalNet += net;
        }

        Map<String, Object> newRun = new HashMap<>();
        newRun.put("id", (long) (payrollRuns.size() + 1));
        newRun.put("period", period);
        newRun.put("processedEmployees", (long) employees.size());
        newRun.put("totalGross", totalGross);
        newRun.put("totalDeductions", totalDeductions);
        newRun.put("totalNet", totalNet);
        newRun.put("status", "COMPLETED");
        newRun.put("processedAt", LocalDate.now().toString());

        payrollRuns.add(newRun);

        return ResponseEntity.ok(newRun);
    }
}
