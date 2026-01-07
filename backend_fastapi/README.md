# Society Management System - FastAPI Backend

A comprehensive RESTful API built with FastAPI for managing residential societies with features including user management, authentication, society management, asset tracking, AMC contracts, and issue management.

## Features

- **🔐 Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **👥 User Management**: Complete user lifecycle management with role-based permissions
- **🏘️ Society Management**: Multi-society support with approval workflows
- **📋 Issue Management**: Track and manage complaints/issues with comments
- **🏗️ Asset Management**: Track society assets with categorization
- **📝 AMC Management**: Manage Annual Maintenance Contracts with service history
- **🔍 Audit Logging**: Comprehensive activity tracking
- **📧 Email Notifications**: Automated email notifications for key events
- **📚 API Documentation**: Auto-generated OpenAPI/Swagger documentation
- **✅ Comprehensive Tests**: Full test coverage with pytest

## Tech Stack

- **Framework**: FastAPI 0.109.0
- **Database**: PostgreSQL with asyncpg
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt (passlib)
- **Validation**: Pydantic v2
- **Testing**: pytest with async support
- **Code Quality**: Black, flake8, isort, mypy

## Project Structure

```
backend_fastapi/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py        # Authentication endpoints
│   │       │   ├── users.py       # User management
│   │       │   ├── societies.py   # Society management
│   │       │   ├── issues.py      # Issue/complaint management
│   │       │   ├── assets.py      # Asset management
│   │       │   └── amcs.py        # AMC management
│   │       └── router.py          # Main API router
│   ├── core/
│   │   ├── security.py            # Security utilities (JWT, password hashing)
│   │   └── deps.py                # Dependency injections (auth, permissions)
│   ├── schemas/
│   │   ├── user.py                # User schemas
│   │   ├── auth.py                # Authentication schemas
│   │   ├── society.py             # Society schemas
│   │   ├── issue.py               # Issue schemas
│   │   ├── asset.py               # Asset schemas
│   │   └── amc.py                 # AMC schemas
│   ├── utils/
│   │   └── email.py               # Email utilities
│   └── database.py                # Database connection
├── tests/
│   ├── conftest.py                # Pytest fixtures
│   ├── test_auth.py               # Auth endpoint tests
│   ├── test_users.py              # User endpoint tests
│   └── test_societies.py          # Society endpoint tests
├── config.py                      # Configuration management
├── main.py                        # Application entry point
├── requirements.txt               # Python dependencies
└── .env.example                   # Environment variables template
```

## Installation

### Prerequisites

- Python 3.10+
- PostgreSQL 13+
- pip or poetry

### Setup

1. **Clone the repository**:

   ```bash
   cd backend_fastapi
   ```

2. **Create virtual environment**:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your configuration:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/society_db
   SECRET_KEY=your-secret-key-here
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

5. **Setup database**:

   ```bash
   # Create database
   createdb society_db

   # Run schema
   psql society_db < ../database/schema.sql
   ```

6. **Run the application**:

   ```bash
   python main.py
   ```

   Or with uvicorn:

   ```bash
   uvicorn main:app --reload --port 8000
   ```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/openapi.json

## API Endpoints

### Authentication

- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login and get tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `POST /api/v1/auth/change-password` - Change password

### Users

- `GET /api/v1/users` - List users (admin only)
- `GET /api/v1/users/{id}` - Get user details
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user (developer only)
- `GET /api/v1/users/{id}/settings` - Get user settings
- `PUT /api/v1/users/{id}/settings` - Update user settings
- `POST /api/v1/users/{id}/toggle-active` - Toggle user active status

### Societies

- `GET /api/v1/societies` - List societies
- `POST /api/v1/societies` - Create society (admin only)
- `GET /api/v1/societies/{id}` - Get society details
- `PUT /api/v1/societies/{id}` - Update society
- `DELETE /api/v1/societies/{id}` - Delete society (developer only)
- `POST /api/v1/societies/{id}/join` - Request to join society
- `GET /api/v1/societies/{id}/members` - List society members
- `POST /api/v1/societies/{id}/approve-member` - Approve/reject membership

