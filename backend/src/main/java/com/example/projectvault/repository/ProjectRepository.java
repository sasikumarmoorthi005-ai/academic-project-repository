package com.example.projectvault.repository;

import com.example.projectvault.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);
    List<Project> findByOwnerIdIn(List<Long> ownerIds);
    List<Project> findByOwnerIdAndVisibilityOrderByUpdatedAtDesc(Long ownerId, String visibility);
    List<Project> findByVisibilityOrderByUpdatedAtDesc(String visibility);
    long countByOwnerId(Long ownerId);
    long countByOwnerIdAndVisibility(Long ownerId, String visibility);

    @Query("select count(p) from Project p where p.owner.department = :department and upper(p.visibility) = 'PUBLIC'")
    long countPublicByOwnerDepartment(@Param("department") String department);
}
