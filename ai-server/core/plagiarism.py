import ast
import hashlib
import json
import os
import difflib
from typing import Optional
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")


# ─────────────────────────────────────────────
# 1. AST FINGERPRINTER
# ─────────────────────────────────────────────

class ASTFingerprinter(ast.NodeVisitor):
    def __init__(self):
        self.tokens = []

    def visit(self, node):
        node_type = type(node).__name__
        self.tokens.append(node_type)

        if isinstance(node, ast.FunctionDef):
            self.tokens.append(f"args:{len(node.args.args)}")
        elif isinstance(node, (ast.For, ast.While)):
            self.tokens.append("LOOP")
        elif isinstance(node, ast.If):
            self.tokens.append(f"IF_ELSE:{bool(node.orelse)}")
        elif isinstance(node, ast.Return):
            self.tokens.append("RETURN")
        elif isinstance(node, ast.BinOp):
            self.tokens.append(f"BINOP:{type(node.op).__name__}")
        elif isinstance(node, ast.Compare):
            ops = [type(op).__name__ for op in node.ops]
            self.tokens.append(f"CMP:{','.join(ops)}")
        elif isinstance(node, ast.Call):
            self.tokens.append(f"CALL:args={len(node.args)}")
        elif isinstance(node, ast.ListComp):
            self.tokens.append("LIST_COMP")
        elif isinstance(node, ast.Dict):
            self.tokens.append("DICT")
        elif isinstance(node, ast.List):
            self.tokens.append("LIST")
        elif isinstance(node, (ast.Import, ast.ImportFrom)):
            self.tokens.append("IMPORT")
        elif isinstance(node, ast.ClassDef):
            self.tokens.append(f"CLASS:bases={len(node.bases)}")
        elif isinstance(node, ast.Try):
            self.tokens.append("TRY_EXCEPT")
        elif isinstance(node, ast.Lambda):
            self.tokens.append("LAMBDA")
        elif isinstance(node, ast.Assert):
            self.tokens.append("ASSERT")

        self.generic_visit(node)

    def get_fingerprint(self) -> str:
        return " ".join(self.tokens)

    def get_hash(self) -> str:
        fp = self.get_fingerprint()
        return hashlib.md5(fp.encode()).hexdigest()


def extract_ast_fingerprint(code: str) -> dict:
    result = {
        "fingerprint": "",
        "hash": "",
        "parse_error": None,
        "metrics": {}
    }
    try:
        tree = ast.parse(code)
        visitor = ASTFingerprinter()
        visitor.visit(tree)

        result["fingerprint"] = visitor.get_fingerprint()
        result["hash"] = visitor.get_hash()
        result["metrics"] = {
            "num_functions": sum(1 for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)),
            "num_loops": sum(1 for n in ast.walk(tree) if isinstance(n, (ast.For, ast.While))),
            "num_conditionals": sum(1 for n in ast.walk(tree) if isinstance(n, ast.If)),
            "num_returns": sum(1 for n in ast.walk(tree) if isinstance(n, ast.Return)),
            "nesting_depth": _get_max_depth(tree),
            "uses_recursion": _check_recursion(tree),
            "list_comps": sum(1 for n in ast.walk(tree) if isinstance(n, ast.ListComp)),
            "num_classes": sum(1 for n in ast.walk(tree) if isinstance(n, ast.ClassDef)),
        }
    except SyntaxError as e:
        result["parse_error"] = str(e)
    return result

def _get_max_depth(tree, current=0) -> int:
    if not list(ast.iter_child_nodes(tree)):
        return current
    return max(_get_max_depth(child, current + 1) for child in ast.iter_child_nodes(tree))

def _check_recursion(tree) -> bool:
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            func_name = node.id if hasattr(node, 'id') else node.name
            for child in ast.walk(node):
                if isinstance(child, ast.Call):
                    if isinstance(child.func, ast.Name) and child.func.id == func_name:
                        return True
    return False


# ─────────────────────────────────────────────
# 2. SIMILARITY ENGINE
# ─────────────────────────────────────────────

def compute_structural_similarity(fp1: str, fp2: str) -> float:
    tokens1 = fp1.split()
    tokens2 = fp2.split()
    if not tokens1 or not tokens2:
        return 0.0
    matcher = difflib.SequenceMatcher(None, tokens1, tokens2)
    return matcher.ratio()

def compute_text_similarity(code1: str, code2: str) -> float:
    def normalize(code):
        lines = []
        for line in code.splitlines():
            stripped = line.strip()
            if stripped and not stripped.startswith("#"):
                lines.append(stripped)
        return " ".join(lines)

    normalized1 = normalize(code1)
    normalized2 = normalize(code2)
    if not normalized1 or not normalized2:
        return 0.0
    matcher = difflib.SequenceMatcher(None, normalized1, normalized2)
    return matcher.ratio()

def combined_similarity_score(structural: float, textual: float, hash_match: bool) -> float:
    if hash_match:
        return 0.95
    return round((structural * 0.70) + (textual * 0.30), 3)


