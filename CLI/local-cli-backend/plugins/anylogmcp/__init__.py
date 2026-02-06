import asyncio
import logging
import warnings

warnings.filterwarnings("ignore", message=".*Task exception was never retrieved.*")
logging.getLogger("httpx").setLevel(logging.ERROR)
logging.getLogger("httpcore").setLevel(logging.ERROR)

def custom_exception_handler(loop, context):
    exception = context.get("exception")
    
    if exception and "ReadError" in type(exception).__name__:
        return
    
    loop.default_exception_handler(context)

try:
    loop = asyncio.get_running_loop()
    loop.set_exception_handler(custom_exception_handler)
except RuntimeError:
    # Not in an async context yet, will be set when app starts
    pass
