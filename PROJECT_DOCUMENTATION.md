# ProjectVault
## Academic Project Repository and Student Portfolio Platform

**Project documentation**  
**Frontend:** React.js application  
**Backend:** Spring Boot REST API  
**Database:** MySQL

## 1. Introduction

ProjectVault is a web application for students to organize academic projects, source code, documentation, presentations, and project history in one place. Students can create projects, choose who can see them, upload categorized files, and maintain a numbered version history.

Students can also build a portfolio with a profile photo, biography, department, course, skills, public projects, and recorded activity. Signed-in users can discover students who have shared public work and browse their portfolios.

The application has two administration scopes. Department administrators manage student accounts and review public projects within their own department. Institute administrators manage department-admin accounts and browse public student portfolios; they do not manage projects or assign project ratings. These restrictions are enforced by the backend as well as the frontend.

The React frontend communicates with a Spring Boot API. Account and project metadata are stored in MySQL. Project files and profile photos are stored on the backend file system, with metadata and generated storage names stored in the database.

## 2. Objectives

1. Develop a responsive academic project repository and portfolio application.
2. Provide secure registration and sign-in for students and administrators.
3. Let students create, update, share, and delete their own projects.
4. Support private, department-visible, and public project visibility.
5. Organize project files into source code, documentation, presentations, and other files.
6. Preserve project progress with numbered versions and change notes.
7. Provide student portfolios with profile details, skills, and photos.
8. Show recorded work and consistency in a daily activity calendar.
9. Enable discovery of student portfolios and public projects.
10. Allow department administrators to rate and review eligible public projects in their department.
11. Allow institute administrators to provision, inspect, and remove department administrators.
12. Enforce authorization and file privacy on the server.

## 3. Technologies Used

| Technology | Purpose |
|---|---|
| React 18 | Frontend user interface |
| JavaScript and JSX | Frontend application logic and components |
| React Router | Client-side routing and protected pages |
| Vite | Frontend development server and production build |
| CSS3 | Responsive layout and application styling |
| Axios | HTTP requests to the backend API |
| Java 17 | Backend implementation |
| Spring Boot 3 | Backend application and REST API |
| Spring Web | REST controllers and multipart uploads |
| Spring Data JPA / Hibernate | Relational persistence and entity mapping |
| Spring Security | Authentication and server-side authorization |
| JSON Web Tokens (JWT) | Authenticated API sessions |
| MySQL | Persistent account, project, file, and activity metadata |
| Maven | Backend dependency and build management |

## 4. System Requirements

### Hardware requirements

- A modern computer with at least 4 GB RAM.
- Sufficient disk space for source files, MySQL, and uploaded project resources.
- Internet access when installing project dependencies.

### Software requirements

- Windows 10/11, Linux, or macOS.
- Java 17 and Maven.
- Node.js 18 or later and npm.
- MySQL.
- A modern web browser.
- VS Code, Eclipse, or Spring Tool Suite (optional).

### Local setup

1. Configure the backend datasource and upload directory in `backend/src/main/resources/application.properties`. Keep local database credentials out of source control.
2. From `backend`, start the API with `mvn spring-boot:run`. The default API base is `http://localhost:8080/api`.
3. From `frontend`, run `npm install`, then `npm run dev`. Vite serves the application at `http://localhost:5173` by default.
4. Sign in using an authorized account. Student accounts can be registered from the application; administrator accounts are provisioned through the institute-admin workflow or the configured initial administrator.

The frontend can be configured to use another API base URL through `VITE_API_URL`.

## 5. Project Structure

```text
ProjectVault/
├── backend/
│   ├── src/main/java/com/example/projectvault/
│   │   ├── controller/       # Authentication, project, file, version, activity APIs
│   │   ├── dto/              # Request and response data transfer objects
│   │   ├── entity/           # JPA entities and relationships
│   │   ├── repository/       # Spring Data repositories and activity queries
│   │   ├── security/         # JWT authentication and security configuration
│   │   ├── service/          # Business rules and authorization
│   │   ├── util/             # Shared configuration utilities
│   │   └── ProjectVaultApplication.java
│   ├── src/main/resources/   # Spring application configuration
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/       # Shared navigation, cards, activity, and file UI
│   │   ├── context/          # Authentication context
│   │   ├── pages/            # Student, portfolio, and admin pages
│   │   ├── services/         # API client and file helpers
│   │   ├── App.jsx           # Frontend route definitions
│   │   ├── index.css         # Application styles
│   │   └── main.jsx          # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── PROJECT_DOCUMENTATION.md
└── README.md
```