# ─────────────────────────────────────────────
# 3. GEMINI SEMANTIC ANALYSIS (UPDATED FOR TIME/PASTE)
# ─────────────────────────────────────────────

def gemini_plagiarism_analysis(
    submitted_code: str,
    matched_code: str,
    structural_score: float,
    problem_title: str,
    time_taken: int,
    pasted_chars: int
) -> dict:
    
    prompt = f"""
    You are an expert Anti-Cheat AI for a coding platform. Analyze the student's submission.

    Problem: "{problem_title}"

    Student's Code:
    {submitted_code}

    Metrics Collected:
    - Time taken to submit: {time_taken} seconds
    - Characters directly Pasted into IDE: {pasted_chars} characters
    - AST Structural Similarity with another student: {structural_score * 100:.1f}%

    Evaluate the submission on these 3 parameters:
    1. Paste/Time Anomaly: Is it humanly impossible to write this much code in {time_taken} seconds? Does the pasted character count ({pasted_chars}) indicate direct external copying?
    2. AI-Generation: Does the code look like it was generated by ChatGPT/Gemini? (Look for hyper-idiomatic code, generic comments, or perfect handling a beginner wouldn't write).
    3. AST Plagiarism: Is the logic structurally identical to another student? (Only relevant if AST Similarity > 0%)

    Return ONLY a JSON response in this exact format:
    {{
        "verdict": "Original" | "Likely Copied" | "AI Generated" | "Pasted from External Source",
        "confidenceScore": <number 0-100>,
        "isAiGenerated": true/false,
        "isPasted": true/false,
        "penaltyMultiplier": <number 1.0 if Original, -0.5 if Cheating>,
        "explanation": "2-3 sentence explanation of why it was flagged or why it is original."
    }}
    """

    try:
        response = model.generate_content(prompt)
        clean = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except Exception as e:
        return {
            "verdict": "error",
            "confidenceScore": 0,
            "isAiGenerated": False,
            "isPasted": False,
            "penaltyMultiplier": 1.0,
            "explanation": f"Gemini analysis failed: {str(e)}"
        }


# ─────────────────────────────────────────────
# 4. MAIN CHECK FUNCTION (UPDATED)
# ─────────────────────────────────────────────

def run_plagiarism_check(
    submitted_code: str,
    problem_id: str,
    problem_title: str,
    user_id: str,
    stored_submissions: list,
    time_taken: int = 0,
    pasted_chars: int = 0
) -> dict:

    SIMILARITY_THRESHOLD = 0.40

    submitted_fp_data = extract_ast_fingerprint(submitted_code)
    if submitted_fp_data["parse_error"]:
        return {
            "status": "parse_error",
            "message": f"Could not parse your code: {submitted_fp_data['parse_error']}",
            "score": 0,
            "matches": []
        }

    submitted_fp = submitted_fp_data["fingerprint"]
    submitted_hash = submitted_fp_data["hash"]
    submitted_metrics = submitted_fp_data["metrics"]

    matches = []
    for submission in stored_submissions:
        if submission.get("userId") == user_id:
            continue

        stored_code = submission.get("code", "")
        if not stored_code or len(stored_code.strip()) < 10:
            continue

        stored_fp_data = extract_ast_fingerprint(stored_code)
        if stored_fp_data["parse_error"]:
            continue

        stored_fp = stored_fp_data["fingerprint"]
        stored_hash = stored_fp_data["hash"]

        structural = compute_structural_similarity(submitted_fp, stored_fp)
        textual = compute_text_similarity(submitted_code, stored_code)
        hash_match = (submitted_hash == stored_hash)

        combined = combined_similarity_score(structural, textual, hash_match)

        if combined >= SIMILARITY_THRESHOLD:
            matches.append({
                "submission_id": str(submission.get("_id", "")),
                "matched_user_id": submission.get("userId", "anonymous"),
                "structural_score": round(structural, 3),
                "textual_score": round(textual, 3),
                "combined_score": combined,
                "hash_match": hash_match,
                "matched_code": stored_code 
            })

    matches.sort(key=lambda x: x["combined_score"], reverse=True)

    # 🔴 ALWAYS Run Gemini Analysis to check for AI/Pasting, even if no AST match is found!
    top_match_code = matches[0]["matched_code"] if matches else ""
    top_match_score = matches[0]["combined_score"] if matches else 0.0

    gemini_result = gemini_plagiarism_analysis(
        submitted_code=submitted_code,
        matched_code=top_match_code,
        structural_score=top_match_score,
        problem_title=problem_title,
        time_taken=time_taken,
        pasted_chars=pasted_chars
    )

    for m in matches:
        m.pop("matched_code", None)

    overall_score = int(top_match_score * 100) if matches else 0

    return {
        "status": "success",
        "problem_id": problem_id,
        "user_id": user_id,
        "overall_score": overall_score,
        "verdict": gemini_result.get("verdict", "Original") if gemini_result else "Original",
        "total_submissions_checked": len(stored_submissions),
        "matches_found": len(matches),
        "top_matches": matches[:3],
        "gemini_analysis": gemini_result,
        "submitted_metrics": submitted_metrics,
        "submitted_fingerprint_hash": submitted_hash
    }