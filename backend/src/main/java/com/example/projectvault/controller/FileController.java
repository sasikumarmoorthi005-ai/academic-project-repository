package com.example.projectvault.controller;

import com.example.projectvault.dto.ProjectDTO;
import com.example.projectvault.entity.Project;
import com.example.projectvault.entity.ProjectFile;
import com.example.projectvault.service.FileService;
import com.example.projectvault.service.ProjectService;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api")
public class FileController {

    private final FileService fileService;
    private final ProjectService projectService;

    public FileController(FileService fileService, ProjectService projectService) {
        this.fileService = fileService;
        this.projectService = projectService;
    }

    @PostMapping("/projects/{projectId}/files")
    public List<ProjectDTO.FileDTO> upload(@PathVariable("projectId") Long projectId,
                                           @RequestParam("files") MultipartFile[] files,
                                           @RequestParam(value = "versionId", required = false) Long versionId,
                                           @RequestParam(defaultValue = "OTHER") ProjectFile.Category category,
                                           Authentication auth) throws IOException {
        Project p = projectService.getEditable(projectId, auth.getName());
        return fileService.store(p, versionId, category, files).stream().map(ProjectDTO::fileDto).toList();
    }

    @GetMapping("/files/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable("id") Long id, Authentication auth) throws IOException {
        ProjectFile f = fileService.get(id);
        projectService.assertFileView(f.getProject(), f.getCategory(), auth.getName());
        Resource resource = fileService.load(f);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(f.getFileName(), StandardCharsets.UTF_8).build().toString())
                .body(resource);
    }

    @DeleteMapping("/files/{id}")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id, Authentication auth) throws IOException {
        ProjectFile f = fileService.get(id);
        projectService.assertEdit(f.getProject(), auth.getName());
        fileService.delete(f);
        return ResponseEntity.noContent().build();
    }
}
