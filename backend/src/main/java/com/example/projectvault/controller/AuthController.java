package com.example.projectvault.controller;

import com.example.projectvault.dto.AuthResponseDTO;
import com.example.projectvault.dto.AdminProvisionRequestDTO;
import com.example.projectvault.dto.LoginRequestDTO;
import com.example.projectvault.dto.RegisterRequestDTO;
import com.example.projectvault.dto.StudentProfileDTO;
import com.example.projectvault.dto.StudentProfileUpdateDTO;
import com.example.projectvault.dto.PasswordResetRequestDTO;
import com.example.projectvault.dto.RecoveryDetailsDTO;
import com.example.projectvault.dto.StudentSearchResultDTO;
import com.example.projectvault.dto.ProjectActivityDTO;
import com.example.projectvault.dto.DailyActivityDTO;
import com.example.projectvault.dto.UserDTO;
import com.example.projectvault.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponseDTO register(@Valid @RequestBody RegisterRequestDTO req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponseDTO login(@Valid @RequestBody LoginRequestDTO req) {
        return authService.login(req);
    }

    @PostMapping("/password-reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordResetRequestDTO req) {
        authService.resetPassword(req.email(), req.dateOfBirth(), req.newPassword());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public AuthResponseDTO me(Authentication auth) {
        return authService.me(auth.getName());
    }

    @GetMapping("/profile")
    public StudentProfileDTO ownStudentProfile(Authentication auth) {
        return authService.ownStudentProfile(auth.getName());
    }

    @PutMapping("/profile")
    public StudentProfileDTO updateStudentProfile(@Valid @RequestBody StudentProfileUpdateDTO update,
                                                  Authentication auth) {
        return authService.updateStudentProfile(auth.getName(), update);
    }

    @PutMapping("/profile/recovery-details")
    public StudentProfileDTO completeRecoveryDetails(@Valid @RequestBody RecoveryDetailsDTO details,
                                                      Authentication auth) {
        return authService.completeRecoveryDetails(auth.getName(), details.dateOfBirth());
    }

    @PostMapping(value = "/profile/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StudentProfileDTO updateStudentProfilePhoto(@RequestParam("photo") MultipartFile photo,
                                                        Authentication auth) throws java.io.IOException {
        return authService.updateStudentProfileImage(auth.getName(), photo);
    }

    @GetMapping("/profile/activity")
    public List<AuthService.ProfileActivityDTO> profileActivity(Authentication auth) {
        return authService.profileActivity(auth.getName());
    }

    @GetMapping("/students/{id}/photo")
    public ResponseEntity<Resource> studentProfilePhoto(@PathVariable("id") Long id,
                                                        Authentication auth) throws java.io.IOException {
        AuthService.ProfilePhoto photo = authService.studentProfilePhoto(id, auth.getName());
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "private, no-cache")
                .contentType(MediaType.parseMediaType(photo.contentType()))
                .body(photo.resource());
    }

    @GetMapping({"/student-search", "/students/search"})
    public List<StudentSearchResultDTO> searchStudents(@RequestParam("q") String query) {
        return authService.searchPublicStudents(query);
    }

    @GetMapping("/students/{id:\\d+}")
    public StudentProfileDTO sharedStudentProfile(@PathVariable("id") Long id) {
        return authService.sharedStudentProfile(id);
    }

    @GetMapping("/students/{id}/activity")
    public List<ProjectActivityDTO> sharedStudentActivity(@PathVariable("id") Long id) {
        return authService.sharedStudentActivity(id);
    }

    @GetMapping("/students/{id}/activity/daily")
    public List<DailyActivityDTO> sharedStudentDailyActivity(
            @PathVariable("id") Long id,
            @RequestParam LocalDate from,
            @RequestParam LocalDate to) {
        return authService.sharedStudentDailyActivity(id, from, to);
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDTO> users(Authentication auth) {
        return authService.listUsers(auth.getName());
    }

    @GetMapping("/departments/overview")
    @PreAuthorize("hasRole('ADMIN')")
    public List<com.example.projectvault.dto.DepartmentSummaryDTO> departmentOverview(Authentication auth) {
        return authService.departmentSummaries(auth.getName());
    }

    @PostMapping("/admins")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDTO provisionDepartmentAdmin(@Valid @RequestBody AdminProvisionRequestDTO request,
                                            Authentication auth) {
        return authService.provisionDepartmentAdmin(request, auth.getName());
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id, Authentication auth) {
        authService.deleteUser(id, auth.getName());
        return ResponseEntity.noContent().build();
    }
}
