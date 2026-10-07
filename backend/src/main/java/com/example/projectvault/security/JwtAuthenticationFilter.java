package com.example.projectvault.security;

import com.example.projectvault.repository.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    public static final String AUTH_FAILURE_ATTRIBUTE = JwtAuthenticationFilter.class.getName() + ".authFailure";

    private final JwtService jwtService;
    private final UserRepository users;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository users) {
        this.jwtService = jwtService;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                String email = jwtService.parse(header.substring(7)).getSubject();
                var account = users.findByEmail(email);
                if (account.isEmpty()) {
                    request.setAttribute(AUTH_FAILURE_ATTRIBUTE, "The token belongs to an account that no longer exists. Sign in again.");
                    logger.warn("JWT subject does not match an account for {} {}", request.getMethod(),
                            request.getRequestURI());
                } else {
                    var u = account.get();
                    List<GrantedAuthority> authorities =
                            List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole()));
                    var auth = new UsernamePasswordAuthenticationToken(
                            u.getEmail(), null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (ExpiredJwtException ex) {
                request.setAttribute(AUTH_FAILURE_ATTRIBUTE, "Your sign-in token has expired. Sign in again.");
                logger.warn("Expired JWT for {} {}", request.getMethod(), request.getRequestURI());
            } catch (JwtException | IllegalArgumentException ex) {
                request.setAttribute(AUTH_FAILURE_ATTRIBUTE, "The sign-in token is invalid or was signed by a different backend configuration. Sign in again.");
                logger.warn("Invalid JWT for {} {}: {}", request.getMethod(), request.getRequestURI(),
                        ex.getMessage());
            } catch (Exception ex) {
                request.setAttribute(AUTH_FAILURE_ATTRIBUTE, "The backend could not validate your sign-in token. Check the backend log.");
                logger.warn("JWT rejected for {} {}: {}", request.getMethod(), request.getRequestURI(),
                        ex.getMessage());
            }
        } else if (!request.getRequestURI().equals("/api/auth/login")
                && !request.getRequestURI().equals("/api/auth/register")) {
            request.setAttribute(AUTH_FAILURE_ATTRIBUTE,
                    header == null ? "No sign-in token was sent with this request." : "The sign-in token header is malformed.");
            logger.warn("{} authentication header for {} {}",
                    header == null ? "Missing" : "Malformed", request.getMethod(), request.getRequestURI());
        }
        chain.doFilter(request, response);
    }
}
