package com.example.projectvault.controller;

import com.example.projectvault.dto.ProjectDTO;
import com.example.projectvault.entity.Project;
import com.example.projectvault.entity.ProjectVersion;
import com.example.projectvault.service.ProjectService;
import com.example.projectvault.service.VersionService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/versions")
public class VersionController {

    private final ProjectService projectService;
    private final VersionService versionService;

    public VersionController(ProjectService projectService, VersionService versionService) {
        this.projectService = projectService;
        this.versionService = versionService;
    }

    @GetMapping
    public List<ProjectDTO.VersionDTO> list(@PathVariable("projectId") Long projectId, Authentication auth) {
        Project p = projectService.getViewable(projectId, auth.getName());
        List<ProjectDTO.VersionDTO> versions = versionService.list(p);
        if (projectService.isOwner(p, auth.getName())) return versions;
        return versions.stream().map(version -> {
            int visibleFileCount = (int) p.getFiles().stream()
                    .filter(file -> file.getVersion() != null
                            && file.getVersion().getId().equals(version.id()))
                    .filter(file -> file.getCategory() == com.example.projectvault.entity.ProjectFile.Category.DOCUMENTATION
                            || file.getCategory() == com.example.projectvault.entity.ProjectFile.Category.PRESENTATION)
                    .count();
            return new ProjectDTO.VersionDTO(version.id(), version.versionNumber(), version.notes(),
                    version.createdAt(), visibleFileCount);
        }).toList();
    }

    @PostMapping
    public ProjectDTO.VersionDTO create(@PathVariable("projectId") Long projectId, @RequestBody Map<String, String> body,
                                        Authentication auth) {
        Project p = projectService.getEditable(projectId, auth.getName());
        ProjectVersion v = versionService.create(p, body.get("notes"));
        return ProjectDTO.versionDto(v, p.getFiles());
    }
}
