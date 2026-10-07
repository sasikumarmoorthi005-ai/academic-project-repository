package com.example.projectvault.repository;

import com.example.projectvault.entity.ProjectVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VersionRepository extends JpaRepository<ProjectVersion, Long> {
    List<ProjectVersion> findByProjectIdOrderByVersionNumberDesc(Long projectId);
    Optional<ProjectVersion> findFirstByProjectIdOrderByVersionNumberDesc(Long projectId);
}
