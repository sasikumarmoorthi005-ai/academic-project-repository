package com.example.projectvault.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import java.time.LocalDate;

public record RecoveryDetailsDTO(@NotNull @Past LocalDate dateOfBirth) {}
