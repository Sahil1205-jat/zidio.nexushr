package com.zidio.nexushr.controller;

import com.zidio.nexushr.entity.PerformanceReview;
import com.zidio.nexushr.service.PerformanceReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class PerformanceReviewController {

    @Autowired
    private PerformanceReviewService service;

    @PostMapping
    public ResponseEntity<PerformanceReview> createReview(@RequestBody PerformanceReview review) {
        return ResponseEntity.ok(service.createReview(review));
    }

    @GetMapping("/all")
    public ResponseEntity<List<PerformanceReview>> getAllReviews() {
        return ResponseEntity.ok(service.getAllReviews());
    }

    @GetMapping("/emp/{empCode}")
    public ResponseEntity<List<PerformanceReview>> getReviewsByEmpCode(@PathVariable String empCode) {
        return ResponseEntity.ok(service.getReviewsByEmpCode(empCode));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PerformanceReview> updateReview(
            @PathVariable Long id, 
            @RequestBody PerformanceReview updateRequest) {
        return service.updateReview(id, updateRequest)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        service.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}