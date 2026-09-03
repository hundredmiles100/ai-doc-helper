import json
import re
from ..config import OPENAI_API_KEY, OPENAI_MODEL, OPENAI_BASE_URL

USE_MOCK = not OPENAI_API_KEY or OPENAI_API_KEY.strip() == ""
client = None

if not USE_MOCK:
    try:
        from openai import OpenAI
        kwargs = {"api_key": OPENAI_API_KEY}
        if OPENAI_BASE_URL and OPENAI_BASE_URL.strip():
            kwargs["base_url"] = OPENAI_BASE_URL.strip()
        client = OpenAI(**kwargs)
    except Exception as e:
        print(f"openai init failed: {e}")
        USE_MOCK = True

SYSTEM = "You are a thorough, detailed document assistant for students. Be comprehensive and explanatory — give in-depth answers with examples, context and structured tables. Always return readable markdown with headings, bullet lists and GFM tables. Avoid overly brief replies."

LANG_NAMES = {"en":"English","hi":"Hindi","es":"Spanish","fr":"French","de":"German","ja":"Japanese","zh":"Chinese","pt":"Portuguese","ru":"Russian","ar":"Arabic","bn":"Bengali","te":"Telugu","ta":"Tamil","mr":"Marathi","gu":"Gujarati","kn":"Kannada","pa":"Punjabi","ur":"Urdu","it":"Italian","ko":"Korean","tr":"Turkish"}

def _lang_suffix(lang: str):
    if not lang or lang.lower() == "en":
        return ""
    name = LANG_NAMES.get(lang.lower(), lang)
    return f" Respond entirely in {name} ({lang}) language. Use {name} for all headings, tables and explanations."

def _lang_system(lang: str, base=SYSTEM):
    s = _lang_suffix(lang)
    return base + s if s else base

def _call(prompt: str, system=SYSTEM, max_tokens=2200):
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
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return [p.strip() for p in parts if len(p.strip()) > 20][:20]

def _mock_summarize(text, length):
    sents = _sentences(text)
    if not sents:
        return f"### Summary\n\nNo readable text found. Document length: {len(text)} chars. (Add OPENAI_API_KEY for AI summary)"
    if length == "short":
        picks = sents[:3]
    elif length == "detailed":
        picks = sents[:8]
    else:
        picks = sents[:5]
    bullets = "\n".join([f"- {s[:180]}" for s in picks])
    table = f"""| Property | Value |
|----------|-------|
| Length | {len(text)} characters |
| Sentences | {len(sents)} |
| Pages | approx. {max(1, len(text)//2000)} |
| Mode | Local extraction |
"""
    return f"""# Summary ({length})

{table}

## Key Points
{bullets}

---
*Local summary — add `OPENAI_API_KEY` for AI-powered summary.*
"""

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
        rows = "\n".join([f"| {i+1} | {b[:150].replace('|',' ')} | { 'high' if i==0 else 'medium'} |" for i, b in enumerate(best)])
        table = f"""| # | Relevant Excerpt | Relevance |
|---|------------------|-----------|
{rows}
"""
        return f"""## Answer — {question}

{table}

### Explanation
Based on keyword overlap with your document. The excerpts above are the closest matches found locally.

---
*Local answer — add `OPENAI_API_KEY` for full AI Q&A with reasoning.*
"""
    preview = " ".join(sents[:2])[:500] if sents else text[:500]
    table = f"""| Property | Value |
|----------|-------|
| Question | {question} |
| Result | No direct match found |
| Preview | {preview[:120].replace('|',' ')}... |
"""
    return f"""## Answer — {question}

{table}

### Document Preview
> {preview}

*Try rephrasing or add `OPENAI_API_KEY` for AI Q&A.*
"""

def _mock_extract(text):
    sents = _sentences(text)
    key_points = sents[:5] if sents else [text[:150]]
    caps = re.findall(r'\b[A-Z][a-z]+(?:\s[A-Z][a-z]+){0,2}\b', text)
    entities = list(dict.fromkeys(caps))[:8]
    dates = re.findall(r'\b(?:19|20)\d{2}\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b', text)[:5]
    summary = " ".join(sents[:3])[:400] if sents else text[:300]
    return {"key_points": key_points, "entities": entities, "dates": dates, "summary": summary}

