"""
Developer user seeding utilities.

Creates a default developer user on application startup.
Generates and stores TOKEN in APP_DEV_TOKEN environment variable.
"""

import logging
from datetime import datetime, timedelta
from uuid import UUID
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt

from app.models import User
from app.core.security import hash_password
from config import settings

logger = logging.getLogger(__name__)

# Fixed UUID for dev user
DEV_USER_ID = UUID('00000000-0000-0000-0000-000000000001')
DEV_USER_EMAIL = "dev-admin@societymanagement.com"
DEV_USER_PHONE = "9999999999"
DEV_USER_NAME = "Developer Admin"
DEV_USER_PASSWORD = "Dev@12345"  # Default password


def _generate_dev_token(user_id: UUID, expires_days: int = 365) -> str:
    """Generate a long-lived dev token for the developer user."""
    expire = datetime.utcnow() + timedelta(days=expires_days)
    to_encode = {
        "sub": str(user_id),
        "scope": "developer admin",
        "exp": expire,
    }
    encoded_jwt = jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    )
    return encoded_jwt


def _update_env_dev_token(token: str) -> None:
    """Update the APP_DEV_TOKEN in .env file."""
    env_path = Path(".env")

    if not env_path.exists():
        logger.warning(f".env file not found at {env_path}")
        return

    try:
        # Read existing .env
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # Find and update or add APP_DEV_TOKEN
        found = False
        new_lines = []
        for line in lines:
            if line.strip().startswith("APP_DEV_TOKEN="):
                new_lines.append(f"APP_DEV_TOKEN={token}\n")
                found = True
            else:
                new_lines.append(line)

        if not found:
            # Add it before DEBUG line if it exists, otherwise append
            insert_pos = len(new_lines)
            for i, line in enumerate(new_lines):
                if line.strip().startswith("DEBUG="):
                    insert_pos = i
                    break
            new_lines.insert(insert_pos, f"APP_DEV_TOKEN={token}\n")

        # Write back
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)

        logger.info("✓ APP_DEV_TOKEN updated in .env file")
        print("[SEED] ✓ APP_DEV_TOKEN updated in .env file")

    except Exception as e:
        logger.error(f"Error updating .env file: {e}")
        print(f"[SEED] ⚠ Warning: Could not update .env file: {e}")


async def seed_dev_user(session: AsyncSession) -> dict:
    """
    Create or verify the default developer user.

    If developer user already exists, skips creation and returns existing user info.
    Generates TOKEN and stores in APP_DEV_TOKEN.

    Returns:
        dict: Result with user info and token status
    """
    try:
        logger.info("Checking for default developer user...")
        print("\n[SEED] Checking for default developer user...")

        # Check if dev user already exists
        result = await session.execute(
            select(User).where(User.id == DEV_USER_ID)
        )
        existing_user = result.scalars().first()

        if existing_user:
            logger.info(
                f"Developer user already exists: {existing_user.email}")
            print("[SEED] ✓ Developer user already exists - SKIPPED")
            action = "SKIPPED"
            user = existing_user
        else:
            # Create new dev user
            logger.info("Creating new developer user...")
            print("[SEED] Creating developer user...")

            user = User(
                id=DEV_USER_ID,
                email=DEV_USER_EMAIL,
                phone=DEV_USER_PHONE,
                full_name=DEV_USER_NAME,
                password_hash=hash_password(DEV_USER_PASSWORD),
                global_role="developer",
                is_active=True,
                settings={
                    "timezone": "UTC",
                    "notifications_enabled": True,
                }
            )
            session.add(user)
            await session.commit()
            logger.info(f"Created developer user: {DEV_USER_EMAIL}")
            print(f"[SEED] ✓ Created developer user: {DEV_USER_EMAIL}")
            action = "CREATED"

        # Generate and store TOKEN
        token = _generate_dev_token(DEV_USER_ID, expires_days=365)
        _update_env_dev_token(token)

        logger.info(f"Developer user {action} - TOKEN generated (365 days)")
        print("[SEED] ✓ TOKEN generated (365 days)")

        return {
            "action": action,
            "user_id": str(DEV_USER_ID),
            "email": DEV_USER_EMAIL,
            "phone": DEV_USER_PHONE,
            "role": "developer",
            "token_generated": True,
            "token_expires_days": 365,
            "credentials": {
                "email": DEV_USER_EMAIL,
                "password": DEV_USER_PASSWORD,
            } if action == "CREATED" else None,
        }

    except Exception as e:
        logger.error(f"Error seeding developer user: {e}", exc_info=True)
        print(f"[SEED] ❌ Error seeding developer user: {e}")
        raise


async def update_dev_token_on_password_change(
    session: AsyncSession,
    user_id: UUID = DEV_USER_ID,
) -> str:
    """
    Update APP_DEV_TOKEN after developer user password is changed.

    Args:
        session: Database session
        user_id: User ID (defaults to dev user)

    Returns:
        str: New generated token
    """
    try:
        # Verify user exists
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalars().first()

        if not user:
            logger.warning(f"User {user_id} not found for token update")
            return None

        # Generate new token
        token = _generate_dev_token(user_id, expires_days=365)

        # Update .env
        _update_env_dev_token(token)

        logger.info(f"Token updated for user {user.email}")
        print("[AUTH] ✓ APP_DEV_TOKEN updated after password change")

        return token

    except Exception as e:
        logger.error(
            f"Error updating token on password change: {e}", exc_info=True)
        print(f"[AUTH] ⚠ Warning: Could not update token: {e}")
        return None
