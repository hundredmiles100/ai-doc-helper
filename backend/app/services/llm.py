import json
import re
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

def _sentences(text):
    # naive split, clean
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p.strip() for p in parts if len(p.strip()) > 20][:20]

def _mock_summarize(text, length):
    sents = _sentences(text)
    if not sents:
        return f"No readable text found. Document length: {len(text)} chars. (Add OPENAI_API_KEY for AI summary)"
    if length == "short":
        picks = sents[:3]
    elif length == "detailed":
        picks = sents[:8]
    else:
        picks = sents[:5]
    bullets = "\n".join([f"- {s[:180]}" for s in picks])
    prefix = f"Summary ({length}) — extracted from actual document ({len(text)} chars, {len(sents)} sentences):\n\n"
    suffix = "\n\n*Local summary (no API key). Add OPENAI_API_KEY for AI-powered summary.*"
    return prefix + bullets + suffix

def _mock_answer(text, question):
    sents = _sentences(text)
    qwords = set(re.findall(r'\w+', question.lower()))
    qwords = {w for w in qwords if len(w) > 3}
    scored = []
    for s in sents:
        sw = set(re.findall(r'\w+', s.lower()))
        overlap = len(qwords & sw)
        scored.append((overlap, s))
    scored.sort(reverse=True, key=lambda x: x[0])
    if scored and scored[0][0] > 0:
        best = [s for _, s in scored[:3] if _]
        return f"Based on your document (local search, no API key needed for demo):\n\nQ: {question}\n\nRelevant excerpts:\n- " + "\n- ".join([b[:200] for b in best]) + "\n\n*Add OPENAI_API_KEY for full AI answer.*"
    # fallback - return first few sents
    preview = " ".join(sents[:2])[:500] if sents else text[:500]
    return f"Local answer (no API key): Could not find direct match for '{question}'. Here's the document preview:\n\n{preview}\n\n*Try rephrasing or add OPENAI_API_KEY for AI Q&A.*"

def _mock_extract(text):
    sents = _sentences(text)
    key_points = sents[:5] if sents else [text[:150]]
    # naive entities: capitalized words
    caps = re.findall(r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}\b', text)
    entities = list(dict.fromkeys(caps))[:8]
    dates = re.findall(r'\b(?:19|20)\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', text)[:5]
    summary = " ".join(sents[:3])[:400] if sents else text[:300]
    return {"key_points": key_points, "entities": entities, "dates": dates, "summary": summary}

def _mock_compare(t1, t2):
    s1 = _sentences(t1)
    s2 = _sentences(t2)
    return f"Comparison (local, no API key):\n\nDocument 1: {len(t1)} chars, {len(s1)} sentences. Preview: { ' '.join(s1[:2])[:250] if s1 else t1[:250]}\n\nDocument 2: {len(t2)} chars, {len(s2)} sentences. Preview: { ' '.join(s2[:2])[:250] if s2 else t2[:250]}\n\nSimilarities: Both are PDFs with text content.\nDifferences: Doc1 is {'longer' if len(t1)>len(t2) else 'shorter'} than Doc2.\n\n*Add OPENAI_API_KEY for AI-powered comparison.*"

def _mock_notes(text):
    sents = _sentences(text)
    if not sents:
        return f"# Notes\n\nNo extractable text.\n\n*Add OPENAI_API_KEY for AI notes.*"
    bullets = "\n".join([f"- {s[:160]}" for s in sents[:6]])
    terms = re.findall(r'\b[A-Z][a-z]{3,}\b', text)
    terms = list(dict.fromkeys(terms))[:6]
    terms_md = "\n".join([f"- **{t}**: appears in document" for t in terms]) if terms else "- No distinct terms found"
    preview = text[:800]
    return f"# Study Notes (local)\n\n## Key Takeaways\n{bullets}\n\n## Important Terms\n{terms_md}\n\n## Summary\n{' '.join(sents[:3])[:500]}\n\n*Generated locally without AI. Add OPENAI_API_KEY for smarter notes.*"

