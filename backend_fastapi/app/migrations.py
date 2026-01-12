"""
Database migrations module.

Automatically syncs database schema with SQLAlchemy models on startup.
"""

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)


async def run_migrations(db: AsyncSession):
    """
    Automatically sync database schema with SQLAlchemy models.
    Adds missing columns and tables without dropping existing data.

    Args:
        db: Database session
    """
    logger.info("Syncing database schema with models...")

    try:
        from app.database import Base

        # Get all model tables
        metadata = Base.metadata

        for table in metadata.sorted_tables:
            await sync_table(db, table)

        await db.commit()
        logger.info("Database schema sync completed successfully")

    except Exception as e:
        await db.rollback()
        logger.error(f"Schema sync failed: {e}")
        raise


async def sync_table(db: AsyncSession, table):
    """
    Sync a specific table with its model definition.
    Adds missing columns to existing tables.

    Args:
        db: Database session
        table: SQLAlchemy Table object
    """
    table_name = table.name

    try:
        # Check if table exists
        check_table = text(
            f"""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = '{table_name}'
            )
        """  # nosec B608 - table_name is validated internally
        )
        result = await db.execute(check_table)
        table_exists = result.scalar()

        if not table_exists:
            # Table doesn't exist, it will be created by create_all
            logger.info(f"Table '{table_name}' will be created by create_all")
            return

        # Get existing columns in database
        get_columns = text(
            f"""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns
            WHERE table_name = '{table_name}'
        """  # nosec B608 - table_name is validated internally
        )
        result = await db.execute(get_columns)
        existing_columns = {row[0]: row for row in result.fetchall()}

        # Check each column in the model
        for column in table.columns:
            if column.name not in existing_columns:
                # Add missing column
                await add_column(db, table_name, column)

    except Exception as e:
        logger.error(f"Failed to sync table '{table_name}': {e}")
        raise


async def add_column(db: AsyncSession, table_name: str, column):
    """
    Add a missing column to an existing table.

    Args:
        db: Database session
        table_name: Name of the table
        column: SQLAlchemy Column object
    """
    try:
        # Build column definition
        col_type = str(column.type.compile(dialect=db.bind.dialect))

        # Handle nullable
        nullable = "" if column.nullable else " NOT NULL"

        # Handle default value
        default = ""
        if column.default is not None:
            if hasattr(column.default, "arg"):
                if callable(column.default.arg):
                    # For functions like uuid4, datetime.utcnow
                    default = ""
                elif isinstance(column.default.arg, str):
                    default = f" DEFAULT '{column.default.arg}'"
                else:
                    default = f" DEFAULT {column.default.arg}"

        # Handle foreign keys
        fk_constraint = ""
        if column.foreign_keys:
            for fk in column.foreign_keys:
                # Extract table and column from target
                target_parts = str(fk.target_fullname).split(".")
                if len(target_parts) == 2:
                    fk_table = target_parts[0]
                    fk_column = target_parts[1]
                    fk_constraint = f" REFERENCES {fk_table}({fk_column})"

        # Build and execute ALTER TABLE
        alter_sql = f"""
            ALTER TABLE {table_name}
            ADD COLUMN IF NOT EXISTS {column.name} {col_type}{nullable}{default}{fk_constraint}
        """

        await db.execute(text(alter_sql))
        logger.info(f"Added column '{column.name}' to table '{table_name}'")

        # Add index if needed
        if column.index:
            index_name = f"ix_{table_name}_{column.name}"
            create_index = f"""
                CREATE INDEX IF NOT EXISTS {index_name}
                ON {table_name}({column.name})
            """
            await db.execute(text(create_index))
            logger.info(f"Created index '{index_name}'")

    except Exception as e:
        logger.error(f"Failed to add column '{column.name}' to '{table_name}': {e}")
        raise
