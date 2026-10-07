package com.example.projectvault;

import com.example.projectvault.entity.User;
import com.example.projectvault.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class ProjectVaultApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProjectVaultApplication.class, args);
    }

    @Bean
    CommandLineRunner seedAdmin(UserRepository users, PasswordEncoder encoder,
                                @Value("${app.admin.name}") String name,
                                @Value("${app.admin.email}") String email,
                                @Value("${app.admin.password}") String password) {
        return args -> {
            if (!users.existsByEmail(email)) {
                User admin = new User();
                admin.setName(name);
                admin.setEmail(email);
                admin.setPassword(encoder.encode(password));
                admin.setRole("ADMIN");
                users.save(admin);
                System.out.println("Default admin created: " + email);
            }
        };
    }
}
