package com.example.projectvault.service;

import com.example.projectvault.dto.ProjectActivityDTO;
import com.example.projectvault.dto.DailyActivityDTO;
import com.example.projectvault.entity.Project;
import com.example.projectvault.entity.ProjectActivity;
import com.example.projectvault.repository.DailyActivityCount;
import com.example.projectvault.repository.ProjectActivityRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ProjectActivityService {
    private final ProjectActivityRepository activities;

    public ProjectActivityService(ProjectActivityRepository activities) {
        this.activities = activities;
    }

    public void record(Project project, String activityType, String description) {
        ProjectActivity activity = new ProjectActivity();
        activity.setProject(project);
        activity.setActivityType(activityType);
        activity.setDescription(description);
        activities.save(activity);
    }

    public void deleteForProject(Long projectId) {
        activities.deleteByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public List<ProjectActivityDTO> forProjects(List<Long> projectIds, LocalDateTime since) {
        if (projectIds.isEmpty()) return List.of();
        return activities.findByProjectIdInAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(projectIds, since).stream()
                .map(ProjectActivityDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectActivityDTO> forSharedProjects(List<Long> projectIds, LocalDateTime since) {
        return forProjects(projectIds, since).stream().map(this::redactFileName).toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectActivityDTO> forProject(Long projectId) {
        return activities.findTop50ByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(ProjectActivityDTO::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectActivityDTO> forSharedProject(Long projectId) {
        return forProject(projectId).stream().map(this::redactFileName).toList();
    }

    @Transactional(readOnly = true)
    public List<DailyActivityDTO> dailySummaries(List<Long> projectIds, LocalDate from, LocalDate to) {
        if (projectIds.isEmpty()) return List.of();
        LocalDateTime fromInclusive = from.atStartOfDay();
        LocalDateTime toExclusive = to.plusDays(1).atStartOfDay();
        Map<LocalDate, long[]> countsByDate = new HashMap<>();
        for (DailyActivityCount row : activities.summarizeByProjectIdsAndDateRange(
                projectIds, fromInclusive, toExclusive)) {
            long[] counts = countsByDate.computeIfAbsent(row.getActivityDate(), ignored -> new long[7]);
            int index = switch (row.getActivityType()) {
                case "PROJECT_CREATED" -> 1;
                case "PROJECT_UPDATED" -> 2;
                case "VERSION_SAVED" -> 3;
                case "FILE_UPLOADED" -> 4;
                case "RATING_SET" -> 5;
                case "RATING_REMOVED" -> 6;
                default -> 0;
            };
            counts[0] += row.getEventCount();
            if (index > 0) counts[index] += row.getEventCount();
        }
        List<DailyActivityDTO> result = new ArrayList<>();
        countsByDate.entrySet().stream().sorted(Map.Entry.comparingByKey()).forEach(entry -> {
            long[] counts = entry.getValue();
            result.add(new DailyActivityDTO(entry.getKey(), counts[0], counts[1], counts[2],
                    counts[3], counts[4], counts[5], counts[6]));
        });
        return result;
    }

    @Transactional(readOnly = true)
    public LocalDateTime latestPublicActivityForDepartment(String department) {
        return activities.findLatestPublicActivityByDepartment(department);
    }

    private ProjectActivityDTO redactFileName(ProjectActivityDTO activity) {
        String description = switch (activity.activityType()) {
            case "FILE_UPLOADED" -> "A project file was uploaded";
            case "FILE_DELETED" -> "A project file was removed";
            default -> activity.description();
        };
        return new ProjectActivityDTO(activity.id(), activity.projectId(), activity.projectTitle(),
                activity.ownerName(), activity.activityType(), description, activity.createdAt());
    }
}
