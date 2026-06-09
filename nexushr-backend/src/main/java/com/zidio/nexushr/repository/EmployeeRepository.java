package com.zidio.nexushr.repository;

import com.zidio.nexushr.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    /**
     * Finds an employee by their unique employee code, ignoring case.
     * @param empCode The employee code to search for.
     * @return An Optional containing the employee if found.
     */
    Optional<Employee> findByEmpCode(String empCode);
}