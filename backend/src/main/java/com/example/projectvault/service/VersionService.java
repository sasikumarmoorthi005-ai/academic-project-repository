package com.example.projectvault.service;

import com.example.projectvault.dto.ProjectDTO;
import com.example.projectvault.entity.Project;
import com.example.projectvault.entity.ProjectVersion;
import com.example.projectvault.repository.ProjectRepository;
import com.example.projectvault.repository.VersionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class VersionService {

    private final VersionRepository versions;
    private final ProjectRepository projects;
    private final ProjectActivityService activities;

    public VersionService(VersionRepository versions, ProjectRepository projects, ProjectActivityService activities) {
        this.versions = versions;
        this.projects = projects;
        this.activities = activities;
    }

    @Transactional
    public ProjectVersion create(Project project, String notes) {
        ProjectVersion v = new ProjectVersion();
        v.setProject(project);
        v.setVersionNumber(project.getVersions().size() + 1);
        v.setNotes(notes == null || notes.isBlank() ? "No notes" : notes.trim());
        versions.save(v);
        project.getVersions().add(v);
        projects.save(project); // refreshes updatedAt
        activities.record(project, "VERSION_SAVED", "Version " + v.getVersionNumber() + " saved");
        return v;
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO.VersionDTO> list(Project project) {
        return versions.findByProjectIdOrderByVersionNumberDesc(project.getId()).stream()
                .map(v -> ProjectDTO.versionDto(v, project.getFiles())).toList();
    }
}
