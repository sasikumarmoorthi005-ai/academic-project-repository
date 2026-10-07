package com.example.projectvault.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")

public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(nullable = false)
    private String password;

    /** ADMIN or STUDENT */
    @Column(nullable = false)
    private String role = "STUDENT";

    @Column(length = 2000)
    private String summary;

    @Column(length = 120)
    private String department;

    @Column(length = 16)
    private String profileVisibility = "PRIVATE";

    @Column(length = 120)
    private String course;

    @Column(length = 500)
    private String skills;

    private String profileImageName;

    private String profileImageType;

    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }

    // Explicit accessors keep this project independent of IDE-specific Lombok setup.
    public Long getId() { return this.id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return this.name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return this.email; }
    public void setEmail(String email) { this.email = email; }
    public LocalDate getDateOfBirth() { return this.dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getPassword() { return this.password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return this.role; }
    public void setRole(String role) { this.role = role; }
    public String getSummary() { return this.summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getDepartment() { return this.department; }
    public void setDepartment(String department) { this.department = department; }
    public String getProfileVisibility() { return this.profileVisibility == null ? "PRIVATE" : this.profileVisibility; }
    public void setProfileVisibility(String profileVisibility) { this.profileVisibility = profileVisibility; }
    public String getCourse() { return this.course; }
    public void setCourse(String course) { this.course = course; }
    public String getSkills() { return this.skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public String getProfileImageName() { return this.profileImageName; }
    public void setProfileImageName(String profileImageName) { this.profileImageName = profileImageName; }
    public String getProfileImageType() { return this.profileImageType; }
    public void setProfileImageType(String profileImageType) { this.profileImageType = profileImageType; }
    public LocalDateTime getCreatedAt() { return this.createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
