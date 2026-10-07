package com.example.projectvault.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record PasswordResetRequestDTO(
        @NotBlank @Email String email,
        @NotNull @Past LocalDate dateOfBirth,
        @NotBlank @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        String newPassword) {}
