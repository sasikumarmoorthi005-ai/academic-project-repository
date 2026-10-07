package com.example.projectvault.dto;

public record StudentSearchResultDTO(Long id, String name, String department,
                                     String course, boolean hasProfileImage, long publicProjectCount) {}