Generated folders such as `frontend/node_modules`, `frontend/dist`, and `backend/target` are build artifacts, not source modules. Uploaded files are written to the backend-configured upload directory.

## 6. Modules

### 6.1 Authentication and account recovery

Students register with a name, email, date of birth, and password. Authorized administrators sign in using their provisioned accounts. Successful sign-in returns a JWT that the frontend attaches to authenticated API requests. Password recovery verifies the student’s email and date of birth before accepting a new password.

### 6.2 Student dashboard and project management

The dashboard summarizes a student’s own work. Students can create projects with a title, description, technology stack, category, and visibility. Only the project owner can edit or delete the project.

Visibility options are:

- `PRIVATE`: visible only to the project owner.
- `DEPARTMENT`: visible to authorized users in the same department.
- `PUBLIC`: visible to signed-in users and eligible for the student’s public portfolio.

### 6.3 Categorized file management

Project resources are uploaded into one of four categories: `SOURCE_CODE`, `DOCUMENTATION`, `PRESENTATION`, or `OTHER`. Owners can access all categories. Other users may access documentation and presentations only; source code and other non-shareable resources remain owner-only. The backend enforces these rules for project details and direct file downloads.

### 6.4 Version history

Students can save numbered versions with notes describing their changes. Files may be attached to a version. The project page displays version history and only exposes shareable documentation and presentation files to non-owners.

### 6.5 Student profiles and public portfolios

Students can manage a summary, department, course, skills, profile visibility, and profile photo. A public portfolio includes public projects and recent activity from those public projects. Private projects, date of birth, and email addresses are not included in the shared portfolio.

Profile photos accept JPG, PNG, or GIF files up to 5 MB. Image content is stored in the configured upload directory; the database holds the generated image name and content type.

### 6.6 Student discovery

Signed-in users can search for students who have public projects and open their shared portfolio. The portfolio includes a project activity calendar showing recorded contributions over the last 12 months. That calendar only aggregates activity from the student’s public projects.

### 6.7 Activity and insights

Students can review recorded project activity, active days, contribution totals, streaks, and project insights. Activity data represents recorded workspace events, such as project changes, versions, file uploads, and project ratings; it is not page-view tracking.

### 6.8 Department administrator workspace

Department administrators can view and manage student accounts in their authorized department, inspect projects permitted by project visibility, and review public projects owned by students in their department. They can assign or remove a 1–5 star public-project rating and submit project grading feedback.

### 6.9 Institute administrator workspace

The institute administrator can create or assign department administrators and remove department-admin accounts. The institute administrator can browse student portfolios shared publicly, but cannot list/manage project records, inspect project files, view project activity analytics, or rate/grade projects.

### 6.10 Navigation and protected routes

React Router provides navigation between signed-in pages. Protected frontend routes improve the user experience, while backend authorization remains authoritative for API access. Administrator capabilities are further restricted by administrator scope and department.

## 7. Functional Requirements

### Student capabilities

- Register, sign in, and recover an account using email and date of birth.
- Create, edit, and delete owned projects.
- Set project visibility to private, department, or public.
- Upload categorized files and preview or download supported resources.
- Save versions with notes and view the project version history.
- Update profile information and upload a profile photo.
- Share a public portfolio and browse portfolios shared by other students.
- View recorded activity and project insights.

### Department administrator capabilities

- View student accounts in the authorized department.
- Delete student accounts in the authorized scope, including their projects.
- Review public projects from students in the administrator’s department.
- Rate public projects and submit grading feedback.
- View project activity permitted within the department scope.

### Institute administrator capabilities

- Create or promote department administrators.
- View administrator accounts across the institute.
- Remove department administrators; their owned projects are removed with the account.
- Browse student portfolios and projects that students have chosen to share publicly.
- Cannot remove their own account or another institute administrator through the staff-removal workflow.
- Cannot rate or grade projects or manage project records.

### System capabilities

- Persist user, project, file metadata, version, and activity records in MySQL.
- Store uploaded file bytes on the backend file system.
- Authenticate protected API requests with JWT.
- Enforce ownership, project visibility, role, and department scope in the backend.

## 8. React Concepts Used

### Components and props

Reusable components provide navigation, protected routes, project cards, file inputs, activity feeds, and activity calendars. Pages pass data and callbacks through component props.

### State management

`useState` tracks form values, loaded project and profile data, search filters, selected calendar dates, loading states, and errors.

