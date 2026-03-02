#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path
from typing import List, Tuple

TOC_RE = re.compile(r"^(содержание|оглавление|table of contents)$", re.IGNORECASE)
HEADING_RE = re.compile(r"^(#{2,3})\s+(.+?)\s*$")
NUM_PREFIX_RE = re.compile(r"^\d+(?:\.\d+)?[.)]?\s*")


def clean_heading(raw: str) -> str:
    text = raw.strip()
    text = re.sub(r"`", "", text)
    text = NUM_PREFIX_RE.sub("", text)
    text = re.sub(r"^Q\d+\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^Вопрос\s*:\s*", "", text, flags=re.IGNORECASE)
    return text.strip()


def is_question_heading(heading: str) -> bool:
    if re.match(r"^Q\d+$", heading.strip(), flags=re.IGNORECASE):
        return True
    h = clean_heading(heading)
    if not h:
        return False
    if TOC_RE.match(h):
        return False
    if "?" in h:
        return True
    # Numbered interview sections are usually questions even without '?'
    if re.match(r"^\d+", heading.strip()):
        return True
    # Explicit question prefix in file
    if heading.strip().lower().startswith("вопрос:"):
        return True
    return False


def split_sections(text: str) -> List[Tuple[str, str]]:
    lines = text.splitlines()
    sections: List[Tuple[str, List[str]]] = []
    current_title = None
    current_body: List[str] = []

    for line in lines:
        m = HEADING_RE.match(line)
        if m:
            title = m.group(2).strip()
            if current_title is not None:
                sections.append((current_title, current_body))
            current_title = title
            current_body = []
        else:
            if current_title is not None:
                current_body.append(line)

    if current_title is not None:
        sections.append((current_title, current_body))

    return [(title, "\n".join(body).strip()) for title, body in sections]


def extract_code_block(text: str) -> str | None:
    m = re.search(r"```[\w-]*\n(.*?)```", text, flags=re.DOTALL)
    if not m:
        return None
    code = m.group(1).strip()
    return code if code else None


def normalize_answer(body: str) -> str:
    content = body.strip()
    if "**Ответ:**" in content:
        content = content.split("**Ответ:**", 1)[1].strip()
    elif "**Объяснение:**" in content:
        content = content.split("**Объяснение:**", 1)[1].strip()

    # Remove repetitive horizontal separators around content
    content = re.sub(r"\n-{3,}\n", "\n\n", content)
    content = re.sub(r"\n{3,}", "\n\n", content).strip()
    return content


def section_to_card(title: str, body: str) -> dict | None:
    raw_title = title.strip()
    cleaned_title = clean_heading(raw_title)

    if not is_question_heading(raw_title):
        return None

    # For headings like Q1/Q2 where title is not informative, use first code block as question context.
    if re.match(r"^Q\d+$", raw_title, flags=re.IGNORECASE):
        code = extract_code_block(body)
        if code:
            question = "What is the result of this code?\n\n```javascript\n" + code + "\n```"
        else:
            question = raw_title
    else:
        question = cleaned_title

    answer = normalize_answer(body)
    if not answer:
        return None

    return {
        "question": question,
        "answer": answer,
    }


def collection_name_from_path(path: Path, root: Path) -> str:
    rel = path.relative_to(root)
    stem = rel.with_suffix("")
    parts = [p.replace("_", " ") for p in stem.parts]
    return " - ".join(parts)


def convert_file(md_path: Path, input_root: Path, output_root: Path) -> tuple[Path, int]:
    text = md_path.read_text(encoding="utf-8", errors="ignore")
    sections = split_sections(text)

    cards = []
    for title, body in sections:
        card = section_to_card(title, body)
        if card:
            cards.append(card)

    rel = md_path.relative_to(input_root)
    out_path = output_root / rel.with_suffix(".json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path, len(cards)


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert markdown interview notes into Ankie JSON collections")
    parser.add_argument("--input", default="Sources/Theory", help="Input root with markdown files")
    parser.add_argument("--output", default="Sources/PreloadCollections", help="Output root for generated JSON")
    args = parser.parse_args()

    input_root = Path(args.input)
    output_root = Path(args.output)
    output_root.mkdir(parents=True, exist_ok=True)

    md_files = sorted(p for p in input_root.rglob("*.md") if p.is_file())

    manifest = []
    total_cards = 0
    for md_file in md_files:
        out_path, count = convert_file(md_file, input_root, output_root)
        total_cards += count
        manifest.append(
            {
                "collection_name": collection_name_from_path(md_file, input_root),
                "source_markdown": str(md_file),
                "json_file": str(out_path),
                "cards": count,
            }
        )

    manifest_path = output_root / "collections-manifest.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Converted {len(md_files)} markdown files")
    print(f"Total cards: {total_cards}")
    print(f"Manifest: {manifest_path}")


if __name__ == "__main__":
    main()
