from app.auth.security import hash_password
from app.database import SessionLocal
from app.models import User


SEEDED_USERS = [
    {
        "email": "admin@example.com",
        "password": "admin123",
        "role": "admin",
        "name": "Ada Admin",
    },
    {
        "email": "ops1@example.com",
        "password": "ops123",
        "role": "operator",
        "name": "Olu Operator",
    },
    {
        "email": "ops2@example.com",
        "password": "ops123",
        "role": "operator",
        "name": "Odile Operator",
    },
    {
        "email": "client-a@example.com",
        "password": "client123",
        "role": "client",
        "name": "Acme Robotics",
        "organisation": "Acme Robotics",
    },
    {
        "email": "client-b@example.com",
        "password": "client123",
        "role": "client",
        "name": "Beta Labs",
        "organisation": "Beta Labs",
    },
]


def seed_users():
    db = SessionLocal()

    try:
        for user_data in SEEDED_USERS:
            existing_user = (
                db.query(User)
                .filter(User.email == user_data["email"])
                .first()
            )

            if existing_user:
                print(f"Skipping existing user: {user_data['email']}")
                continue

            user = User(
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                role=user_data["role"],
                name=user_data["name"],
                organisation=user_data.get("organisation"),
                is_active=True,
            )

            db.add(user)

        db.commit()
        print("User seeding completed successfully.")

    finally:
        db.close()


if __name__ == "__main__":
    seed_users()