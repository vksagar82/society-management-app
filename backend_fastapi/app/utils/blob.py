"""
Vercel Blob storage utility for uploading files.

This module handles file uploads to Vercel Blob storage.
"""

import base64
import io
from typing import Optional

import requests

from config import settings


async def upload_to_blob(
    file_data: str,
    filename: str,
    content_type: str = "image/jpeg"
) -> Optional[str]:
    """
    Upload a file to Vercel Blob storage.

    Args:
        file_data: Base64 encoded file data (with or without data URL prefix)
        filename: Name for the file in blob storage
        content_type: MIME type of the file

    Returns:
        URL of the uploaded file in Vercel Blob storage, or None if upload fails
    """
    if not settings.blob_read_write_token:
        raise ValueError("BLOB_READ_WRITE_TOKEN not configured")

    # Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    if file_data.startswith("data:"):
        file_data = file_data.split(",", 1)[1]

    # Decode base64 to bytes
    try:
        file_bytes = base64.b64decode(file_data)
    except Exception as e:
        raise ValueError(f"Invalid base64 data: {str(e)}")

    # Upload to Vercel Blob
    try:
        response = requests.put(
            f"https://blob.vercel-storage.com/{filename}",
            headers={
                "Authorization": f"Bearer {settings.blob_read_write_token}",
                "X-Content-Type": content_type,
            },
            data=file_bytes,
            timeout=30,
        )
        response.raise_for_status()

        # Vercel Blob returns JSON with the URL
        blob_data = response.json()
        return blob_data.get("url")
    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Failed to upload to Vercel Blob: {str(e)}")
