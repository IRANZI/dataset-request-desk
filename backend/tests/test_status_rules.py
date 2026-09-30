from app.services.request_service import ALLOWED_TRANSITIONS


def test_valid_status_transitions():
    assert "in_progress" in ALLOWED_TRANSITIONS["submitted"]
    assert "delivered" in ALLOWED_TRANSITIONS["in_progress"]
    assert "accepted" in ALLOWED_TRANSITIONS["delivered"]
    assert "rejected" in ALLOWED_TRANSITIONS["delivered"]


def test_invalid_status_transitions():
    assert "accepted" not in ALLOWED_TRANSITIONS["submitted"]
    assert "delivered" not in ALLOWED_TRANSITIONS["submitted"]
    assert "submitted" not in ALLOWED_TRANSITIONS["accepted"]