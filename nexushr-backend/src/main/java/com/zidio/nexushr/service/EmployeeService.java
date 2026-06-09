package com.zidio.nexushr.service;

import com.zidio.nexushr.entity.Employee;
import com.zidio.nexushr.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    // Sabhi employees ki list lene ke liye
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    // Naya employee save karne ke liye
    public Employee saveEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    // ID se employee dhoondhne ke liye
    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id).orElse(null);
    }

    // Employee delete karne ke liye
    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }
}