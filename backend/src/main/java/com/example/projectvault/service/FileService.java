package com.example.projectvault.service;

import com.example.projectvault.entity.Project;
import com.example.projectvault.entity.ProjectFile;
import com.example.projectvault.entity.ProjectVersion;
import com.example.projectvault.repository.FileRepository;
import com.example.projectvault.repository.ProjectRepository;
import com.example.projectvault.repository.VersionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class FileService {

    private final FileRepository fileRepo;
    private final VersionRepository versionRepo;
    private final ProjectRepository projectRepo;
    private final ProjectActivityService activities;

    @Value("${app.upload-dir}")
    private String uploadDir;

    public FileService(FileRepository fileRepo, VersionRepository versionRepo, ProjectRepository projectRepo,
                       ProjectActivityService activities) {
        this.fileRepo = fileRepo;
        this.versionRepo = versionRepo;
        this.projectRepo = projectRepo;
        this.activities = activities;
    }

    private Path projectDir(Long projectId) {
        return Paths.get(uploadDir, String.valueOf(projectId)).toAbsolutePath().normalize();
    }

    @Transactional
    public List<ProjectFile> store(Project project, Long versionId, ProjectFile.Category category,
                                   MultipartFile[] uploads) throws IOException {
        ProjectVersion version = versionId != null
                ? versionRepo.findById(versionId)
                    .filter(v -> v.getProject().getId().equals(project.getId()))
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Version not found"))
                : versionRepo.findFirstByProjectIdOrderByVersionNumberDesc(project.getId()).orElse(null);

        Path dir = projectDir(project.getId());
        Files.createDirectories(dir);

        List<ProjectFile> saved = new ArrayList<>();
        for (MultipartFile m : uploads) {
            if (m.isEmpty()) continue;
            String original = StringUtils.cleanPath(Objects.requireNonNullElse(m.getOriginalFilename(), "file"));
            if (original.contains("..")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name");
            }
            String stored = UUID.randomUUID() + ".bin";
            Files.copy(m.getInputStream(), dir.resolve(stored), StandardCopyOption.REPLACE_EXISTING);

            ProjectFile pf = new ProjectFile();
            pf.setFileName(original);
            pf.setOriginalName(original);
            pf.setFileType(Objects.requireNonNullElse(
                    m.getContentType(), MediaType.APPLICATION_OCTET_STREAM_VALUE));
            pf.setCategory(category);
            pf.setSize(m.getSize());
            pf.setStoredName(stored);
            pf.setProject(project);
            pf.setVersion(version);
            fileRepo.save(pf);
            project.getFiles().add(pf);
            activities.record(project, "FILE_UPLOADED", "File uploaded: " + original);
            saved.add(pf);
        }
        projectRepo.save(project);
        return saved;
    }

    public ProjectFile get(Long id) {
        return fileRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));
    }

    public Resource load(ProjectFile f) throws IOException {
        Path path = projectDir(f.getProject().getId()).resolve(f.getStoredName());
        Resource r = new UrlResource(path.toUri());
        if (!r.exists()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File is missing on disk");
        return r;
    }

    @Transactional
    public void delete(ProjectFile f) throws IOException {
        activities.record(f.getProject(), "FILE_DELETED", "File removed: " + f.getFileName());
        Files.deleteIfExists(projectDir(f.getProject().getId()).resolve(f.getStoredName()));
        f.getProject().getFiles().remove(f);
        fileRepo.delete(f);
    }

    public void deleteProjectFolder(Long projectId) {
        Path dir = projectDir(projectId);
        if (!Files.exists(dir)) return;
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(p -> p.toFile().delete());
        } catch (IOException ignored) {
            // best effort
        }
    }
}
