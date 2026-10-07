package com.example.projectvault.repository;

import com.example.projectvault.entity.ProjectActivity;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface ProjectActivityRepository extends JpaRepository<ProjectActivity, Long> {
    void deleteByProjectId(Long projectId);

    List<ProjectActivity> findByProjectIdInAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            List<Long> projectIds, LocalDateTime since);
    List<ProjectActivity> findTop50ByProjectIdOrderByCreatedAtDesc(Long projectId);

    @Query(value = """
            select date(created_at) as activityDate, activity_type as activityType, count(*) as eventCount
            from project_activity
            where project_id in (:projectIds)
              and created_at >= :fromInclusive
              and created_at < :toExclusive
            group by date(created_at), activity_type
            order by date(created_at)
            """, nativeQuery = true)
    List<DailyActivityCount> summarizeByProjectIdsAndDateRange(
            @Param("projectIds") List<Long> projectIds,
            @Param("fromInclusive") LocalDateTime fromInclusive,
            @Param("toExclusive") LocalDateTime toExclusive);

    @Query("select max(activity.createdAt) from ProjectActivity activity " +
            "where activity.project.owner.department = :department " +
            "and upper(activity.project.visibility) = 'PUBLIC'")
    LocalDateTime findLatestPublicActivityByDepartment(@Param("department") String department);
}
