package com.example.projectvault.repository;

import com.example.projectvault.entity.ProjectFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FileRepository extends JpaRepository<ProjectFile, Long> {
}
