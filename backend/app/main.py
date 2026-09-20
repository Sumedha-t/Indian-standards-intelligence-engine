from fastapi import FastAPI, File, HTTPException, UploadFile

from backend.app.schemas import AnalyzeRequest, AnalyzeResponse
from backend.app.services.analyzer import analyze_text
from backend.app.services.pdf_service import extract_text_from_pdf


app = FastAPI(
    title="Indian Standards Intelligence Engine",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest):
    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail={
                "code": "EMPTY_INPUT",
                "message": "Text input cannot be empty.",
                "details": [],
            },
        )

    try:
        return analyze_text(
            text=request.text,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_INPUT",
                "message": str(exc),
                "details": [],
            },
        )


@app.post("/analyze/pdf", response_model=AnalyzeResponse)
async def analyze_pdf(
    file: UploadFile = File(...),
    language: str = "en",
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "UNSUPPORTED_DOCUMENT",
                "message": "Only PDF documents are supported.",
                "details": [],
            },
        )

    try:
        file_bytes = await file.read()
        extracted_text = extract_text_from_pdf(file_bytes)

        if not extracted_text:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "DOCUMENT_PROCESSING_ERROR",
                    "message": "No readable text was extracted from the PDF.",
                    "details": [],
                },
            )

        return analyze_text(
            text=extracted_text,
        )

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "PROCESSING_ERROR",
                "message": str(exc),
                "details": [],
            },
        )