from datetime import datetime, timezone

from sqlalchemy import DateTime
from sqlalchemy.types import TypeDecorator


class UTCDateTime(TypeDecorator):
    """A DateTime column that always round-trips as timezone-aware UTC.

    SQLite has no real timezone support: values come back as naive
    datetimes even from a DateTime(timezone=True) column. Without this,
    naive UTC timestamps get serialized without a 'Z'/offset, and the
    frontend's `new Date(...)` then misinterprets them as local time.
    """

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    def process_result_value(self, value: datetime | None, dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
