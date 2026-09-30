import pytest

from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
from app.models import Assignment


@pytest.fixture(autouse=True)
def clean_assignments():
    """
    Clear episode assignments before every test.

    The tests share the same database, so without this cleanup,
    one test can consume an episode that another test needs.
    """

    db = SessionLocal()

    try:
        db.query(Assignment).delete(
            synchronize_session=False
        )
        db.commit()
    finally:
        db.close()

    yield

    db = SessionLocal()

    try:
        db.query(Assignment).delete(
            synchronize_session=False
        )
        db.commit()
    finally:
        db.close()


@pytest.fixture
def client():
    return TestClient(app)