### Effects and memoization

`useEffect` loads API data and cleans up temporary browser object URLs. `useMemo` and `useCallback` are used where derived values or stable callbacks are useful.

### Context

`AuthContext` exposes the signed-in user, role, and login, registration, and logout operations to the application.

### Routing and protected pages

React Router maps URLs to pages and nests authenticated and role-restricted content under shared layouts.

### API requests and file uploads

The Axios API client applies the configured API base URL and adds the bearer token. `FormData` carries project files and profile photos to multipart endpoints.

## 9. Routing

### Frontend routes

| URL | Page | Access |
|---|---|---|
| `/login` | Sign in | Public |
| `/register` | Student registration | Public |
| `/forgot-password` | Student password recovery | Public |
| `/dashboard` | Student dashboard | Signed in |
| `/projects` | Project workspace | Signed in |
| `/projects/new` | Create project | Student |
| `/projects/:id` | Project details, files, and versions | Signed in, subject to visibility |
| `/projects/:id/edit` | Edit project and save a version | Owning student |
| `/activity` | Activity and insights | Student |
| `/profile` | Own profile or administrator profile | Signed in |
| `/students` | Search shared student portfolios | Signed in |
| `/students/:id` | Shared student portfolio | Signed in |
| `/admin` | Administrator dashboard | Administrator |
| `/admin/students` | Department student management | Department administrator |
| `/admin/staff` | Administrator directory | Institute administrator |
| `/admin/reviews` | Department project review queue | Department administrator |
| `/admin/activity` | Department activity analytics | Department administrator |
| `/admin/departments` | Department overview | Institute administrator |

### REST API summary

All API paths are prefixed with `/api`.

| Method | Path | Purpose / access |
|---|---|---|
| `POST` | `/auth/register` | Register a student |
| `POST` | `/auth/login` | Authenticate and issue a JWT |
| `GET` | `/auth/me` | Validate the signed-in account |
| `POST` | `/auth/password-reset` | Student password recovery |
| `GET`, `PUT` | `/auth/profile` | Read or update own student profile |
| `PUT` | `/auth/profile/recovery-details` | Set recovery details for eligible legacy accounts |
| `POST` | `/auth/profile/photo` | Upload a profile photo |
| `GET` | `/auth/profile/activity` | Recent profile-change activity |
| `GET` | `/auth/student-search?q=...` | Search public student portfolios |
| `GET` | `/auth/students/{id}` | Read a public student portfolio |
| `GET` | `/auth/students/{id}/activity` | Recent activity on public projects |
| `GET` | `/auth/students/{id}/activity/daily?from=...&to=...` | Daily summaries for public projects |
| `GET` | `/auth/students/{id}/photo` | Read a profile photo |
| `GET` | `/auth/users` | List accounts within administrator scope |
| `DELETE` | `/auth/users/{id}` | Delete an eligible student or department-admin account |
| `POST` | `/auth/admins` | Create or assign a department administrator; institute admin only |
| `GET` | `/auth/departments/overview` | Department summaries; institute admin only |
| `GET` | `/projects` | List projects available to the requester; institute admin is denied |
| `GET` | `/projects/shared` | List projects shared with the signed-in user |
| `GET` | `/projects/{id}` | Read a project subject to visibility rules |
| `POST` | `/projects` | Create a project; student only |
| `PUT`, `DELETE` | `/projects/{id}` | Update or delete an owned project |
| `GET` | `/projects/all` | Department-admin project listing; institute admin is denied |
| `GET` | `/projects/reviews` | Department review queue, limited to its students’ public projects |
| `PUT` | `/projects/{id}/rating` | Rate an eligible public project; department admin only |
| `DELETE` | `/projects/{id}/rating` | Remove an eligible public-project rating; department admin only |
| `PUT` | `/projects/{id}/grade` | Grade an eligible project; department admin only |
| `GET` | `/projects/activity` | Recent project activity within the requester’s allowed scope |
| `GET` | `/projects/activity/daily?from=...&to=...` | Daily activity summaries; institute admin is denied |
| `GET` | `/projects/{id}/activity` | Read project activity subject to project visibility |
| `GET`, `POST` | `/projects/{projectId}/versions` | Read versions or create one as the project owner |
| `POST` | `/projects/{projectId}/files` | Upload files as the project owner |
| `GET` | `/files/{id}/download` | Download a file subject to file-category access rules |
| `DELETE` | `/files/{id}` | Delete a file as the project owner |

