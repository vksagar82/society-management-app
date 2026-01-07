"""
Pytest configuration and fixtures.

This module provides reusable test fixtures for all test modules with automatic cleanup.
"""

import pytest
import asyncio
from typing import Generator, AsyncGenerator, List
from fastapi.testclient import TestClient
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from uuid import UUID, uuid4

from main import app
from app.database import AsyncSessionLocal, engine
from app.core.security import create_access_token, hash_password
from app.models import User, Society, UserSociety, Issue, IssueComment, Asset, AssetCategory, AMC, AMCServiceHistory
from config import settings


# Store created test data IDs for cleanup
test_data_ids = {
    "users": [],
    "societies": [],
    "user_societies": [],
    "issues": [],
    "issue_comments": [],
    "assets": [],
    "asset_categories": [],
    "amcs": [],
    "amc_service_histories": []
}


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    """
    Database fixture for tests with automatic cleanup.

    Creates a test database session for each test function.
    Ensures all test data is cleaned up even if test fails.
    """
    async with AsyncSessionLocal() as session:
        yield session

        # Cleanup test data in reverse order (to respect foreign keys)
        try:
            # Delete in correct order to avoid foreign key violations
            await session.execute(delete(AMCServiceHistory).where(AMCServiceHistory.id.in_(test_data_ids["amc_service_histories"])))
            await session.execute(delete(AMC).where(AMC.id.in_(test_data_ids["amcs"])))
            await session.execute(delete(IssueComment).where(IssueComment.id.in_(test_data_ids["issue_comments"])))
            await session.execute(delete(Issue).where(Issue.id.in_(test_data_ids["issues"])))
            await session.execute(delete(Asset).where(Asset.id.in_(test_data_ids["assets"])))
            await session.execute(delete(AssetCategory).where(AssetCategory.id.in_(test_data_ids["asset_categories"])))
            await session.execute(delete(UserSociety).where(UserSociety.id.in_(test_data_ids["user_societies"])))
            await session.execute(delete(Society).where(Society.id.in_(test_data_ids["societies"])))
            await session.execute(delete(User).where(User.id.in_(test_data_ids["users"])))

            await session.commit()

            # Clear tracking lists
            for key in test_data_ids:
                test_data_ids[key].clear()
        except Exception as e:
            print(f"⚠️  Cleanup error: {e}")
            await session.rollback()


@pytest.fixture(scope="function")
def client(db: AsyncSession) -> Generator:
    """
    Test client fixture.

    Provides a TestClient for making requests to the API.
    """
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def test_user_data():
    """Test user data fixture."""
    return {
        "email": f"test_{uuid4().hex[:8]}@example.com",
        "phone": f"98{uuid4().hex[:8][:8]}",
        "full_name": "Test User",
        "password": "TestPass123!"
    }


@pytest.fixture
async def test_user(db: AsyncSession, test_user_data) -> User:
    """Create a test user in the database."""
    user = User(
        id=uuid4(),
        email=test_user_data["email"],
        phone=test_user_data["phone"],
        full_name=test_user_data["full_name"],
        password_hash=hash_password(test_user_data["password"]),
        global_role="member",
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Track for cleanup
    test_data_ids["users"].append(user.id)

    return user


@pytest.fixture
async def test_admin_user(db: AsyncSession) -> User:
    """Create a test admin user."""
    user = User(
        id=uuid4(),
        email=f"admin_{uuid4().hex[:8]}@example.com",
        phone=f"97{uuid4().hex[:8][:8]}",
        full_name="Admin User",
        password_hash=hash_password("AdminPass123!"),
        global_role="admin",
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    test_data_ids["users"].append(user.id)

    return user


@pytest.fixture
async def test_developer_user(db: AsyncSession) -> User:
    """Create a test developer user."""
    user = User(
        id=uuid4(),
        email=f"dev_{uuid4().hex[:8]}@example.com",
        phone=f"96{uuid4().hex[:8][:8]}",
        full_name="Developer User",
        password_hash=hash_password("DevPass123!"),
        global_role="developer",
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    test_data_ids["users"].append(user.id)

    return user


@pytest.fixture
async def test_society(db: AsyncSession) -> Society:
    """Create a test society."""
    society = Society(
        id=uuid4(),
        name=f"Test Society {uuid4().hex[:6]}",
        address="123 Test Street",
        city="Test City",
        state="Test State",
        pincode="123456",
        total_units=100,
        contact_email=f"society_{uuid4().hex[:8]}@example.com",
        contact_phone=f"99{uuid4().hex[:8][:8]}"
    )
    db.add(society)
    await db.commit()
    await db.refresh(society)

    test_data_ids["societies"].append(society.id)

    return society


@pytest.fixture
def user_token(test_user: User):
    """Generate token for test user."""
    token_data = {
        "sub": str(test_user.id),
        "email": test_user.email
    }
    return create_access_token(token_data)


@pytest.fixture
def admin_token(test_admin_user: User):
    """Generate token for admin user."""
    token_data = {
        "sub": str(test_admin_user.id),
        "email": test_admin_user.email
    }
    return create_access_token(token_data)


@pytest.fixture
def developer_token(test_developer_user: User):
    """Generate token for developer user."""
    token_data = {
        "sub": str(test_developer_user.id),
        "email": test_developer_user.email
    }
    return create_access_token(token_data)


@pytest.fixture
def member_token(test_user: User):
    """Generate token for member user."""
    token_data = {
        "sub": str(test_user.id),
        "email": test_user.email
    }
    return create_access_token(token_data)


@pytest.fixture
def auth_headers(member_token):
    """Authorization headers with member token."""
    return {"Authorization": f"Bearer {member_token}"}


@pytest.fixture
def admin_headers(admin_token):
    """Authorization headers with admin token."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def developer_headers(developer_token):
    """Authorization headers with developer token."""
    return {"Authorization": f"Bearer {developer_token}"}


@pytest.fixture
def test_society_data():
    """Test society data fixture."""
    return {
        "name": "Test Society",
        "address": "123 Test Street",
        "city": "Test City",
        "state": "Test State",
        "pincode": "123456",
        "contact_person": "John Doe",
        "contact_email": "contact@testsociety.com",
        "contact_phone": "9876543210"
    }


@pytest.fixture
def test_issue_data():
    """Test issue data fixture."""
    return {
        "title": "Test Issue",
        "description": "This is a test issue description",
        "category": "Maintenance",
        "priority": "medium",
        "location": "Block A, Floor 2"
    }


@pytest.fixture
def test_asset_data():
    """Test asset data fixture."""
    return {
        "name": "Test Asset",
        "description": "Test asset description",
        "purchase_cost": 10000,
        "location": "Main Building",
        "asset_code": "ASSET-001",
        "maintenance_frequency": "monthly"
    }


@pytest.fixture
def test_amc_data():
    """Test AMC data fixture."""
    return {
        "vendor_name": "Test Vendor",
        "vendor_code": "VENDOR-001",
        "service_type": "Plumbing",
        "contract_start_date": "2026-01-01",
        "contract_end_date": "2026-12-31",
        "annual_cost": 50000,
        "currency": "INR",
        "contact_person": "Vendor Contact",
        "contact_phone": "9876543210"
    }
