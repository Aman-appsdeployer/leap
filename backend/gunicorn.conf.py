# gunicorn.conf.py

bind = "209.182.233.188:8000"  # Use 127.0.0.1:8000 if behind nginx proxy

workers = 4  # Number of worker processes
worker_class = "uvicorn.workers.UvicornWorker"  # For FastAPI/async


# Optional (but good to include)
timeout = 120
loglevel = "info"
