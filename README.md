# ProjectVault

Academic project repository: store projects, source code, documents and presentations, keep a version history and share work.

See [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for the full project structure, modules, architecture, data models, API routes, and setup guide.

Stack: React (Vite) + Spring Boot 3 + MySQL + Spring Security + JWT + REST.

## Run the backend
Requirements: Java 17, Maven, MySQL running on port 3306.

1. Open `backend/src/main/resources/application.properties` and set your MySQL username and password.
   The `projectvault` database is created automatically.
2. Start it:
   ```
   cd backend
   mvn spring-boot:run
   ```
   API runs on http://localhost:8080. Uploaded files are saved in `backend/uploads/`.

## Run the frontend
Requirements: Node 18+.
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

## Logins
- Admin (created automatically on first start): `admin@projectvault.com` / `admin123`
  Choose the **Admin** tab on the login page. Change this in `application.properties` before real use.
- Student: click "Create an account" on the login page, provide your name, email, date of birth, and password, then sign in with your email on the **Student** tab.

## Roles
- Student: add, edit and delete own projects, upload source code, documentation and presentations into separate categories, save new versions with categorized files, share a project with all users, and view projects shared by others. Search students by name; shared profiles show public project activity, and only documentation and presentations can be viewed or downloaded by non-owners.
- Department administrator: manage student accounts within the authorized department, view projects allowed by department/project visibility, and review, rate (1–5 stars), and grade public projects from that department. Non-owners can access documentation and presentations only, not source code or other file categories.
- Institute administrator: create, assign, and remove department administrators, and browse student portfolios students have shared publicly. Institute administrators cannot manage project records, review/rate/grade projects, or access project activity analytics. Their own account and other institute-admin accounts are protected from the staff-removal action.
- Students can add a profile photo, summary, department, course and skills, then share a profile link with signed-in ProjectVault users. Photos accept JPG, PNG or GIF up to 5 MB. Shared profiles show the student’s photo, name and portfolio details and only projects marked public; private projects, email addresses and grades are not included.
- Student registration collects date of birth for account recovery. Existing students without a saved date of birth are prompted to add it in their profile. Recovery checks the account email and date of birth, then lets the student set a new password without email delivery.

## API summary
| Method | Path | Notes |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| POST | /api/auth/password-reset | public; verifies student email and date of birth, then changes the password |
| GET | /api/auth/me | signed in |
| GET, PUT | /api/auth/profile | view or update own student profile |
| PUT | /api/auth/profile/recovery-details | one-time setup for legacy student accounts |
| POST | /api/auth/profile/photo | upload or replace own profile photo; multipart `photo` (JPG, PNG, GIF, max 5 MB) |
| GET | /api/auth/profile/activity | profile edits and photo updates from the last six months |
| GET | /api/auth/students/{id} | signed-in student profile with public projects only |
| GET | /api/auth/student-search?q=... | find students with public projects by name |
| GET | /api/auth/students/{id}/activity | recent activity for the student's public projects |
| GET | /api/auth/students/{id}/activity/daily?from=...&to=... | daily activity calendar for public projects |
| GET | /api/auth/students/{id}/photo | view a signed-in student’s profile photo |
| GET | /api/auth/users | accounts within the signed-in administrator's authorized scope |
| DELETE | /api/auth/users/{id} | department admin deletes authorized students; institute admin removes department admins |
| POST | /api/auth/admins | create or assign a department administrator (institute admin) |
| GET | /api/auth/departments/overview | department overview (institute admin) |
| GET | /api/projects, /api/projects/shared | projects available to the signed-in user; institute admin cannot use project listings |
| GET | /api/projects/all | department admin; institute admin is denied |
| GET | /api/projects/reviews | department-scoped public project review queue |
| PUT, DELETE | /api/projects/{id}/rating | assign or remove a public-project rating (department admin only) |
| PUT | /api/projects/{id}/grade | submit a project grade and feedback (department admin only) |
| GET | /api/projects/activity | recent project activity within the caller's scope; institute admin is denied |
| GET | /api/projects/activity/daily?from=...&to=... | daily activity calendar; institute admin is denied |
| GET | /api/projects/{id}/activity | activity for a project visible to the signed-in user |
| GET | /api/projects/{id} | view a project subject to visibility rules |
| PUT, DELETE | /api/projects/{id} | update or delete by owning student |
| POST | /api/projects | create (student) |
| GET, POST | /api/projects/{id}/versions | history / add version by owning student |
| POST | /api/projects/{id}/files | upload by owning student; multipart `files`, optional `versionId`, optional `category` (`SOURCE_CODE`, `DOCUMENTATION`, `PRESENTATION`, or `OTHER`) |
| GET, DELETE | /api/files/{id}/download, /api/files/{id} | owners can access all files; other signed-in users can access documentation and presentations only / delete by owning student |

## Build notes

- Project display name: **ProjectVault**.
- The backend uses explicit Java getters and setters instead of Lombok, so Eclipse does not need Lombok installation or annotation processing.
- The upload UI separates source code, documentation and presentation files. With `spring.jpa.hibernate.ddl-auto=update`, restarting the backend adds the nullable file-category column to an existing database.
- Import `backend` as an existing Maven project in Eclipse/STS, choose **Maven → Update Project**, then run `mvn clean compile`.
- Set `spring.datasource.username` and `spring.datasource.password` in `backend/src/main/resources/application.properties` to match your local MySQL configuration before starting the backend.
- The frontend expects the backend at `http://localhost:8080/api`; start the backend before using the frontend.
"# academic-project-repository" 
