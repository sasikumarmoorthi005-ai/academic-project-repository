package com.example.projectvault.service;

import com.example.projectvault.dto.AuthResponseDTO;
import com.example.projectvault.dto.AdminProvisionRequestDTO;
import com.example.projectvault.dto.LoginRequestDTO;
import com.example.projectvault.dto.RegisterRequestDTO;
import com.example.projectvault.dto.ProjectDTO;
import com.example.projectvault.dto.DepartmentSummaryDTO;
import com.example.projectvault.dto.StudentProfileDTO;
import com.example.projectvault.dto.DailyActivityDTO;
import com.example.projectvault.dto.StudentProfileUpdateDTO;
import com.example.projectvault.dto.StudentSearchResultDTO;
import com.example.projectvault.dto.UserDTO;
import com.example.projectvault.entity.Project;
import com.example.projectvault.entity.ProfileActivity;
import com.example.projectvault.repository.PasswordResetRepository;
import com.example.projectvault.entity.User;
import com.example.projectvault.repository.ProfileActivityRepository;
import com.example.projectvault.repository.ProjectRepository;
import com.example.projectvault.repository.UserRepository;
import com.example.projectvault.security.JwtService;
import com.example.projectvault.util.DepartmentConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {
    private static final long MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
    private static final Map<String, String> PROFILE_IMAGE_EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/gif", ".gif");

    private final UserRepository users;
    private final ProjectRepository projects;
    private final ProfileActivityRepository profileActivities;
    private final PasswordResetRepository passwordResets;
    private final ProjectService projectService;
    private final ProjectActivityService projectActivities;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    @Value("${app.upload-dir}")
    private String uploadDir;

    public AuthService(UserRepository users, ProjectRepository projects, ProfileActivityRepository profileActivities,
                       PasswordResetRepository passwordResets, ProjectService projectService, ProjectActivityService projectActivities,
                       PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.projects = projects;
        this.profileActivities = profileActivities;
        this.passwordResets = passwordResets;
        this.projectService = projectService;
        this.projectActivities = projectActivities;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    private AuthResponseDTO response(User u) {
        return new AuthResponseDTO(jwt.generateToken(u.getEmail(), u.getRole()),
                u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getDepartment());
    }

    public AuthResponseDTO register(RegisterRequestDTO req) {
        String email = req.getEmail().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        User u = new User();
        u.setName(req.getName().trim());
        u.setEmail(email);
        u.setDateOfBirth(req.getDateOfBirth());
        u.setPassword(encoder.encode(req.getPassword()));
        String department = DepartmentConfig.normalize(req.getDepartment());
        if (department == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department is required and must be one of the allowed department options");
        }
        u.setDepartment(department);
        u.setRole("STUDENT"); // admins are never created through public registration
        users.save(u);
        return response(u);
    }

    public AuthResponseDTO login(LoginRequestDTO req) {
        User u = users.findByEmail(req.getEmail().trim().toLowerCase())
                .filter(x -> encoder.matches(req.getPassword(), x.getPassword()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Incorrect email or password"));
        return response(u);
    }

    @Transactional
    public void resetPassword(String email, LocalDate dateOfBirth, String newPassword) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = users.findByEmail(normalizedEmail)
                .filter(candidate -> "STUDENT".equals(candidate.getRole()))
                .filter(candidate -> dateOfBirth.equals(candidate.getDateOfBirth()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Email or date of birth does not match a student account"));
        user.setPassword(encoder.encode(newPassword));
        users.save(user);
    }

    public AuthResponseDTO me(String email) {
        User u = users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in"));
        return new AuthResponseDTO(null, u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getDepartment());
    }

    @Transactional(readOnly = true)
    public StudentProfileDTO ownStudentProfile(String email) {
        User student = student(email);
        List<ProjectDTO> ownedProjects = projects.findByOwnerIdOrderByUpdatedAtDesc(student.getId()).stream()
                .map(p -> ProjectDTO.from(p, false, false)).toList();
        return profileDto(student, ownedProjects, true);
    }

    @Transactional
    public StudentProfileDTO updateStudentProfile(String email, StudentProfileUpdateDTO update) {
        User student = student(email);
        student.setSummary(clean(update.summary()));
        if (update.department() != null && !update.department().isBlank()) {
            String requestedDepartment = DepartmentConfig.normalize(update.department());
            if (requestedDepartment == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Department must be one of the allowed department options");
            }
            if (student.getDepartment() == null
                    || !student.getDepartment().equalsIgnoreCase(requestedDepartment)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Only an administrator can change your department");
            }
        }
        student.setCourse(clean(update.course()));
        student.setSkills(clean(update.skills()));
        if (update.profileVisibility() != null) {
            student.setProfileVisibility(update.profileVisibility().trim().toUpperCase());
        }
        users.save(student);
        recordProfileActivity(student, "PROFILE_UPDATED");
        return ownStudentProfile(email);
    }

    @Transactional
    public StudentProfileDTO completeRecoveryDetails(String email, LocalDate dateOfBirth) {
        User student = student(email);
        if (student.getDateOfBirth() != null && !student.getDateOfBirth().equals(dateOfBirth)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Date of birth cannot be changed once verified");
        }
        student.setDateOfBirth(dateOfBirth);
        users.save(student);
        return ownStudentProfile(email);
    }

    @Transactional
    public StudentProfileDTO updateStudentProfileImage(String email, MultipartFile image) throws IOException {
        User student = student(email);
        if (image.isEmpty() || image.getSize() > MAX_PROFILE_IMAGE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image smaller than 5 MB");
        }

        String contentType = image.getContentType();
        String extension = contentType == null ? null : PROFILE_IMAGE_EXTENSIONS.get(contentType);
        if (extension == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile photos must be JPG, PNG, or GIF images");
        }

        byte[] imageBytes = image.getBytes();
        if (!matchesImageType(contentType, imageBytes)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected file does not match its image type");
        }
        try (ByteArrayInputStream input = new ByteArrayInputStream(imageBytes)) {
            if (ImageIO.read(input) == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The uploaded file is not a valid image");
            }
        }

        Path directory = Paths.get(uploadDir, "profile-photos").toAbsolutePath().normalize();
        Files.createDirectories(directory);
        String storedName = UUID.randomUUID() + extension;
        Path storedPath = directory.resolve(storedName).normalize();
        if (!storedPath.getParent().equals(directory)) {
            throw new IOException("Invalid profile image path");
        }
        Files.copy(new ByteArrayInputStream(imageBytes), storedPath, StandardCopyOption.REPLACE_EXISTING);

        String previousImage = student.getProfileImageName();
        student.setProfileImageName(storedName);
        student.setProfileImageType(contentType);
        users.save(student);
        recordProfileActivity(student, "PROFILE_PHOTO_UPDATED");
        if (previousImage != null) {
            Path previousPath = directory.resolve(previousImage).normalize();
            if (previousPath.getParent().equals(directory)) {
                Files.deleteIfExists(previousPath);
            }
        }
        return ownStudentProfile(email);
    }

    @Transactional(readOnly = true)
    public List<ProfileActivityDTO> profileActivity(String email) {
        User student = student(email);
        LocalDateTime since = LocalDateTime.now().minusMonths(6);
        return profileActivities
                .findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtAsc(student.getId(), since)
                .stream()
                .map(activity -> new ProfileActivityDTO(activity.getActivityType(), activity.getCreatedAt()))
                .toList();
    }

    private void recordProfileActivity(User student, String activityType) {
        ProfileActivity activity = new ProfileActivity();
        activity.setUser(student);
        activity.setActivityType(activityType);
        profileActivities.save(activity);
    }

    public record ProfileActivityDTO(String activityType, LocalDateTime createdAt) {}

    private boolean isDepartmentScopedAdmin(User user) {
        return "ADMIN".equals(user.getRole()) && user.getDepartment() != null && !user.getDepartment().isBlank();
    }

    private boolean isSuperAdmin(User user) {
        return "ADMIN".equals(user.getRole()) && (user.getDepartment() == null || user.getDepartment().isBlank());
    }

    private boolean sameDepartment(User left, User right) {
        if (left == null || right == null) return false;
        String leftDepartment = left.getDepartment() == null ? null : left.getDepartment().trim();
        String rightDepartment = right.getDepartment() == null ? null : right.getDepartment().trim();
        if (leftDepartment == null || rightDepartment == null) return false;
        return leftDepartment.equalsIgnoreCase(rightDepartment);
    }

    private boolean canAccessUser(User viewer, User target) {
        if (viewer == null || target == null) return false;
        if (viewer.getId().equals(target.getId())) return true;
        if (isSuperAdmin(viewer)) return "ADMIN".equals(target.getRole());
        if (isDepartmentScopedAdmin(viewer)) {
            return sameDepartment(viewer, target);
        }
        return false;
    }

    @Transactional(readOnly = true)
    public ProfilePhoto studentProfilePhoto(Long id, String currentEmail) throws IOException {
        User student = users.findById(id)
                .filter(user -> "STUDENT".equals(user.getRole()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));
        User viewer = users.findByEmail(currentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in"));
        if (!viewer.getId().equals(student.getId())
                && !"PUBLIC".equalsIgnoreCase(student.getProfileVisibility())
                && !canAccessUser(viewer, student)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found");
        }
        if (student.getProfileImageName() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No profile photo has been uploaded");
        }
        Path directory = Paths.get(uploadDir, "profile-photos").toAbsolutePath().normalize();
        Path imagePath = directory.resolve(student.getProfileImageName()).normalize();
        if (!imagePath.getParent().equals(directory) || !Files.isRegularFile(imagePath)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile photo is missing");
        }
        return new ProfilePhoto(new UrlResource(imagePath.toUri()), student.getProfileImageType());
    }

    private boolean matchesImageType(String contentType, byte[] bytes) {
        return switch (contentType) {
            case "image/jpeg" -> bytes.length >= 3
                    && (bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff;
            case "image/png" -> bytes.length >= 8
                    && (bytes[0] & 0xff) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4e && bytes[3] == 0x47
                    && bytes[4] == 0x0d && bytes[5] == 0x0a && bytes[6] == 0x1a && bytes[7] == 0x0a;
            case "image/gif" -> bytes.length >= 6
                    && bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F'
                    && bytes[3] == '8' && (bytes[4] == '7' || bytes[4] == '9') && bytes[5] == 'a';
            default -> false;
        };
    }

    @Transactional(readOnly = true)
    public StudentProfileDTO sharedStudentProfile(Long id) {
        User student = users.findById(id)
                .filter(u -> "STUDENT".equals(u.getRole())
                        && "PUBLIC".equalsIgnoreCase(u.getProfileVisibility()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));
        List<ProjectDTO> sharedProjects = projects
                .findByOwnerIdAndVisibilityOrderByUpdatedAtDesc(student.getId(), "PUBLIC").stream()
                .map(p -> ProjectDTO.fromShared(p, false)).toList();
        return profileDto(student, sharedProjects, false);
    }

    @Transactional(readOnly = true)
    public List<StudentSearchResultDTO> searchPublicStudents(String term) {
        String normalized = term == null ? "" : term.trim();
        if (normalized.length() < 2) return List.of();
        return users.searchPublicStudents(normalized, PageRequest.of(0, 20)).stream()
                .map(student -> new StudentSearchResultDTO(student.getId(), student.getName(),
                        student.getDepartment(), student.getCourse(),
                        student.getProfileImageName() != null,
                        projects.countByOwnerIdAndVisibility(student.getId(), "PUBLIC")))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<com.example.projectvault.dto.ProjectActivityDTO> sharedStudentActivity(Long id) {
        User student = users.findById(id)
                .filter(u -> "STUDENT".equals(u.getRole())
                        && "PUBLIC".equalsIgnoreCase(u.getProfileVisibility()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student portfolio not found"));
        List<Long> publicProjectIds = projects
                .findByOwnerIdAndVisibilityOrderByUpdatedAtDesc(student.getId(), "PUBLIC").stream()
                .map(Project::getId).toList();
        return projectActivities.forSharedProjects(publicProjectIds, LocalDateTime.now().minusMonths(6));
    }

    @Transactional(readOnly = true)
    public List<DailyActivityDTO> sharedStudentDailyActivity(Long id, LocalDate from, LocalDate to) {
        if (from.isAfter(to) || to.equals(LocalDate.MAX) || ChronoUnit.DAYS.between(from, to) > 366) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Choose a date range of no more than 367 days");
        }
        User student = users.findById(id)
                .filter(u -> "STUDENT".equals(u.getRole())
                        && "PUBLIC".equalsIgnoreCase(u.getProfileVisibility()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student portfolio not found"));
        List<Long> publicProjectIds = projects
                .findByOwnerIdAndVisibilityOrderByUpdatedAtDesc(student.getId(), "PUBLIC").stream()
                .map(Project::getId).toList();
        return projectActivities.dailySummaries(publicProjectIds, from, to);
    }

    private User student(String email) {
        User current = users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in"));
        if (!"STUDENT".equals(current.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only students have editable student profiles");
        }
        return current;
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private StudentProfileDTO profileDto(User student, List<ProjectDTO> profileProjects, boolean ownProfile) {
        List<Project> publicProjects = projects
                .findByOwnerIdAndVisibilityOrderByUpdatedAtDesc(student.getId(), "PUBLIC");
        List<Integer> ratings = publicProjects.stream()
                .map(Project::getStarRating)
                .filter(rating -> rating != null && rating >= 1 && rating <= 5)
                .toList();
        long totalStars = ratings.stream().mapToLong(Integer::longValue).sum();
        Double averageRating = ratings.isEmpty() ? null : (double) totalStars / ratings.size();
        return new StudentProfileDTO(student.getId(), student.getName(), student.getSummary(),
                student.getDepartment(), student.getCourse(), student.getSkills(),
                student.getProfileImageName() != null,
                ownProfile && student.getDateOfBirth() != null,
                student.getProfileVisibility(), publicProjects.size(), ratings.size(), totalStars,
                averageRating, profileProjects);
    }

    public record ProfilePhoto(Resource resource, String contentType) {}

    @Transactional(readOnly = true)
    public List<UserDTO> listUsers(String currentEmail) {
        User viewer = users.findByEmail(currentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in"));
        List<User> visibleUsers = users.findAll().stream()
                .filter(user -> canAccessUser(viewer, user))
                .toList();
        if (visibleUsers.isEmpty()) return List.of();

        Map<Long, List<Project>> projectsByOwner = new HashMap<>();
        for (Project project : projects.findByOwnerIdIn(visibleUsers.stream().map(User::getId).toList())) {
            projectsByOwner.computeIfAbsent(project.getOwner().getId(), ignored -> new ArrayList<>()).add(project);
        }
        return visibleUsers.stream().map(account -> {
            List<Project> ownedProjects = projectsByOwner.getOrDefault(account.getId(), List.of());
            List<Integer> ratings = ownedProjects.stream()
                    .filter(project -> "PUBLIC".equalsIgnoreCase(project.getVisibility()))
                    .map(Project::getStarRating)
                    .filter(rating -> rating != null && rating >= 1 && rating <= 5)
                    .toList();
            Double averageRating = ratings.isEmpty() ? null
                    : ratings.stream().mapToInt(Integer::intValue).average().orElseThrow();
            return new UserDTO(account.getId(), account.getName(), account.getEmail(),
                    account.getRole(), account.getDepartment(), account.getCourse(), account.getCreatedAt(),
                    ownedProjects.size(), ratings.size(), averageRating, account.getProfileImageName() != null);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<DepartmentSummaryDTO> departmentSummaries(String currentEmail) {
        User viewer = users.findByEmail(currentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in"));
        if (!isSuperAdmin(viewer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the institute super-admin can view institute department summaries");
        }
        return DepartmentConfig.ALLOWED_DEPARTMENTS.stream()
                .sorted()
                .map(department -> new DepartmentSummaryDTO(
                        department,
                        users.countByRoleAndDepartment("STUDENT", department),
                        users.countByRoleAndDepartment("ADMIN", department),
                        projects.countPublicByOwnerDepartment(department),
                        projectActivities.latestPublicActivityForDepartment(department)))
                .toList();
    }

    @Transactional
    public UserDTO provisionDepartmentAdmin(AdminProvisionRequestDTO request, String currentEmail) {
        User actor = users.findByEmail(currentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in"));
        if (!isSuperAdmin(actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Only the institute super-admin can create or assign department admins");
        }

        String department = DepartmentConfig.normalize(request.department());
        if (department == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Department must be one of the allowed department options");
        }

        String email = request.email().trim().toLowerCase();
        User admin = users.findByEmail(email).orElse(null);
        if (admin == null) {
            if (request.name() == null || request.name().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "A name is required when creating a new admin account");
            }
            if (request.password() == null || request.password().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "A password is required when creating a new admin account");
            }
            admin = new User();
            admin.setName(request.name().trim());
            admin.setEmail(email);
            admin.setPassword(encoder.encode(request.password()));
        } else {
            if (!"STUDENT".equals(admin.getRole())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Only an existing student account can be promoted; administrator roles cannot be reassigned here");
            }
            if (request.password() != null && !request.password().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "An existing account keeps its current password; leave password blank to promote it");
            }
        }

        admin.setRole("ADMIN");
        admin.setDepartment(department);
        User saved = users.save(admin);
        List<Project> ownedProjects = projects.findByOwnerIdOrderByUpdatedAtDesc(saved.getId());
        List<Integer> ratings = ownedProjects.stream()
                .filter(project -> "PUBLIC".equalsIgnoreCase(project.getVisibility()))
                .map(Project::getStarRating)
                .filter(rating -> rating != null && rating >= 1 && rating <= 5)
                .toList();
        return new UserDTO(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(),
                saved.getDepartment(), saved.getCourse(), saved.getCreatedAt(),
                ownedProjects.size(), ratings.size(),
                ratings.isEmpty() ? null : ratings.stream().mapToInt(Integer::intValue).average().orElseThrow(),
                saved.getProfileImageName() != null);
    }

    @Transactional
    public void deleteUser(Long id, String currentEmail) {
        User u = users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        User actor = users.findByEmail(currentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in"));
        if (u.getEmail().equals(currentEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own account");
        }
        boolean removableDepartmentAdmin = "ADMIN".equals(u.getRole())
                && isDepartmentScopedAdmin(u)
                && isSuperAdmin(actor);
        boolean removableStudent = "STUDENT".equals(u.getRole()) && canAccessUser(actor, u);
        if (!removableDepartmentAdmin && !removableStudent) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Institute administrators can remove department admins; student removal is limited to authorized department admins");
        }
        for (Project p : projects.findByOwnerIdOrderByUpdatedAtDesc(id)) {
            projectService.deleteProject(p);
        }
        passwordResets.deleteByUserId(id);
        profileActivities.deleteByUserId(id);
        users.delete(u);
    }
}
