package com.example.projectvault.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ProjectRatingRequestDTO(
        @NotNull(message = "Choose a star rating")
        @Min(value = 1, message = "The minimum rating is 1 star")
        @Max(value = 5, message = "The maximum rating is 5 stars")
        Integer rating) {}
