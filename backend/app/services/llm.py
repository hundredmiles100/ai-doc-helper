import json
from ..config import OPENAI_API_KEY, OPENAI_MODEL

USE_MOCK = not OPENAI_API_KEY or OPENAI_API_KEY.strip() == ""
client = None

if not USE_MOCK:
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
    except Exception as e:
        print(f"openai init failed: {e}")
        USE_MOCK = True

SYSTEM = "You are a helpful document assistant for students. Be concise and accurate."

def _call(prompt: str, system=SYSTEM, max_tokens=1200):
    if USE_MOCK:
        return mock(prompt)
    try:
        r = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[{"role":"system","content":system},{"role":"user","content":prompt}],
            temperature=0.4,
            max_tokens=max_tokens
        )
        return r.choices[0].message.content
    except Exception as e:
        print(f"llm error: {e}")
        return mock(prompt)

def mock(prompt: str):
    low = prompt.lower()
    if "summarize" in low:
        return "Mock Summary: This document covers the main topics concisely. Key themes include intro, core concepts, findings and conclusion. (Add OPENAI_API_KEY for real AI summaries.)\n\n- Overview of content\n- Important details extracted\n- Conclusion and takeaways"
    if "quiz" in low or "mcq" in low or "multiple choice" in low:
        return json.dumps([
            {"question":"What is the main topic?","options":["History","Science","Based on uploaded content","None"],"correct_index":2,"explanation":"mock - add api key for real"},
            {"question":"Which section was most detailed?","options":["Intro","Methods","Chapter 4","Conclusion"],"correct_index":2,"explanation":"mock"},
            {"question":"Does doc contain structured info?","options":["True","False"],"correct_index":0,"explanation":"mock"},
            {"question":"What is purpose of notes?","options":["Revision","Fun","Delete","None"],"correct_index":0,"explanation":"mock"},
            {"question":"Quiz generated from?","options":["Doc text","Random","Web","None"],"correct_index":0,"explanation":"mock"},
        ])
    if "compare" in low:
        return "Mock Comparison:\n\nDocument 1 focuses on intro/background.\nDocument 2 has more examples/applications.\n\nSimilarities: Both cover core subject.\nDifferences: Doc2 more practical, Doc1 theoretical.\n\n(Add API key for real comparison)"
    if "extract" in low:
        return json.dumps({"key_points":["Important point 1","Key finding 2","Conclusion 3"],"entities":["Entity A","Entity B"],"dates":["2024"],"summary":"Mock extracted summary"})
    if "notes" in low:
        return "# Mock Notes\n\n## Key Takeaways\n- Main idea 1\n- Detail 2\n- Example 3\n\n## Terms\n- Term A: definition\n- Term B: definition\n\n*(add OPENAI_API_KEY for real notes)*"
    return f"Mock Answer (add OPENAI_API_KEY for real AI): Based on the document, relevant info is present. Preview: {prompt[:120]}..."

def summarize_text(text: str, length="medium"):
    t = text[:12000]
    instr = {"short":"in 3-4 bullets very concise","medium":"in 200-300 words with bullets","detailed":"in detail ~500 words"}.get(length,"in 200-300 words")
    prompt = f"Summarize this document {instr}:\n\n---\n{t}\n---"
    return _call(prompt, max_tokens=700 if length!="detailed" else 1100)

def answer_question(text: str, question: str):
    t = text[:10000]
    prompt = f"Document:\n{t}\n\nQuestion: {question}\n\nAnswer based only on doc. If not found say so. Simple language."
    return _call(prompt, system="You are a helpful teaching assistant. Explain simply.")

def extract_info(text: str):
    t = text[:12000]
    prompt = f"Extract info from this doc. Return JSON with keys: key_points (5-7 strings), entities, dates, summary.\n\nDoc:\n{t}\n\nReturn ONLY valid JSON."
    raw = _call(prompt, max_tokens=800)
    try:
        s = raw.find("{"); e = raw.rfind("}")+1
        if s!=-1:
            return json.loads(raw[s:e])
        return json.loads(raw)
    except:
        return {"key_points":[raw[:200]],"entities":[],"dates":[],"summary":raw[:400]}

def compare_docs(t1: str, t2: str):
    prompt = f"Compare these two docs - similarities, differences, which more detailed. Be structured.\n\nDoc1:\n{t1[:7000]}\n\nDoc2:\n{t2[:7000]}"
    return _call(prompt, max_tokens=900)

def generate_notes(text: str):
    prompt = f"Create study notes from this doc. Use markdown headings, bullets, key terms, summary. Student-friendly.\n\nDoc:\n{text[:12000]}"
    return _call(prompt, max_tokens=1000)

def generate_quiz(text: str, n=5):
    prompt = f"Generate {n} MCQ quiz questions from this doc. Return ONLY JSON array with fields: question, options (4 strings), correct_index (0-3), explanation.\n\nDoc:\n{text[:10000]}"
    raw = _call(prompt, max_tokens=1200)
    try:
        s = raw.find("["); e = raw.rfind("]")+1
        if s!=-1:
            data = json.loads(raw[s:e])
            return data[:n]
        return json.loads(raw)[:n]
    except Exception as e:
        print(f"quiz parse fail {e}")
        try:
            data = json.loads(mock("quiz"))
            return data[:n]
        except:
            return []
