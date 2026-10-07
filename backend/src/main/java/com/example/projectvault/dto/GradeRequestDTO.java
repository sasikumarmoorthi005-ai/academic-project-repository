package com.example.projectvault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record GradeRequestDTO(
        @NotBlank(message = "Select a grade")
        @Pattern(regexp = "[A-F]", message = "Grade must be a letter from A to F")
        String grade,
        @NotNull(message = "Rate functionality")
        @Min(1) @Max(5)
        Integer functionalityScore,
        @NotNull(message = "Rate technical quality")
        @Min(1) @Max(5)
        Integer technicalQualityScore,
        @NotNull(message = "Rate originality")
        @Min(1) @Max(5)
        Integer originalityScore,
        @NotNull(message = "Rate presentation")
        @Min(1) @Max(5)
        Integer presentationScore,
        @Size(max = 2000, message = "Feedback must be 2000 characters or fewer")
        String feedback) {}
