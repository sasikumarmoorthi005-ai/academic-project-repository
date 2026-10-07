package com.example.projectvault.repository;

import com.example.projectvault.entity.PasswordResetChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetRepository extends JpaRepository<PasswordResetChallenge, Long> {
    void deleteByUserId(Long userId);
}
