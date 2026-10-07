package com.example.projectvault.controller;

import com.example.projectvault.dto.ProjectActivityDTO;
import com.example.projectvault.dto.DailyActivityDTO;
import com.example.projectvault.entity.Project;
import com.example.projectvault.service.ProjectActivityService;
import com.example.projectvault.service.ProjectService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectActivityController {
    private final ProjectService projects;
    private final ProjectActivityService activities;

    public ProjectActivityController(ProjectService projects, ProjectActivityService activities) {
        this.projects = projects;
        this.activities = activities;
    }

    @GetMapping("/activity")
    public List<ProjectActivityDTO> myActivity(Authentication auth) {
        projects.assertCanViewActivity(auth.getName());
        List<Long> projectIds = projects.activityProjectList(auth.getName()).stream()
                .map(Project::getId)
                .toList();
        return projects.isAdmin(auth.getName())
                ? activities.forSharedProjects(projectIds, LocalDateTime.now().minusMonths(6))
                : activities.forProjects(projectIds, LocalDateTime.now().minusMonths(6));
    }

    @GetMapping("/activity/daily")
    public List<DailyActivityDTO> dailyActivity(
            @RequestParam LocalDate from,
            @RequestParam LocalDate to,
            Authentication auth) {
        projects.assertCanViewActivity(auth.getName());
        if (from.isAfter(to) || to.equals(LocalDate.MAX) || ChronoUnit.DAYS.between(from, to) > 366) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Choose a date range of no more than 367 days");
        }
        List<Long> projectIds = projects.activityProjectList(auth.getName()).stream()
                .map(Project::getId)
                .toList();
        return activities.dailySummaries(projectIds, from, to);
    }

    @GetMapping("/{projectId}/activity")
    public List<ProjectActivityDTO> projectActivity(@PathVariable Long projectId, Authentication auth) {
        Project project = projects.getViewable(projectId, auth.getName());
        return projects.isOwner(project, auth.getName())
                ? activities.forProject(projectId)
                : activities.forSharedProject(projectId);
    }
}
