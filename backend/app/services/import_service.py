import csv
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Episode


KNOWN_ROBOTS = {
    "arm-01",
    "arm-02",
    "arm-03",
    "mobile-01",
    "humanoid-01",
}

# These are the quality values defined by the original requirements.
VALID_QUALITY = {"good", "bad", "usable"}


def parse_recorded_at(value: str) -> datetime:
    value = value.strip()

    # First try ISO format, including timestamps ending in Z.
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        parsed = None

    # Then try the other formats that appear in the messy dataset.
    if parsed is None:
        formats = [
            "%d/%m/%Y %H:%M",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%Y/%m/%d %H:%M:%S",
            "%Y/%m/%d %H:%M",
            "%m/%d/%Y %H:%M:%S",
            "%m/%d/%Y %H:%M",
            "%Y-%m-%d",
        ]

        for date_format in formats:
            try:
                parsed = datetime.strptime(value, date_format)
                break
            except ValueError:
                continue

    if parsed is None:
        raise ValueError(f"invalid recorded_at date: {value}")

    # Store timestamps consistently without timezone information.
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)

    return parsed


def import_episodes(db: Session, file_path: str):
    imported = 0
    skipped = 0
    reasons = []

    with open(
        file_path,
        "r",
        encoding="utf-8-sig",
        newline="",
    ) as file:
        reader = csv.DictReader(file)

        if not reader.fieldnames:
            raise ValueError("CSV file has no header")

        required_columns = {
            "episode_id",
            "robot_id",
            "task_name",
            "recorded_at",
            "duration_seconds",
            "operator_name",
            "quality",
        }

        missing_columns = required_columns - set(reader.fieldnames)

        if missing_columns:
            raise ValueError(
                "CSV is missing required columns: "
                + ", ".join(sorted(missing_columns))
            )

        for row_number, row in enumerate(reader, start=2):
            try:
                # None means the CSV row had more columns than the header.
                if None in row:
                    raise ValueError("malformed CSV row")

                episode_id = (row.get("episode_id") or "").strip()

                robot_id = (
                    row.get("robot_id") or ""
                ).strip().lower()

                task_name = " ".join(
                    (row.get("task_name") or "")
                    .strip()
                    .lower()
                    .split()
                )

                recorded_at_value = (
                    row.get("recorded_at") or ""
                ).strip()

                duration_value = (
                    row.get("duration_seconds") or ""
                ).strip()

                operator_name = (
                    row.get("operator_name") or ""
                ).strip()

                quality = (
                    row.get("quality") or ""
                ).strip().lower()

                # Required-field validation.
                if not episode_id:
                    raise ValueError("missing episode_id")

                if not robot_id:
                    raise ValueError("missing robot_id")

                if not task_name:
                    raise ValueError("missing task_name")

                if not recorded_at_value:
                    raise ValueError("missing recorded_at")

                if not duration_value:
                    raise ValueError("missing duration_seconds")

                if not operator_name:
                    raise ValueError("missing operator_name")

                # Validate robot.
                if robot_id not in KNOWN_ROBOTS:
                    raise ValueError(
                        f"unknown robot: {robot_id}"
                    )

                # Validate quality according to the original requirements.
                if quality not in VALID_QUALITY:
                    raise ValueError(
                        f"invalid quality: {quality}"
                    )

                # Duration must be an integer.
                duration_seconds = int(duration_value)

                if duration_seconds < 0:
                    raise ValueError("negative duration")

                # Parse the recorded date.
                recorded_at = parse_recorded_at(
                    recorded_at_value
                )

                # Idempotency:
                # If this episode already exists, don't insert it again.
                existing = (
                    db.query(Episode)
                    .filter(
                        Episode.episode_id == episode_id
                    )
                    .first()
                )

                if existing:
                    skipped += 1

                    reasons.append(
                        {
                            "row": row_number,
                            "episode_id": episode_id,
                            "reason": "duplicate episode_id",
                        }
                    )

                    continue

                episode = Episode(
                    episode_id=episode_id,
                    robot_id=robot_id,
                    task_name=task_name,
                    recorded_at=recorded_at,
                    duration_seconds=duration_seconds,
                    operator_name=operator_name,
                    quality=quality,
                )

                # Savepoint allows one bad row to fail without
                # rolling back successful rows from the import.
                with db.begin_nested():
                    db.add(episode)
                    db.flush()

                imported += 1

            except IntegrityError:
                skipped += 1

                reasons.append(
                    {
                        "row": row_number,
                        "reason": "duplicate episode_id",
                    }
                )

            except (ValueError, TypeError) as exc:
                skipped += 1

                reasons.append(
                    {
                        "row": row_number,
                        "reason": str(exc),
                    }
                )

    db.commit()

    return {
        "imported": imported,
        "skipped": skipped,
        "reasons": reasons,
    }