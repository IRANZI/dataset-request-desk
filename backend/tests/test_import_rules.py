from app.services.import_service import (
    KNOWN_ROBOTS,
    VALID_QUALITY,
)


def test_quality_values_match_dataset():
    assert VALID_QUALITY == {"good", "bad"}


def test_known_robots():
    assert "arm-01" in KNOWN_ROBOTS
    assert "mobile-01" in KNOWN_ROBOTS
    assert "humanoid-01" in KNOWN_ROBOTS