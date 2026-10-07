package com.example.projectvault.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
public class LoginRequestDTO {
    @NotBlank @Email
    private String email;
    @NotBlank
    private String password;

    // Explicit accessors keep this project independent of IDE-specific Lombok setup.
    public String getEmail() { return this.email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return this.password; }
    public void setPassword(String password) { this.password = password; }
}
