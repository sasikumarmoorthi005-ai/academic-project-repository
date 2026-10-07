package com.example.projectvault.dto;

public record AuthResponseDTO(String token, Long id, String name, String email, String role, String department) {
    public AuthResponseDTO(String token, Long id, String name, String email, String role) {
        this(token, id, name, email, role, null);
    }
}
