package com.example.projectvault.service;

import com.example.projectvault.dto.ProjectDTO;
import com.example.projectvault.dto.GradeRequestDTO;
import com.example.projectvault.dto.ProjectRatingRequestDTO;
import com.example.projectvault.entity.Project;
import com.example.projectvault.entity.User;
import com.example.projectvault.repository.ProjectRepository;
import com.example.projectvault.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ProjectService {

    private final ProjectRepository projects;
    private final UserRepository users;
    private final VersionService versionService;
    private final FileService fileService;
    private final ProjectActivityService activityService;

    public ProjectService(ProjectRepository projects, UserRepository users,
                          VersionService versionService, FileService fileService,
                          ProjectActivityService activityService) {
        this.projects = projects;
        this.users = users;
        this.versionService = versionService;
        this.fileService = fileService;
        this.activityService = activityService;
    }

    private User user(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in"));
    }

    private boolean isAdmin(User u) {
        return "ADMIN".equals(u.getRole());
    }

    private boolean isStudent(User u) {
        return "STUDENT".equals(u.getRole());
    }

    private boolean isDepartmentScopedAdmin(User u) {
        return isAdmin(u) && u.getDepartment() != null && !u.getDepartment().isBlank();
    }

    private boolean isSuperAdmin(User u) {
        return isAdmin(u) && (u.getDepartment() == null || u.getDepartment().isBlank());
    }

    private boolean sameDepartment(User left, User right) {
        if (left == null || right == null) return false;
        String leftDepartment = left.getDepartment() == null ? null : left.getDepartment().trim();
        String rightDepartment = right.getDepartment() == null ? null : right.getDepartment().trim();
        return leftDepartment != null && rightDepartment != null
                && leftDepartment.equalsIgnoreCase(rightDepartment);
    }

    // ---- access rules (also used by FileController / VersionController) ----

    private String normalizedVisibility(String raw) {
        return switch (raw == null ? "" : raw.trim().toUpperCase()) {
            case "DEPARTMENT" -> "DEPARTMENT";
            case "PUBLIC" -> "PUBLIC";
            default -> "PRIVATE";
        };
    }

    private boolean canViewProject(Project p, User viewer) {
        if (p == null || viewer == null) return false;
        if (p.getOwner() != null && viewer.getId().equals(p.getOwner().getId())) {
            return true;
        }
        String visibility = normalizedVisibility(p.getVisibility());
        if ("PUBLIC".equals(visibility)) {
            return true;
        }
        if ("DEPARTMENT".equals(visibility)) {
            return sameDepartment(viewer, p.getOwner());
        }
        return false;
    }

    public void assertView(Project p, String email) {
        User u = user(email);
        if (!canViewProject(p, u)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have access to this project");
        }
    }

    public void assertFileView(Project p, com.example.projectvault.entity.ProjectFile.Category category, String email) {
        assertView(p, email);
        User viewer = user(email);
        boolean owner = p.getOwner() != null && viewer.getId().equals(p.getOwner().getId());
        boolean shareableCategory = category == com.example.projectvault.entity.ProjectFile.Category.DOCUMENTATION
                || category == com.example.projectvault.entity.ProjectFile.Category.PRESENTATION;
        if (!owner && !shareableCategory) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the project owner can access source code and other files");
        }
    }

    public boolean isOwner(Project p, String email) {
        User viewer = user(email);
        return p.getOwner() != null && viewer.getId().equals(p.getOwner().getId());
    }

    public boolean isAdmin(String email) {
        return isAdmin(user(email));
    }

    public void assertCanViewActivity(String email) {
        if (isSuperAdmin(user(email))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Institute administrators can view student portfolios but not project activity analytics");
        }
    }

    public void assertEdit(Project p, String email) {
        User u = user(email);
        if (!isStudent(u) || p.getOwner() == null || !p.getOwner().getId().equals(u.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the student who owns this project can change it");
        }
    }

    private Project find(Long id) {
        return projects.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));
    }

    private ProjectDTO reviewableDto(Project project, User reviewer) {
        boolean departmentReviewer = isDepartmentScopedAdmin(reviewer)
                && sameDepartment(reviewer, project.getOwner());
        ProjectDTO dto = ProjectDTO.fromShared(project, departmentReviewer);
        dto.setReviewEligible(departmentReviewer
                && "PUBLIC".equals(normalizedVisibility(project.getVisibility())));
        return dto;
    }

    @Transactional(readOnly = true)
    public Project getViewable(Long id, String email) {
        Project p = find(id);
        assertView(p, email);
        return p;
    }

    @Transactional(readOnly = true)
    public Project getEditable(Long id, String email) {
        Project p = find(id);
        assertEdit(p, email);
        return p;
    }

    // ---- queries ----

    @Transactional(readOnly = true)
    public List<ProjectDTO> mine(String email) {
        if (isSuperAdmin(user(email))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Institute administrators can view student portfolios but not project listings");
        }
        return viewableProjectList(email).stream()
                .map(p -> ProjectDTO.from(p, false, false)).toList();
    }

    @Transactional(readOnly = true)
    public List<Project> viewableProjectList(String email) {
        User viewer = user(email);
        if (isAdmin(viewer)) {
            return projects.findAll().stream()
                    .filter(project -> canViewProject(project, viewer))
                    .sorted((left, right) -> right.getUpdatedAt().compareTo(left.getUpdatedAt()))
                    .toList();
        }
        return projects.findByOwnerIdOrderByUpdatedAtDesc(viewer.getId());
    }

    @Transactional(readOnly = true)
    public List<Project> activityProjectList(String email) {
        User viewer = user(email);
        List<Project> viewableProjects = viewableProjectList(email);
        if (!isAdmin(viewer)) {
            return viewableProjects;
        }
        return viewableProjects.stream()
                .filter(project -> project.getOwner() != null && isStudent(project.getOwner()))
                .filter(project -> isSuperAdmin(viewer)
                        ? "PUBLIC".equals(normalizedVisibility(project.getVisibility()))
                        : sameDepartment(viewer, project.getOwner())
                                && !"PRIVATE".equals(normalizedVisibility(project.getVisibility())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> shared(String email) {
        User viewer = user(email);
        if (isSuperAdmin(viewer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Institute administrators can view student portfolios but not project listings");
        }
        Long me = viewer.getId();
        return projects.findAll().stream()
                .filter(project -> project.getOwner() != null && !project.getOwner().getId().equals(me))
                .filter(project -> canViewProject(project, viewer))
                .map(project -> ProjectDTO.from(project, false, false)).toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> all(String email) {
        User viewer = user(email);
        if (isSuperAdmin(viewer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Institute administrators can view student portfolios but not manage project records");
        }
        return projects.findAll().stream()
                .filter(project -> project.getOwner() != null)
                .filter(project -> canViewProject(project, viewer))
                .map(p -> ProjectDTO.from(p, false, true)).toList();
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> reviewQueue(String email) {
        User reviewer = user(email);
        if (!isDepartmentScopedAdmin(reviewer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only department administrators can review projects");
        }
        return projects.findAll().stream()
                .filter(project -> "PUBLIC".equals(normalizedVisibility(project.getVisibility())))
                .filter(project -> project.getOwner() != null && isStudent(project.getOwner()))
                .filter(project -> sameDepartment(reviewer, project.getOwner()))
                .sorted((left, right) -> right.getUpdatedAt().compareTo(left.getUpdatedAt()))
                .map(project -> {
                    ProjectDTO dto = ProjectDTO.from(project, false, true);
                    dto.setReviewEligible(true);
                    return dto;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectDTO get(Long id, String email) {
        User u = user(email);
        Project project = getViewable(id, email);
        boolean owner = isStudent(u) && project.getOwner().getId().equals(u.getId());
        return owner ? ProjectDTO.from(project, true, false)
                : reviewableDto(project, u);
    }

    // ---- commands ----

    private String visibility(String v) {
        String normalized = normalizedVisibility(v);
        return normalized;
    }

    public ProjectDTO create(ProjectDTO dto, String email) {
        User owner = user(email);
        if (!isStudent(owner)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students can create projects");
        }
        Project p = new Project();
        p.setTitle(dto.getTitle().trim());
        p.setDescription(dto.getDescription());
        p.setTechStack(dto.getTechStack());
        p.setCategory(dto.getCategory());
        p.setVisibility(visibility(dto.getVisibility()));
        p.setOwner(owner);
        projects.save(p);
        activityService.record(p, "PROJECT_CREATED", "Project created");
        versionService.create(p, "Initial version");
        return ProjectDTO.from(p, true, false);
    }

    public ProjectDTO update(Long id, ProjectDTO dto, String email) {
        Project p = find(id);
        assertEdit(p, email);
        p.setTitle(dto.getTitle().trim());
        p.setDescription(dto.getDescription());
        p.setTechStack(dto.getTechStack());
        p.setCategory(dto.getCategory());
        p.setVisibility(visibility(dto.getVisibility()));
        projects.save(p);
        activityService.record(p, "PROJECT_UPDATED", "Project details updated");
        return ProjectDTO.from(p, true, false);
    }

    public ProjectDTO grade(Long id, GradeRequestDTO evaluation, String email) {
        User grader = user(email);
        if (!isDepartmentScopedAdmin(grader)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only department administrators can grade projects");
        }
        Project p = find(id);
        assertAdminDepartmentScope(p, grader);
        requirePublicProject(p);
        p.setGrade(evaluation.grade());
        p.setFunctionalityScore(evaluation.functionalityScore());
        p.setTechnicalQualityScore(evaluation.technicalQualityScore());
        p.setOriginalityScore(evaluation.originalityScore());
        p.setPresentationScore(evaluation.presentationScore());
        p.setGradeFeedback(evaluation.feedback() == null || evaluation.feedback().isBlank()
                ? null : evaluation.feedback().trim());
        p.setGradedAt(LocalDateTime.now());
        projects.save(p);
        return reviewableDto(p, grader);
    }

    public ProjectDTO ratePublicProject(Long id, ProjectRatingRequestDTO request, String email) {
        User grader = user(email);
        if (!isDepartmentScopedAdmin(grader)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only department administrators can rate projects");
        }
        Project p = find(id);
        assertAdminDepartmentScope(p, grader);
        requirePublicProject(p);
        p.setStarRating(request.rating());
        projects.save(p);
        activityService.record(p, "RATING_SET", "Admin rated this project " + request.rating() + " out of 5 stars");
        return reviewableDto(p, grader);
    }

    public ProjectDTO removePublicProjectRating(Long id, String email) {
        User reviewer = user(email);
        if (!isDepartmentScopedAdmin(reviewer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only department administrators can remove project ratings");
        }
        Project project = find(id);
        assertAdminDepartmentScope(project, reviewer);
        requirePublicProject(project);
        if (project.getStarRating() != null) {
            project.setStarRating(null);
            projects.save(project);
            activityService.record(project, "RATING_REMOVED", "Admin removed the project rating");
        }
        return reviewableDto(project, reviewer);
    }

    private void requirePublicProject(Project project) {
        if (!"PUBLIC".equalsIgnoreCase(project.getVisibility())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Administrators can only review public projects");
        }
    }

    private void assertAdminDepartmentScope(Project project, User admin) {
        if (!isDepartmentScopedAdmin(admin) || !sameDepartment(admin, project.getOwner())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You can only administer projects in your authorized department");
        }
    }

    public void delete(Long id, String email) {
        Project p = find(id);
        assertEdit(p, email);
        deleteProject(p);
    }

    /** Used by delete and by AuthService when an admin removes a user. */
    public void deleteProject(Project p) {
        Long id = p.getId();
        activityService.deleteForProject(id);
        projects.delete(p);
        projects.flush();
        fileService.deleteProjectFolder(id);
    }
}
