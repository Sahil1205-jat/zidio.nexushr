package com.zidio.nexushr.repository;

import com.zidio.nexushr.entity.LeaveRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeaveRepository extends JpaRepository<LeaveRecord, Long> {
    List<LeaveRecord> findByEmpCode(String empCode); // Ek employee ki leaves nikalne ke liye
}