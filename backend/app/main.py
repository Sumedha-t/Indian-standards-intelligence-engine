from fastapi import FastAPI

app = FastAPI(title="Indian Standards Intelligence Engine")


@app.get("/health")
def health():
    return {"status": "ok"}
    