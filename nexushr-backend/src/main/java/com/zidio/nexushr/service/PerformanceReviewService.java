package com.zidio.nexushr.service;

import com.zidio.nexushr.entity.PerformanceReview;
import com.zidio.nexushr.repository.PerformanceReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class PerformanceReviewService {

    @Autowired
    private PerformanceReviewRepository repository;

    @Transactional
    public PerformanceReview createReview(PerformanceReview review) {
        if (review.getStatus() == null) {
            review.setStatus("Pending Self-Assessment");
        }
        return repository.save(review);
    }

    public List<PerformanceReview> getAllReviews() {
        return repository.findAll();
    }

    public List<PerformanceReview> getReviewsByEmpCode(String empCode) {
        return repository.findByEmpCode(empCode);
    }

    @Transactional
    public Optional<PerformanceReview> updateReview(Long id, PerformanceReview updateRequest) {
        return repository.findById(id).map(existing -> {
            if (updateRequest.getSelfAssessment() != null) {
                existing.setSelfAssessment(updateRequest.getSelfAssessment());
            }
            if (updateRequest.getManagerFeedback() != null) {
                existing.setManagerFeedback(updateRequest.getManagerFeedback());
            }
            if (updateRequest.getRating() != null) {
                existing.setRating(updateRequest.getRating());
            }
            if (updateRequest.getStatus() != null) {
                existing.setStatus(updateRequest.getStatus());
            }
            return repository.save(existing);
        });
    }

    @Transactional
    public void deleteReview(Long id) {
        repository.deleteById(id);
    }
}