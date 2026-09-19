import fitz


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF using PyMuPDF."""
    document = fitz.open(stream=file_bytes, filetype="pdf")

    try:
        pages = [page.get_text() for page in document]
        return "\n".join(pages).strip()
    finally:
        document.close()