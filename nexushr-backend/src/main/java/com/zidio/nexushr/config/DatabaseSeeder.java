package com.zidio.nexushr.config;

import com.zidio.nexushr.entity.Employee;
import com.zidio.nexushr.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (employeeRepository.count() == 0) {
            System.out.println("🌱 Database is empty. Seeding default admin accounts...");

            // Seed Sahil Sepat
            Employee sahil = new Employee();
            sahil.setEmpCode("SAHIL@NEXUSHR");
            sahil.setName("Sahil Sepat");
            sahil.setEmail("sahil.sepat@nexushr.com");
            sahil.setDepartment("ADMIN");
            sahil.setStatus("Active");
            sahil.setPassword(passwordEncoder.encode("admin123"));
            sahil.setRole("ADMIN");
            sahil.setHireDate(LocalDate.of(2024, 1, 1));
            sahil.setCtc(150000.0);
            employeeRepository.save(sahil);

            // Seed Rudra Tiwari
            Employee rudra = new Employee();
            rudra.setEmpCode("RUDRA@NEXUSHR");
            rudra.setName("Rudra Tiwari");
            rudra.setEmail("rudra.tiwari@nexushr.com");
            rudra.setDepartment("ADMIN");
            rudra.setStatus("Active");
            rudra.setPassword(passwordEncoder.encode("admin123"));
            rudra.setRole("ADMIN");
            rudra.setHireDate(LocalDate.of(2024, 1, 1));
            rudra.setCtc(150000.0);
            employeeRepository.save(rudra);

            // Seed Aditi Gupta
            Employee aditi = new Employee();
            aditi.setEmpCode("ADITI@NEXUSHR");
            aditi.setName("Aditi Gupta");
            aditi.setEmail("aditi.gupta@nexushr.com");
            aditi.setDepartment("ADMIN");
            aditi.setStatus("Active");
            aditi.setPassword(passwordEncoder.encode("admin123"));
            aditi.setRole("ADMIN");
            aditi.setHireDate(LocalDate.of(2024, 1, 1));
            aditi.setCtc(150000.0);
            employeeRepository.save(aditi);

            System.out.println("✅ Database seeded with default admin accounts (SAHIL@NEXUSHR, RUDRA@NEXUSHR, ADITI@NEXUSHR).");
        } else {
            System.out.println("ℹ️ Database already contains records. Skipping seeding.");
        }
    }
}