def _mock_compare(t1, t2):
    s1 = _sentences(t1)
    s2 = _sentences(t2)
    return f"""# Document Comparison (Local)

| Aspect | Document 1 | Document 2 |
|--------|------------|------------|
| Length | {len(t1)} chars | {len(t2)} chars |
| Sentences | {len(s1)} | {len(s2)} |
| Avg sentence | {round(len(t1)/max(1,len(s1)))} chars | {round(len(t2)/max(1,len(s2)))} chars |
| Preview | {(' '.join(s1[:1])[:120].replace('|',' ') if s1 else t1[:120])}... | {(' '.join(s2[:1])[:120].replace('|',' ') if s2 else t2[:120])}... |

## Analysis

### Similarities
- Both are text-based PDFs
- Both contain similar sentence structure

### Differences
- **Size:** Document {'1' if len(t1)>len(t2) else '2'} is larger
- **Content focus:** Different vocabulary sets

---
*Local comparison — add `OPENAI_API_KEY` for AI-powered semantic comparison.*
"""

def _mock_notes(text):
    sents = _sentences(text)
    if not sents:
        return f"# Notes\n\nNo extractable text.\n\n*Add `OPENAI_API_KEY` for AI notes.*"
    bullets = "\n".join([f"- {s[:160]}" for s in sents[:6]])
    terms = re.findall(r'\b[A-Z][a-z]{3,}\b', text)
    terms = list(dict.fromkeys(terms))[:8]
    if terms:
        rows = "\n".join([f"| {t} | appears in document, relevant term |" for t in terms])
        term_table = f"""| Term | Context |
|------|---------|
{rows}
"""
    else:
        term_table = "| Term | Context |\n|------|---------|\n| — | No distinct capitalized terms found |"
    summary = ' '.join(sents[:3])[:500]
    table = f"""| Stat | Value |
|------|-------|
| Total sentences | {len(sents)} |
| Document length | {len(text)} chars |
"""
    return f"""# Study Notes (Local)

{table}

## Key Takeaways
{bullets}

## Important Terms

{term_table}

## Summary

{summary}

---

*Generated locally without AI. Add `OPENAI_API_KEY` for smarter, structured notes with tables.*
"""

