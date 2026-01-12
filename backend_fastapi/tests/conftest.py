"""
Pytest configuration and fixtures.

This module provides reusable test fixtures for all test modules with automatic cleanup.
"""

import asyncio
from datetime import datetime
from typing import AsyncGenerator, Dict, Generator, List
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.database import AsyncSessionLocal, engine, get_session
from app.models import Society, User
from main import app

# Bcrypt_sha256 hash for the password "password" using the app hasher (keeps 72-char limit)
PASSWORD_HASH = hash_password("password")

# Fixed UUID for dev user
DEV_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


# Store created test data IDs for cleanup
test_data_ids: Dict[str, List] = {
    "users": [],
    "societies": [],
    "user_societies": [],
    "issues": [],
    "issue_comments": [],
    "assets": [],
    "asset_categories": [],
    "amcs": [],
    "amc_service_histories": [],
}


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def setup_dev_user():
    """Create the dev user once per test session for all tests."""
    async with AsyncSessionLocal() as session:
        # Always recreate the dev user to ensure clean state
        await session.execute(delete(User).where(User.id == DEV_USER_ID))
        user = User(
            id=DEV_USER_ID,
            email="dev-admin@example.com",
            phone="9999999999",
            full_name="Dev Admin Test",
            password_hash=PASSWORD_HASH,
            global_role="developer",
            is_active=True,
        )
        session.add(user)
        await session.commit()


@pytest.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    """
    Legacy direct-session fixture (kept for compatibility).
    Uses live DB; callers should prefer db_sandbox for rollback isolation.
    """
    async with AsyncSessionLocal() as session:
        yield session


@pytest.fixture(scope="function")
async def db_sandbox() -> AsyncGenerator[AsyncSession, None]:
    """
    Transactional sandbox on the live Supabase DB.

    Each test runs inside a transaction that is rolled back, so mock data
    never persists while still exercising the real database.
    """
    async with engine.connect() as conn:
        trans = await conn.begin()
        async with AsyncSession(bind=conn, expire_on_commit=False) as session:
            try:
                yield session
            finally:
                await session.rollback()
        await trans.rollback()


@pytest.fixture(scope="function")
def client(db_sandbox: AsyncSession) -> Generator:
    """Test client that injects the sandboxed DB session."""

    async def override_get_session():
        yield db_sandbox

    app.dependency_overrides[get_session] = override_get_session
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_session, None)


@pytest.fixture
def test_user_data():
    """Test user data fixture."""
    return {
        "email": f"test_{uuid4().hex[:8]}@example.com",
        "phone": f"98{uuid4().hex[:8][:8]}",
        "full_name": "Test User",
        "password": "TestPass123!",
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
        is_active=True,
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
        is_active=True,
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
        is_active=True,
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
        contact_phone=f"99{uuid4().hex[:8][:8]}",
    )
    db.add(society)
    await db.commit()
    await db.refresh(society)

    test_data_ids["societies"].append(society.id)

    return society


@pytest.fixture
def user_token(test_user: User):
    """Generate token for test user."""
    token_data = {"sub": str(test_user.id), "email": test_user.email}
    return create_access_token(token_data)


@pytest.fixture
def admin_token(test_admin_user: User):
    """Generate token for admin user."""
    token_data = {"sub": str(test_admin_user.id), "email": test_admin_user.email}
    return create_access_token(token_data)


@pytest.fixture
def developer_token(test_developer_user: User):
    """Generate token for developer user."""
    token_data = {
        "sub": str(test_developer_user.id),
        "email": test_developer_user.email,
    }
    return create_access_token(token_data)


@pytest.fixture
def member_token(test_user: User):
    """Generate token for member user."""
    token_data = {"sub": str(test_user.id), "email": test_user.email}
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
        "contact_phone": "9876543210",
    }


@pytest.fixture
def test_issue_data():
    """Test issue data fixture."""
    return {
        "title": "Test Issue",
        "description": "This is a test issue description",
        "category": "Maintenance",
        "priority": "medium",
        "location": "Block A, Floor 2",
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
        "maintenance_frequency": "monthly",
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
        "contact_phone": "9876543210",
    }


# ============================================================================
# PYTEST HOOKS - Test Summary Reporting
# ============================================================================


def pytest_sessionfinish(session, exitstatus):
    """
    Print a custom test summary at the end of the test session.

    This hook runs after all tests are completed and provides a formatted
    summary of test results with statistics.
    """
    # Get info from the session's terminalreporter
    passed = 0
    failed = 0
    skipped = 0

    try:
        if hasattr(session, "config") and hasattr(session.config, "pluginmanager"):
            reporter = session.config.pluginmanager.get_plugin("terminalreporter")
            if reporter and hasattr(reporter, "stats"):
                stats = reporter.stats
                passed = len(stats.get("passed", []))
                failed = len(stats.get("failed", []))
                skipped = len(stats.get("skipped", []))
    except Exception:
        pass

    total = passed + failed + skipped

    # Print summary
    print("\n" + "=" * 80)
    print("TEST EXECUTION SUMMARY".center(80))
    print("=" * 80)
    print(f"\nTotal Tests: {total}")
    print(f"Passed: {passed}")
    if failed > 0:
        print(f"Failed: {failed}")
    if skipped > 0:
        print(f"Skipped: {skipped}")

    if total > 0:
        pass_rate = (passed / total) * 100
        print(f"\nPass Rate: {pass_rate:.1f}%")

    print(f"\nTimestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80 + "\n")