### Issues

- `GET /api/v1/issues` - List issues
- `POST /api/v1/issues` - Create issue
- `GET /api/v1/issues/{id}` - Get issue details
- `PUT /api/v1/issues/{id}` - Update issue
- `DELETE /api/v1/issues/{id}` - Delete issue
- `POST /api/v1/issues/{id}/comments` - Add comment
- `GET /api/v1/issues/{id}/comments` - Get comments

### Assets

- `GET /api/v1/assets/categories` - List asset categories
- `POST /api/v1/assets/categories` - Create category
- `GET /api/v1/assets` - List assets
- `POST /api/v1/assets` - Create asset
- `GET /api/v1/assets/{id}` - Get asset details
- `PUT /api/v1/assets/{id}` - Update asset
- `DELETE /api/v1/assets/{id}` - Delete asset

### AMCs

- `GET /api/v1/amcs` - List AMCs
- `POST /api/v1/amcs` - Create AMC
- `GET /api/v1/amcs/{id}` - Get AMC details
- `PUT /api/v1/amcs/{id}` - Update AMC
- `DELETE /api/v1/amcs/{id}` - Delete AMC
- `POST /api/v1/amcs/{id}/service-history` - Add service record
- `GET /api/v1/amcs/{id}/service-history` - Get service history

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-access-token>
```

### Roles

- **Developer**: Full system access
- **Admin**: Society-level administrative access
- **Manager**: Limited administrative access
- **Member**: Basic member access

## Testing

Run all tests:

```bash
pytest
```

Run with coverage:

```bash
pytest --cov=app --cov-report=html
```

Run specific test file:

```bash
pytest tests/test_auth.py -v
```

## Code Quality

Format code with Black:

```bash
black .
```

Sort imports:

```bash
isort .
```

Lint with flake8:

```bash
flake8 app
```

Type checking:

```bash
mypy app
```

## Environment Variables

| Variable                      | Description               | Default                       |
| ----------------------------- | ------------------------- | ----------------------------- |
| `DATABASE_URL`                | PostgreSQL connection URL | Required                      |
| `SECRET_KEY`                  | JWT secret key            | Required                      |
| `ALGORITHM`                   | JWT algorithm             | HS256                         |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token expiry       | 30                            |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | Refresh token expiry      | 7                             |
| `SMTP_HOST`                   | SMTP server host          | smtp.gmail.com                |
| `SMTP_PORT`                   | SMTP server port          | 587                           |
| `SMTP_USER`                   | SMTP username             | Required                      |
| `SMTP_PASSWORD`               | SMTP password             | Required                      |
| `EMAIL_FROM`                  | From email address        | noreply@societymanagement.com |
| `ALLOWED_ORIGINS`             | CORS allowed origins      | http://localhost:3000         |
| `DEBUG`                       | Debug mode                | True                          |

## Deployment

### Using Docker (Recommended)

```bash
docker build -t society-api .
docker run -p 8000:8000 --env-file .env society-api
```

### Manual Deployment

1. Set `DEBUG=False` in production
2. Use a production ASGI server (gunicorn with uvicorn workers)
3. Set up PostgreSQL with proper credentials
4. Configure reverse proxy (nginx)
5. Enable HTTPS

Example with gunicorn:

```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## PEP 8 Compliance

This codebase follows PEP 8 guidelines:

- Maximum line length: 88 characters (Black default)
- Imports are sorted with isort
- Type hints are used throughout
- Comprehensive docstrings in Google style

## Contributing

1. Follow PEP 8 guidelines
2. Write tests for new features
3. Update documentation
4. Run code quality checks before committing

## License

MIT License

## Support

For issues and questions, please create an issue in the repository.
