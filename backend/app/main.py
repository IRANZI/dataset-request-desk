
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.middleware import request_logging_middleware
from app.routers.analytics import router as analytics_router
from app.routers.auth import router as auth_router
from app.routers.episodes import router as episodes_router
from app.routers.requests import router as requests_router
from app.routers.users import router as users_router


app = FastAPI(
    title="Dataset Request Desk API",
    version="1.0.0",
)


# Comma-separated origins can be provided through the environment.
# Local development remains supported by default.
cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

cors_origins = [
    origin.strip()
    for origin in cors_origins
    if origin.strip()
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(requests_router)
app.include_router(episodes_router)
app.include_router(analytics_router)

app.middleware("http")(request_logging_middleware)


@app.get("/health")
def health_check():
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "dataset-request-desk-api",
        }
    )
