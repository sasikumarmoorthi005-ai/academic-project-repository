package com.example.projectvault.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_files")

public class ProjectFile {
    public enum Category {
        SOURCE_CODE, DOCUMENTATION, PRESENTATION, OTHER
    }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(name = "original_name", nullable = false)
    private String originalName;

    @Column(name = "content_type", nullable = false)
    private String fileType;
    @Enumerated(EnumType.STRING)
    private Category category;
    private long size;

    /** name of the file on disk */
    @Column(nullable = false)
    private String storedName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "version_id")
    private ProjectVersion version;

    private LocalDateTime uploadedAt;

    @PrePersist
    void onCreate() { uploadedAt = LocalDateTime.now(); }

    // Explicit accessors keep this project independent of IDE-specific Lombok setup.
    public Long getId() { return this.id; }
    public void setId(Long id) { this.id = id; }
    public String getFileName() { return this.fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getOriginalName() { return this.originalName; }
    public void setOriginalName(String originalName) { this.originalName = originalName; }
    public String getFileType() { return this.fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public Category getCategory() { return this.category; }
    public void setCategory(Category category) { this.category = category; }
    public long getSize() { return this.size; }
    public void setSize(long size) { this.size = size; }
    public String getStoredName() { return this.storedName; }
    public void setStoredName(String storedName) { this.storedName = storedName; }
    public Project getProject() { return this.project; }
    public void setProject(Project project) { this.project = project; }
    public ProjectVersion getVersion() { return this.version; }
    public void setVersion(ProjectVersion version) { this.version = version; }
    public LocalDateTime getUploadedAt() { return this.uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}
