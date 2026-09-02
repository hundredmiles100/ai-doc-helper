def extract_text_from_pdf(file_path: str):
    text = ""
    pages = 0
    try:
        import fitz
        doc = fitz.open(file_path)
        pages = len(doc)
        parts = []
        for page in doc:
            parts.append(page.get_text())
        text = "\n".join(parts)
        if len(text.strip()) > 50:
            return text, pages
    except Exception as e:
        print(f"fitz failed: {e}")

    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(file_path)
        pages = len(reader.pages)
        parts = []
        for p in reader.pages:
            try:
                parts.append(p.extract_text() or "")
            except:
                parts.append("")
        text = "\n".join(parts)
    except Exception as e:
        print(f"pypdf failed: {e}")

    return text, pages
