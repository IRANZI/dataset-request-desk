from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.requests import router as requests_router


app = FastAPI(
    title="Dataset Request Desk API",
    version="1.0.0",
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(requests_router)


@app.get("/health")
def health_check():
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "dataset-request-desk-api",
        }
    )