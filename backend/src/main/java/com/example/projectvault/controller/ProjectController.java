package com.example.projectvault.controller;

import com.example.projectvault.dto.ProjectDTO;
import com.example.projectvault.dto.GradeRequestDTO;
import com.example.projectvault.dto.ProjectRatingRequestDTO;
import com.example.projectvault.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService service;

    public ProjectController(ProjectService service) {
        this.service = service;
    }

    /** Projects owned by the signed-in user. */
    @GetMapping
    public List<ProjectDTO> mine(Authentication auth) {
        return service.mine(auth.getName());
    }

    /** Public projects from other users. */
    @GetMapping("/shared")
    public List<ProjectDTO> shared(Authentication auth) {
        return service.shared(auth.getName());
    }

    /** Public projects (admin only). */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ProjectDTO> all(Authentication auth) {
        return service.all(auth.getName());
    }

    @GetMapping("/reviews")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ProjectDTO> reviewQueue(Authentication auth) {
        return service.reviewQueue(auth.getName());
    }

    @GetMapping("/{id}")
    public ProjectDTO get(@PathVariable("id") Long id, Authentication auth) {
        return service.get(id, auth.getName());
    }

    @PostMapping
    public ProjectDTO create(@Valid @RequestBody ProjectDTO dto, Authentication auth) {
        return service.create(dto, auth.getName());
    }

    @PutMapping("/{id}")
    public ProjectDTO update(@PathVariable("id") Long id, @Valid @RequestBody ProjectDTO dto, Authentication auth) {
        return service.update(id, dto, auth.getName());
    }

    @PutMapping("/{id}/grade")
    public ProjectDTO grade(@PathVariable("id") Long id, @Valid @RequestBody GradeRequestDTO dto,
                            Authentication auth) {
        return service.grade(id, dto, auth.getName());
    }

    @PutMapping("/{id}/rating")
    public ProjectDTO rate(@PathVariable("id") Long id, @Valid @RequestBody ProjectRatingRequestDTO dto,
                           Authentication auth) {
        return service.ratePublicProject(id, dto, auth.getName());
    }

    @DeleteMapping("/{id}/rating")
    public ProjectDTO removeRating(@PathVariable("id") Long id, Authentication auth) {
        return service.removePublicProjectRating(id, auth.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id, Authentication auth) {
        service.delete(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
