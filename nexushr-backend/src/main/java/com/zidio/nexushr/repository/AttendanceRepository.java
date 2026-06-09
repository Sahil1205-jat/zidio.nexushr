package com.zidio.nexushr.repository;

import com.zidio.nexushr.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findByEmpCodeAndDate(String empCode, LocalDate date);
    List<Attendance> findByEmpCode(String empCode);
}