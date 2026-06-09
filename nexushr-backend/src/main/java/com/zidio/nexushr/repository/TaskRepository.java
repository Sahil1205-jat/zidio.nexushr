package com.zidio.nexushr.repository;

import com.zidio.nexushr.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    /**
     * Finds all tasks assigned to a specific employee, ignoring case.
     * This is more efficient than fetching all tasks and filtering in memory.
     * @param empCode The employee code to search for.
     * @return A list of tasks assigned to the employee.
     */
    List<Task> findAllByAssignedToIgnoreCase(String empCode);
}