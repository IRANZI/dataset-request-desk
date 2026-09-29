import csv
from datetime import datetime

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

VALID_QUALITY = {
    "good",
    "usable",
    "bad",
}


def import_episodes(
    db: Session,
    file_path: str,
):
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

        for row_number, row in enumerate(
            reader,
            start=2,
        ):
            try:
                episode_id = (
                    row.get("episode_id") or ""
                ).strip()

                robot_id = (
                    row.get("robot_id") or ""
                ).strip()

                task_name = (
                    row.get("task_name") or ""
                ).strip()

                recorded_at = (
                    row.get("recorded_at") or ""
                ).strip()

                duration = (
                    row.get("duration_seconds") or ""
                ).strip()

                operator_name = (
                    row.get("operator_name") or ""
                ).strip()

                quality = (
                    row.get("quality") or ""
                ).strip().lower()

                if not episode_id:
                    raise ValueError(
                        "missing episode_id"
                    )

                if not robot_id:
                    raise ValueError(
                        "missing robot_id"
                    )

                if robot_id not in KNOWN_ROBOTS:
                    raise ValueError(
                        f"unknown robot: {robot_id}"
                    )

                if not task_name:
                    raise ValueError(
                        "missing task_name"
                    )

                if quality not in VALID_QUALITY:
                    raise ValueError(
                        f"invalid quality: {quality}"
                    )

                duration_seconds = int(duration)

                if duration_seconds < 0:
                    raise ValueError(
                        "negative duration"
                    )

                parsed_date = datetime.fromisoformat(
                    recorded_at.replace("Z", "+00:00")
                )

                existing = (
                    db.query(Episode)
                    .filter(
                        Episode.episode_id
                        == episode_id
                    )
                    .first()
                )

                if existing:
                    skipped += 1
                    reasons.append({
                        "row": row_number,
                        "reason": "duplicate episode_id",
                        "episode_id": episode_id,
                    })
                    continue

                episode = Episode(
                    episode_id=episode_id,
                    robot_id=robot_id,
                    task_name=task_name,
                    recorded_at=parsed_date,
                    duration_seconds=duration_seconds,
                    operator_name=operator_name,
                    quality=quality,
                )

                db.add(episode)
                db.flush()

                imported += 1

            except Exception as exc:
                db.rollback()

                skipped += 1

                reasons.append({
                    "row": row_number,
                    "reason": str(exc),
                })

    db.commit()

    return {
        "imported": imported,
        "skipped": skipped,
        "reasons": reasons,
    }