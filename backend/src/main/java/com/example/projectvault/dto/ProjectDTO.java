package com.example.projectvault.dto;

import com.example.projectvault.entity.Project;
import com.example.projectvault.entity.ProjectFile;
import com.example.projectvault.entity.ProjectVersion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

public class ProjectDTO {
    private Long id;
    @NotBlank(message = "Title is required")
    @Size(max = 180, message = "Title must be 180 characters or fewer")
    private String title;
    @Size(max = 5000, message = "Description must be 5000 characters or fewer")
    private String description;
    private String techStack;
    private String category;
    private String visibility;
    private boolean reviewEligible;
    private Integer starRating;
    private String grade;
    private Integer functionalityScore;
    private Integer technicalQualityScore;
    private Integer originalityScore;
    private Integer presentationScore;
    private String gradeFeedback;
    private LocalDateTime gradedAt;

    private Long ownerId;
    private String ownerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int fileCount;
    private int versionCount;
    private List<FileDTO> files;
    private List<VersionDTO> versions;

    public record FileDTO(Long id, String fileName, String fileType, String category, long size,
                          Long versionId, LocalDateTime uploadedAt) {}

    public record VersionDTO(Long id, int versionNumber, String notes, LocalDateTime createdAt, int fileCount) {}

    public static FileDTO fileDto(ProjectFile f) {
        return new FileDTO(f.getId(), f.getFileName(), f.getFileType(),
                f.getCategory() == null ? "OTHER" : f.getCategory().name(), f.getSize(),
                f.getVersion() == null ? null : f.getVersion().getId(), f.getUploadedAt());
    }

    public static VersionDTO versionDto(ProjectVersion v, List<ProjectFile> allFiles) {
        int count = (int) allFiles.stream()
                .filter(f -> f.getVersion() != null && f.getVersion().getId().equals(v.getId())).count();
        return new VersionDTO(v.getId(), v.getVersionNumber(), v.getNotes(), v.getCreatedAt(), count);
    }

    public static ProjectDTO from(Project p, boolean detail, boolean includeGrade) {
        ProjectDTO d = new ProjectDTO();
        d.id = p.getId();
        d.title = p.getTitle();
        d.description = p.getDescription();
        d.techStack = p.getTechStack();
        d.category = p.getCategory();
        d.visibility = p.getVisibility();
        d.starRating = p.getStarRating();
        if (includeGrade) {
            d.grade = p.getGrade();
            d.functionalityScore = p.getFunctionalityScore();
            d.technicalQualityScore = p.getTechnicalQualityScore();
            d.originalityScore = p.getOriginalityScore();
            d.presentationScore = p.getPresentationScore();
            d.gradeFeedback = p.getGradeFeedback();
            d.gradedAt = p.getGradedAt();
        }
        d.ownerId = p.getOwner().getId();
        d.ownerName = p.getOwner().getName();
        d.createdAt = p.getCreatedAt();
        d.updatedAt = p.getUpdatedAt();
        d.fileCount = p.getFiles().size();
        d.versionCount = p.getVersions().size();
        if (detail) {
            d.files = p.getFiles().stream().map(ProjectDTO::fileDto).toList();
            d.versions = p.getVersions().stream().map(v -> versionDto(v, p.getFiles())).toList();
        }
        return d;
    }

    public static ProjectDTO fromShared(Project p, boolean includeGrade) {
        ProjectDTO d = from(p, true, includeGrade);
        List<ProjectFile> visibleFiles = p.getFiles().stream()
                .filter(file -> file.getCategory() == ProjectFile.Category.DOCUMENTATION
                        || file.getCategory() == ProjectFile.Category.PRESENTATION)
                .toList();
        d.files = visibleFiles.stream().map(ProjectDTO::fileDto).toList();
        d.fileCount = d.files.size();
        d.versions = p.getVersions().stream().map(version -> {
            int count = (int) visibleFiles.stream()
                    .filter(file -> file.getVersion() != null
                            && file.getVersion().getId().equals(version.getId()))
                    .count();
            return new VersionDTO(version.getId(), version.getVersionNumber(), version.getNotes(),
                    version.getCreatedAt(), count);
        }).toList();
        return d;
    }

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
    public String getVisibility() { return this.visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public boolean isReviewEligible() { return this.reviewEligible; }
    public void setReviewEligible(boolean reviewEligible) { this.reviewEligible = reviewEligible; }
    public Integer getStarRating() { return this.starRating; }
    public void setStarRating(Integer starRating) { this.starRating = starRating; }
    public String getGrade() { return this.grade; }
    public void setGrade(String grade) { this.grade = grade; }
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
    public Long getOwnerId() { return this.ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
    public String getOwnerName() { return this.ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public LocalDateTime getCreatedAt() { return this.createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return this.updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public int getFileCount() { return this.fileCount; }
    public void setFileCount(int fileCount) { this.fileCount = fileCount; }
    public int getVersionCount() { return this.versionCount; }
    public void setVersionCount(int versionCount) { this.versionCount = versionCount; }
    public List<FileDTO> getFiles() { return this.files; }
    public void setFiles(List<FileDTO> files) { this.files = files; }
    public List<VersionDTO> getVersions() { return this.versions; }
    public void setVersions(List<VersionDTO> versions) { this.versions = versions; }
}
