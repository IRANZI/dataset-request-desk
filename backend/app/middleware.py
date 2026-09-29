import time
import logging

from fastapi import Request


logger = logging.getLogger("dataset_request_desk")


async def request_logging_middleware(
    request: Request,
    call_next,
):
    start = time.perf_counter()

    response = await call_next(request)

    duration = (
        time.perf_counter() - start
    )

    user_id = None

    logger.info(
        "request method=%s path=%s status=%s duration_ms=%.2f user_id=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration * 1000,
        user_id,
    )

    return response