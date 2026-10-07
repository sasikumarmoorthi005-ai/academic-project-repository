package com.example.projectvault.repository;

import com.example.projectvault.entity.ProfileActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface ProfileActivityRepository extends JpaRepository<ProfileActivity, Long> {
    void deleteByUserId(Long userId);

    List<ProfileActivity> findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(
            Long userId, LocalDateTime since);
}
