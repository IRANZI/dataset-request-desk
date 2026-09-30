import subprocess
import sys


def run_command(command):
    subprocess.run(command, check=True)


if __name__ == "__main__":
    # Apply database migrations before starting the API.
    run_command(["alembic", "upgrade", "head"])

    # Create the demo users if they do not already exist.
    run_command([sys.executable, "-m", "app.seed"])

    # Start the FastAPI server.
    run_command(
        [
            "uvicorn",
            "app.main:app",
            "--host",
            "0.0.0.0",
            "--port",
            "8000",
        ]
    )