def _mock_quiz(text, n):
    sents = _sentences(text)
    # generate from actual sentences
    questions = []
    for i in range(min(n, len(sents))):
        sent = sents[i][:120]
        # create simple question from sentence
        words = sent.split()
        if len(words) < 5:
            continue
        # pick a keyword to blank
        keyword = None
        for w in words:
            if len(w) > 5 and w[0].isupper():
                keyword = w.strip('.,!?')
                break
        if not keyword:
            keyword = words[len(words)//2].strip('.,!?')
        q_text = sent.replace(keyword, "_____", 1) if keyword in sent else f"What does this mean: '{sent[:60]}...'?"
        # options: keyword + distractors from other words
        other_words = [w.strip('.,!?') for s in sents for w in s.split() if len(w)>4][:10]
        opts = [keyword]
        for w in other_words:
            if w != keyword and len(opts) < 4:
                opts.append(w)
        while len(opts) < 4:
            opts.append(f"Option {len(opts)+1}")
        # shuffle deterministically but keep correct at 0 for simplicity, then rotate?
        # keep correct_index 0 for now, but frontend handles any
        questions.append({
            "question": f"Fill in the blank: {q_text}" if "_____" in q_text else q_text,
            "options": opts[:4],
            "correct_index": 0,
            "explanation": f"Answer is '{keyword}' from document."
        })
    # fallback if not enough sents
    while len(questions) < n:
        questions.append({
            "question": f"What is mentioned in the document? (Q{len(questions)+1})",
            "options": [sents[0][:30] if sents else "Content A", "Option B", "Option C", "Option D"],
            "correct_index": 0,
            "explanation": "Based on document text."
        })
    return questions[:n]

def mock(prompt: str):
    # fallback old behavior for direct _call without text context
    low = prompt.lower()
    if "summarize" in low:
        # try extract text between --- or after
        m = re.search(r'---\n(.*?)\n---', prompt, re.S)
        txt = m.group(1) if m else prompt
        return _mock_summarize(txt, "medium")
    if "quiz" in low or "mcq" in low or "multiple choice" in low:
        m = re.search(r'Doc:\n(.*)', prompt, re.S)
        txt = m.group(1) if m else prompt
        return json.dumps(_mock_quiz(txt, 5))
    if "compare" in low:
        return "Mock comparison - add API key for AI. (fallback)"
    if "extract" in low:
        m = re.search(r'Doc:\n(.*)', prompt, re.S)
        txt = m.group(1) if m else prompt
        return json.dumps(_mock_extract(txt))
    if "notes" in low:
        m = re.search(r'Doc:\n(.*)', prompt, re.S)
        txt = m.group(1) if m else prompt
        return _mock_notes(txt)
    return f"Local answer (no API key): {prompt[:200]}..."

def summarize_text(text: str, length="medium"):
    if USE_MOCK:
        return _mock_summarize(text, length)
    t = text[:12000]
    instr = {"short":"in 3-4 bullets very concise","medium":"in 200-300 words with bullets","detailed":"in detail ~500 words"}.get(length,"in 200-300 words")
    prompt = f"Summarize this document {instr}:\n\n---\n{t}\n---"
    return _call(prompt, max_tokens=700 if length!="detailed" else 1100)

def answer_question(text: str, question: str):
    if USE_MOCK:
        return _mock_answer(text, question)
    t = text[:10000]
    prompt = f"Document:\n{t}\n\nQuestion: {question}\n\nAnswer based only on doc. If not found say so. Simple language."
    return _call(prompt, system="You are a helpful teaching assistant. Explain simply.")

def extract_info(text: str):
    if USE_MOCK:
        return _mock_extract(text)
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
    if USE_MOCK:
        return _mock_compare(t1, t2)
    prompt = f"Compare these two docs - similarities, differences, which more detailed. Be structured.\n\nDoc1:\n{t1[:7000]}\n\nDoc2:\n{t2[:7000]}"
    return _call(prompt, max_tokens=900)

def generate_notes(text: str):
    if USE_MOCK:
        return _mock_notes(text)
    prompt = f"Create study notes from this doc. Use markdown headings, bullets, key terms, summary. Student-friendly.\n\nDoc:\n{text[:12000]}"
    return _call(prompt, max_tokens=1000)

def generate_quiz(text: str, n=5):
    if USE_MOCK:
        return _mock_quiz(text, n)
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
