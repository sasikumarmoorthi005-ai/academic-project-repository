package com.example.projectvault.dto;

import java.time.LocalDateTime;

public record UserDTO(Long id, String name, String email, String role, String department, String course,
                      LocalDateTime createdAt,
                      long projectCount, long ratedPublicProjectCount, Double averageProjectRating,
                      boolean hasProfileImage) {
}
