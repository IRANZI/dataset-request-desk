from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hash a plain-text password."""
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Check whether a password matches its stored hash."""
    return pwd_context.verify(password, password_hash)


def create_access_token(user_id: int) -> str:
    """Create a JWT containing the user's ID."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )

    payload = {
        "sub": str(user_id),
        "exp": expire,
    }

    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=ALGORITHM,
    )


def decode_access_token(token: str) -> int:
    """Decode a JWT and return the user ID."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise ValueError("Token does not contain a user ID")

        return int(user_id)

    except (JWTError, ValueError) as exc:
        raise ValueError("Invalid or expired token") from exc