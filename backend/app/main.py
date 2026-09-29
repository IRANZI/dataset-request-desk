from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.requests import router as requests_router
from app.routers.episodes import router as episodes_router
from app.routers.analytics import router as analytics_router
from app.middleware import request_logging_middleware


app = FastAPI(
    title="Dataset Request Desk API",
    version="1.0.0",
)

app.middleware("http")(
    request_logging_middleware
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(requests_router)
app.include_router(episodes_router)
app.include_router(analytics_router)


@app.get("/health")
def health_check():
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "dataset-request-desk-api",
        }
    )