def _mock_quiz(text, n):
    sents = _sentences(text)
    questions = []
    for i in range(min(n, len(sents))):
        sent = sents[i][:120]
        words = sent.split()
        if len(words) < 5:
            continue
        keyword = None
        for w in words:
            if len(w) > 5 and w[0].isupper():
                keyword = w.strip('.,!?')
                break
        if not keyword:
            keyword = words[len(words)//2].strip('.,!?')
        q_text = sent.replace(keyword, "_____", 1) if keyword in sent else f"What does this mean: '{sent[:60]}...'?"
        other_words = [w.strip('.,!?') for s in sents for w in s.split() if len(w)>4][:10]
        opts = [keyword]
        for w in other_words:
            if w != keyword and len(opts) < 4:
                opts.append(w)
        while len(opts) < 4:
            opts.append(f"Option {len(opts)+1}")
        questions.append({
            "question": f"Fill in the blank: {q_text}" if "_____" in q_text else q_text,
            "options": opts[:4],
            "correct_index": 0,
            "explanation": f"Answer is '{keyword}' from document."
        })
    while len(questions) < n:
        questions.append({
            "question": f"What is mentioned in the document? (Q{len(questions)+1})",
            "options": [sents[0][:30] if sents else "Content A", "Option B", "Option C", "Option D"],
            "correct_index": 0,
            "explanation": "Based on document text."
        })
    return questions[:n]

def mock(prompt: str):
    low = prompt.lower()
    if "summarize" in low:
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

def summarize_text(text: str, length="medium", lang: str = "en"):
    if USE_MOCK:
        return _mock_summarize(text, length)
    t = text[:15000]
    instr = {"short":"in 150-200 words with 5-6 detailed bullets and examples","medium":"in 350-500 words with detailed bullets, tables and examples","detailed":"in 700-900 words comprehensive, with sections, tables, examples and thorough takeaways"}.get(length,"in 350-500 words with detailed bullets, tables and examples")
    suffix = _lang_suffix(lang)
    prompt = f"Summarize this document {instr}. Be thorough, not brief. Return markdown with: # Summary, a detailed table (| Property | Value |) with stats (word count, themes, purpose), ## Key Points (7-10 detailed bullets with explanations), ## Detailed Analysis, and ## Takeaway. Use tables where helpful.{suffix}\n\n---\n{t}\n---"
    system = _lang_system(lang)
    return _call(prompt, system=system, max_tokens=1800 if length!="detailed" else 2600)

def answer_question(text: str, question: str, lang: str = "en"):
    if USE_MOCK:
        return _mock_answer(text, question)
    t = text[:15000]
    suffix = _lang_suffix(lang)
    prompt = f"Document:\n{t}\n\nQuestion: {question}\n\nAnswer THOROUGHLY and in detail based only on the document. If not found, say so but suggest related context. Be comprehensive: use 300-500 words, examples, step-by-step explanations, and markdown with ## Answer heading, bullet lists, and a table (| Aspect | Details |) where helpful. Do NOT give a brief 2-3 line answer. Use simple language but be in-depth.{suffix}"
    system = _lang_system(lang, base="You are a thorough, patient teaching assistant. Explain in depth with examples and structure. Always use detailed markdown with tables and headings. Avoid short answers.")
    return _call(prompt, system=system, max_tokens=2200)

def extract_info(text: str, lang: str = "en"):
    if USE_MOCK:
        return _mock_extract(text)
    t = text[:12000]
    suffix = _lang_suffix(lang)
    prompt = f"Extract info from this doc. Return JSON with keys: key_points (5-7 strings), entities, dates, summary. Keep values in original doc language but summary in {LANG_NAMES.get(lang.lower(), lang) if lang.lower()!='en' else 'English'}.{suffix}\n\nDoc:\n{t}\n\nReturn ONLY valid JSON."
    raw = _call(prompt, system=_lang_system(lang), max_tokens=800)
    try:
        s = raw.find("{"); e = raw.rfind("}")+1
        if s!=-1:
            return json.loads(raw[s:e])
        return json.loads(raw)
    except:
        return {"key_points":[raw[:200]],"entities":[],"dates":[],"summary":raw[:400]}

def compare_docs(t1: str, t2: str, lang: str = "en"):
    if USE_MOCK:
        return _mock_compare(t1, t2)
    suffix = _lang_suffix(lang)
    prompt = f"Compare these two docs IN DEPTH. Return markdown with # Comparison, a detailed table | Aspect | Document 1 | Document 2 | (use 6-8 rows: purpose, key topics, methodology, findings, tone), then ## Similarities (5-7 detailed bullets) and ## Differences (5-7 detailed bullets) and ## Verdict. Be thorough, 400-600 words.{suffix}\n\nDoc1:\n{t1[:8000]}\n\nDoc2:\n{t2[:8000]}"
    return _call(prompt, system=_lang_system(lang), max_tokens=2000)

def generate_notes(text: str, lang: str = "en"):
    if USE_MOCK:
        return _mock_notes(text)
    suffix = _lang_suffix(lang)
    prompt = f"Create DETAILED study notes from this doc (400-600 words). Use markdown: # Title, a stats table (| Stat | Value |), ## Key Takeaways (8-10 detailed bullets with explanations), ## Important Terms table (| Term | Definition | 6-10 rows), ## Summary (150+ words), ## Revision Questions (3-5). Be comprehensive and student-friendly, use tables.{suffix}\n\nDoc:\n{text[:15000]}"
    return _call(prompt, system=_lang_system(lang), max_tokens=2200)

def generate_quiz(text: str, n=5, lang: str = "en"):
    if USE_MOCK:
        return _mock_quiz(text, n)
    suffix = _lang_suffix(lang)
    prompt = f"Generate {n} MCQ quiz questions from this doc. Return ONLY JSON array with fields: question, options (4 strings), correct_index (0-3), explanation. Questions and options in {LANG_NAMES.get(lang.lower(), lang) if lang.lower()!='en' else 'English'}.{suffix}\n\nDoc:\n{text[:10000]}"
    raw = _call(prompt, system=_lang_system(lang), max_tokens=1200)
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