## 10. Database and File Storage Design

ProjectVault does not use browser LocalStorage as its project database. MySQL stores user accounts and profile metadata, projects, versions, file metadata, and recorded activity. Spring Data JPA maps these records to backend entities.

Uploaded project files and profile-photo bytes are stored on the backend file system under the configured upload directory. Database rows store generated storage names, original/display names, file category, content type, size, and relationships to their owner, project, or version.

The browser uses LocalStorage only for the current authentication session:

| Key | Purpose |
|---|---|
| `pv_token` | JWT bearer token sent with authenticated API requests |
| `pv_user` | Cached signed-in user profile used to initialize the UI |

The backend validates the token against `/api/auth/me` when the application session is initialized. Logging out removes both keys.

## 11. Data Models

### User

An account has an ID, name, unique email, password hash, role, department, course, creation time, and optional student profile details such as summary, skills, profile visibility, profile photo metadata, and date of birth for recovery. Roles are `STUDENT` and `ADMIN`. An administrator with no department is the institute administrator; a department-assigned administrator is scoped to that department.

### Project

A project belongs to one user and contains a title, description, technology stack, category, visibility, timestamps, optional star rating, and optional grading scores and feedback. A project has related files, versions, and activity events.

### Project version

A version belongs to one project and stores its version number, notes, and creation time. Files may optionally reference a version.

### Project file

A file belongs to a project and may reference a version. Its metadata includes original and stored names, content type, category, size, and upload time. File categories are `SOURCE_CODE`, `DOCUMENTATION`, `PRESENTATION`, and `OTHER`.

### Activity records

Project activity records store an event type, description, timestamp, and related project. Profile activity records store a profile event type, timestamp, and related user. Daily activity summaries aggregate project event counts by date and event type.

### Relationships

- One user owns many projects.
- One project contains many versions, files, and project activity records.
- One version belongs to one project and can be associated with uploaded files.
- One user can have many profile activity records.

## 12. Application Flow

### Student flow

```text
Register or sign in
        ↓
Open student dashboard
        ↓
Create a project and choose its visibility
        ↓
Upload categorized files and save versions
        ↓
Review recorded work in activity insights
        ↓
Publish selected projects and share the portfolio
```

### Department administrator flow

```text
Sign in to department workspace
        ↓
View authorized students and department activity
        ↓
Open the department's public-project review queue
        ↓
Review a public project
        ↓
Assign a rating and/or grading feedback
```

### Institute administrator flow

```text
Sign in to institute workspace
        ↓
Create, assign, or remove department administrators
        ↓
Browse student portfolios that are publicly shared
```

## 13. System Architecture

```text
┌─────────────────────────┐
│ Student / Administrator │
└────────────┬────────────┘
             │ Browser
             ▼
┌─────────────────────────┐
│ React application       │
│ Vite · React Router     │
└────────────┬────────────┘
             │ Axios + JWT
             ▼
┌─────────────────────────┐
│ Spring Boot REST API    │
│ Controllers and DTOs    │
└───────┬───────────┬─────┘
        │           │
        ▼           ▼
┌──────────────┐  ┌──────────────────┐
│ Services and │  │ File storage     │
│ access rules │  │ Project uploads  │
└──────┬───────┘  │ Profile photos   │
       │          └──────────────────┘
       ▼
┌─────────────────────────┐
│ Spring Data JPA         │
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│ MySQL database          │
│ Accounts · Projects     │
│ Files · Versions        │
│ Activity records        │
└─────────────────────────┘
```

The frontend handles presentation and navigation. The backend owns authentication, business rules, file access checks, and role/department authorization. MySQL stores structured records; uploaded binary content is stored on backend disk.

## 14. Entity Relationship Diagram

```text
┌─────────────────────┐
│ USER                │
├─────────────────────┤
│ id                  │
│ name, email         │
│ password, role      │
│ department, course  │
│ profile details     │
└──────────┬──────────┘
           │ owns
           │ 1
           ▼ *
┌─────────────────────┐       ┌─────────────────────┐
│ PROJECT             │ 1   * │ PROJECT_VERSION     │
├─────────────────────┤───────├─────────────────────┤
│ id, title           │       │ id, version_number  │
│ description         │       │ notes, created_at   │
│ visibility          │       │ project_id          │
│ rating / grade      │       └──────────┬──────────┘
│ owner_id            │                  │ 0..1
└───────┬───────┬─────┘                  │
        │       │                        │
      1 │       │ 1                      │
        ▼ *     ▼ *                      ▼ *
┌──────────────┐ ┌──────────────────────┐
│ PROJECT_FILE │ │ PROJECT_ACTIVITY     │
├──────────────┤ ├──────────────────────┤
│ id           │ │ id, activity_type   │
│ project_id   │ │ description, time   │
│ version_id?  │ │ project_id          │
│ category     │ └──────────────────────┘
│ stored_name  │
└──────────────┘

┌─────────────────────┐
│ PROFILE_ACTIVITY    │
├─────────────────────┤
│ id, activity_type   │
│ created_at          │
│ user_id             │
└──────────┬──────────┘
           │ * belongs to 1
           └────────────── USER
```

