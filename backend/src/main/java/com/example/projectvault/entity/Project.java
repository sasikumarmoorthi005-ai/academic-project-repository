package com.example.projectvault.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")

public class Project {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String techStack;
    private String category;

    private String grade;

    private Integer starRating;

    private Integer functionalityScore;
    private Integer technicalQualityScore;
    private Integer originalityScore;
    private Integer presentationScore;

    @Column(columnDefinition = "TEXT")
    private String gradeFeedback;

    private LocalDateTime gradedAt;

    /** PRIVATE (owner only), DEPARTMENT (same-department access), or PUBLIC (all signed-in users). */
    @Column(nullable = false)
    private String visibility = "PRIVATE";

    public boolean isPrivate() { return "PRIVATE".equalsIgnoreCase(this.visibility); }
    public boolean isDepartmentOnly() { return "DEPARTMENT".equalsIgnoreCase(this.visibility); }
    public boolean isPublic() { return "PUBLIC".equalsIgnoreCase(this.visibility); }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private User owner;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // files must stay declared before versions so they are deleted first
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("uploadedAt DESC")
    private List<ProjectFile> files = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("versionNumber DESC")
    private List<ProjectVersion> versions = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC")
    private List<ProjectActivity> activities = new ArrayList<>();

    @PrePersist
    void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }

    // Explicit accessors keep this project independent of IDE-specific Lombok setup.
    public Long getId() { return this.id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return this.title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return this.description; }
    public void setDescription(String description) { this.description = description; }
    public String getTechStack() { return this.techStack; }
    public void setTechStack(String techStack) { this.techStack = techStack; }
    public String getCategory() { return this.category; }
    public void setCategory(String category) { this.category = category; }
    public String getGrade() { return this.grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public Integer getStarRating() { return this.starRating; }
    public void setStarRating(Integer starRating) { this.starRating = starRating; }
    public Integer getFunctionalityScore() { return this.functionalityScore; }
    public void setFunctionalityScore(Integer functionalityScore) { this.functionalityScore = functionalityScore; }
    public Integer getTechnicalQualityScore() { return this.technicalQualityScore; }
    public void setTechnicalQualityScore(Integer technicalQualityScore) { this.technicalQualityScore = technicalQualityScore; }
    public Integer getOriginalityScore() { return this.originalityScore; }
    public void setOriginalityScore(Integer originalityScore) { this.originalityScore = originalityScore; }
    public Integer getPresentationScore() { return this.presentationScore; }
    public void setPresentationScore(Integer presentationScore) { this.presentationScore = presentationScore; }
    public String getGradeFeedback() { return this.gradeFeedback; }
    public void setGradeFeedback(String gradeFeedback) { this.gradeFeedback = gradeFeedback; }
    public LocalDateTime getGradedAt() { return this.gradedAt; }
    public void setGradedAt(LocalDateTime gradedAt) { this.gradedAt = gradedAt; }
    public String getVisibility() { return this.visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public User getOwner() { return this.owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public LocalDateTime getCreatedAt() { return this.createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return this.updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<ProjectFile> getFiles() { return this.files; }
    public void setFiles(List<ProjectFile> files) { this.files = files; }
    public List<ProjectVersion> getVersions() { return this.versions; }
    public void setVersions(List<ProjectVersion> versions) { this.versions = versions; }
    public List<ProjectActivity> getActivities() { return this.activities; }
    public void setActivities(List<ProjectActivity> activities) { this.activities = activities; }
}
