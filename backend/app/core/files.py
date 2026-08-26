import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"

ALLOWED_CONTENT_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "application/pdf": ".pdf",
}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def save_upload(file: UploadFile) -> tuple[str, str, str, int]:
    """Validate and persist an uploaded file. Returns (stored_name, original_name, content_type, size)."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attachment must be a PNG, JPG, or PDF file.",
        )

    contents = file.file.read()
    size = len(contents)
    if size > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attachment must be 10 MB or smaller.",
        )
    if size == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Attachment file is empty.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    extension = ALLOWED_CONTENT_TYPES[file.content_type]
    stored_name = f"{uuid.uuid4().hex}{extension}"
    (UPLOAD_DIR / stored_name).write_bytes(contents)

    return stored_name, file.filename or stored_name, file.content_type, size
