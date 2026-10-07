package com.example.projectvault.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
public class RegisterRequestDTO {
    @NotBlank
    private String name;
    @NotBlank @Email
    private String email;
    @NotNull @Past
    private LocalDate dateOfBirth;
    @NotBlank @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    private String password;
    @Size(max = 120, message = "Department must be 120 characters or fewer")
    private String department;

    // Explicit accessors keep this project independent of IDE-specific Lombok setup.
    public String getName() { return this.name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return this.email; }
    public void setEmail(String email) { this.email = email; }
    public LocalDate getDateOfBirth() { return this.dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getPassword() { return this.password; }
    public void setPassword(String password) { this.password = password; }
    public String getDepartment() { return this.department; }
    public void setDepartment(String department) { this.department = department; }
}
