# Society Management FastAPI Backend - Quick Start Guide

## Prerequisites

- Python 3.10+
- PostgreSQL 13+ (or access to Supabase)
- Git

## Quick Setup (5 minutes)

### 1. Navigate to backend directory

```bash
cd backend_fastapi
```

### 2. Create and activate virtual environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

The `.env` file is already created. Edit it with your database credentials:

```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/society_db
SECRET_KEY=your-secret-key-here  # Keep the generated one or change it
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**For Supabase users**, update `DATABASE_URL` with your Supabase connection string:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 5. Setup database

The database schema is in `../database/schema.sql`. Run it:

```bash
# If using local PostgreSQL
psql -U postgres -d society_db -f ../database/schema.sql

# If using Supabase, run the schema in Supabase SQL Editor
```

### 6. Run the application

```bash
python main.py
```

Or with uvicorn:

```bash
uvicorn main:app --reload --port 8000
```

### 7. Access the API

- **API**: http://localhost:8000
- **Interactive Docs (Swagger)**: http://localhost:8000/api/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/health

## Testing the API

### Run tests

```bash
pytest
```

### Test with coverage

```bash
pytest --cov=app --cov-report=html
```

View coverage report: `open htmlcov/index.html`

## API Usage Example

### 1. Register a user

```bash
curl -X POST "http://localhost:8000/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "phone": "1234567890",
    "full_name": "John Doe",
    "password": "SecurePass123"
  }'
```

### 2. Login

```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

Save the `access_token` from the response.

### 3. Get current user

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Code Quality

### Format code

```bash
black .
isort .
```

### Lint

```bash
flake8 app
```

### Type check

```bash
mypy app
```

## Project Structure

```
backend_fastapi/
├── app/
│   ├── api/v1/endpoints/    # API endpoints (each feature in separate file)
│   ├── core/                # Core functionality (security, deps)
│   ├── schemas/             # Pydantic models for validation
│   └── utils/               # Utility functions
├── tests/                   # Comprehensive test suite
├── main.py                  # Application entry point
├── config.py                # Configuration management
└── requirements.txt         # Python dependencies
```

## Next Steps

1. **Customize email templates** in `app/utils/email.py`
2. **Add more endpoints** as needed
3. **Configure CORS** in `config.py` for your frontend
4. **Set up CI/CD** using the included tests
5. **Deploy** using Docker or your preferred platform

## Troubleshooting

### Database connection error

- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Check firewall settings

### Import errors

- Ensure virtual environment is activated
- Reinstall requirements: `pip install -r requirements.txt`

### Email not sending

- Use Gmail App Password (not regular password)
- Enable "Less secure app access" or use OAuth2

## Support

- Check [README.md](README.md) for detailed documentation
- Review API docs at `/api/docs`
- Check test files for usage examples

Happy coding! 🚀
