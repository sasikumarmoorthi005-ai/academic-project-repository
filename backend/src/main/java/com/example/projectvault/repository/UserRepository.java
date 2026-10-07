package com.example.projectvault.repository;

import com.example.projectvault.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByRoleAndDepartment(String role, String department);
    @Query("select u from User u where u.role = 'STUDENT' and u.profileVisibility = 'PUBLIC' " +
            "and lower(u.name) like lower(concat('%', :term, '%')) order by u.name")
    List<User> searchPublicStudents(@Param("term") String term, Pageable pageable);
}
