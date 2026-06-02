from bs4 import BeautifulSoup
import httpx
import io

def extract_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file using PyMuPDF."""
    import fitz  # lazy import - only needed for PDF
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text.strip()

def extract_from_image(file_bytes: bytes) -> str:
    """Extracts text from an image using PaddleOCR."""
    try:
        from paddleocr import PaddleOCR  # lazy import - only needed for images
        import numpy as np
        from PIL import Image

        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        img_array = np.array(img)
        result = ocr.ocr(img_array, cls=True)
        text = ""
        if result:
            for idx in range(len(result)):
                res = result[idx]
                if res:
                    for line in res:
                        text += line[1][0] + "\n"
        return text.strip()
    except Exception as e:
        raise RuntimeError(f"OCR failed: {str(e)}")

async def extract_from_url(url: str) -> str:
    """Scrapes text from a URL using httpx."""
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        response = await client.get(url)
        response.raise_for_status()
        html_content = response.text

    soup = BeautifulSoup(html_content, 'html.parser')

    # Remove script and style elements
    for script in soup(["script", "style", "nav", "footer", "header"]):
        script.extract()

    text = soup.get_text(separator=' ')

    # collapse whitespace
    lines = (line.strip() for line in text.splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    text = '\n'.join(chunk for chunk in chunks if chunk)

    return text