## 15. Testing

### Available automated checks

| Check | Command / method | Expected result |
|---|---|---|
| Frontend production build | `cd frontend` then `npm run build` | Vite compiles and emits the production bundle |
| Backend source compilation | `cd backend` then `mvn test` or `mvn compile` | Maven compiles the backend and runs configured tests |
| Workspace diagnostics | VS Code Problems panel | No compile or language-service errors |

The frontend package currently defines a production build script but no dedicated test or lint script. No project-owned automated test suite is currently present. Validate backend changes using Maven in an environment where Maven and the configured MySQL/test setup are available.

### Manual test cases

| Test case | Action | Expected result |
|---|---|---|
| Student registration | Submit valid registration details | Student account is created and authenticated |
| Invalid sign-in role | Choose the wrong sign-in role for an account | Sign-in is rejected with a clear message |
| Create project | Create a project as a student | Project appears in the owner’s workspace |
| Project visibility | Open private, department, and public projects as users in different scopes | Each project is visible only to authorized users |
| File privacy | Open source-code and documentation files as a non-owner | Only permitted documentation/presentation resources are available |
| Version history | Save a project version with notes and files | Version is recorded and shown on the project page |
| Share portfolio | Set a profile public and share public projects | Signed-in users can browse the shared portfolio |
| Activity calendar | Open a student portfolio and select dates | Calendar shows recorded activity from public projects only |
| Department review | Review and rate a same-department public project | Rating and grading are saved and visible as allowed |
| Cross-department review | Try to rate a project outside the admin department | Backend denies the request |
| Institute admin permissions | Open project-management, rating, and activity APIs as institute admin | Backend denies the restricted actions |
| Manage department admins | Create or remove a department-admin account as institute admin | Staff directory updates; protected institute accounts remain |
| Production build | Run `npm run build` | Frontend production assets build successfully |

## 16. Advantages

- Keeps academic project files, versions, and notes organized.
- Gives students visibility controls for their work.
- Provides a student portfolio and public project discovery experience.
- Records daily project activity to help illustrate student consistency.
- Separates institute-wide account administration from department project review.
- Enforces file privacy, roles, and department scope on the backend.
- Uses reusable React components and a responsive user interface.
- Persists structured data in MySQL and stores uploads outside the browser.
- Supports project-resource categories and version-specific files.

## 17. Current Limitations

- The application requires a configured backend and MySQL database.
- Uploaded files and photos are stored on backend disk, not a cloud object store.
- Password recovery uses email and date of birth verification without an email-delivery workflow.
- Roles are represented by `STUDENT` and `ADMIN`; institute vs department administrator scope is determined by the administrator's department assignment.
- The frontend does not currently define automated unit or end-to-end test scripts.
- The project has no configured frontend lint command.
- Activity calendars report recorded events only and do not track general page views.
- Department and allowed-department options are configured in the backend.

## 18. Future Enhancements

- Add automated backend unit/integration tests and frontend component/end-to-end tests.
- Add a frontend lint and formatting workflow.
- Move uploads to managed object storage with backups and retention rules.
- Add email-based recovery and account-verification workflows.
- Add configurable project categories and department management.
- Add pagination and richer filters to project and student directories.
- Add audit history for administrator account changes and project reviews.
- Add deployment automation, monitoring, and database backup procedures.
- Add optional collaboration workflows for student teams.

## 19. Conclusion

ProjectVault provides an end-to-end workspace for academic projects, including project records, categorized resources, version history, student portfolios, and contribution activity. Its React frontend works with a Spring Boot API and MySQL database, with uploaded content stored on the backend file system.

The application also separates administration by scope: department administrators review and rate eligible department projects, while institute administrators manage department-admin accounts and browse publicly shared student portfolios. Server-side authorization protects project ownership, file access, and administrative actions.
