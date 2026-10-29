#!/usr/bin/env python3
"""Add new EGDA LinkedIn posts to public/content/news.json.

Reads the public company page. Posts already stored by activity id are left
untouched, including any edited text or local photo. If LinkedIn does not
return a feed, the file is not changed.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEWS_PATH = ROOT / "public" / "content" / "news.json"
IMAGE_DIR = ROOT / "public" / "assets" / "news"
COMPANY_URL = "https://www.linkedin.com/company/estonian-game-developers-association/"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

ACTIVITY_RE = re.compile(r'(?:^|[\s])data-activity-urn="urn:li:activity:(\d+)"')
COMMENTARY_RE = re.compile(
    r'data-test-id="main-feed-activity-card__commentary"[^>]*>([\s\S]*?)</p>'
)
IMAGE_RE = re.compile(
    r'(?:data-delayed-url|src)="(https://media\.licdn\.com/[^"]+)"'
)
EMOJI_RE = re.compile(
    "["
    "\U0001F000-\U0001FAFF"
    "\U00002600-\U000027BF"
    "\U0000FE00-\U0000FE0F"
    "\U0000200D"
    "]+"
)


class FeedError(Exception):
    pass


def fetch_html(url: str = COMPANY_URL) -> str:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html",
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    last_error = None
    for _ in range(2):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                if response.status != 200:
                    raise FeedError(f"LinkedIn returned HTTP {response.status}")
                return response.read().decode("utf-8", "replace")
        except FeedError:
            raise
        except urllib.error.HTTPError as error:
            last_error = error
        except urllib.error.URLError as error:
            last_error = error
    raise FeedError(f"Could not reach the LinkedIn company page: {last_error}")


def activity_timestamp(activity_id: str) -> str:
    milliseconds = int(activity_id) >> 22
    moment = datetime.fromtimestamp(milliseconds / 1000, timezone.utc)
    return moment.strftime("%Y-%m-%dT%H:%M:%SZ")


def clean_text(fragment: str) -> str:
    fragment = re.sub(r"<br\s*/?>", "\n", fragment, flags=re.I)

    def link_text(match: re.Match[str]) -> str:
        inner = re.sub(r"<[^>]+>", "", match.group(0))
        return unescape(inner).strip()

    fragment = re.sub(r"<a\b[^>]*>[\s\S]*?</a>", link_text, fragment)
    text = re.sub(r"<[^>]+>", "", fragment)
    text = unescape(text).replace("\xa0", " ").replace("→", " ")
    text = EMOJI_RE.sub("", text)
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines()]
    return re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()


def title_from(body: str) -> str:
    first = body.split("\n", 1)[0].strip()
    first = re.sub(r"\s+", " ", first).strip(" -–—")
    return first


def image_url(chunk: str) -> str | None:
    for raw in IMAGE_RE.findall(chunk):
        url = unescape(raw)
        if "/feedshare" in url:
            return url
    return None


def parse_feed(html: str) -> list[dict]:
    if "Just a moment" in html or "Attention Required" in html:
        raise FeedError("LinkedIn blocked the request")
    matches = list(ACTIVITY_RE.finditer(html))
    if not matches:
        raise FeedError("LinkedIn did not return a public post feed")

    posts = []
    seen = set()
    for index, match in enumerate(matches):
        activity_id = match.group(1)
        if activity_id in seen:
            continue
        seen.add(activity_id)
        end = matches[index + 1].start() if index + 1 < len(matches) else len(html)
        chunk = html[match.start() : end]
        commentary = COMMENTARY_RE.search(chunk)
        if not commentary:
            continue
        body = clean_text(commentary.group(1))
        title = title_from(body)
        if not title or not body:
            continue
        posts.append(
            {
                "id": activity_id,
                "title": title,
                "body": body,
                "date": activity_timestamp(activity_id),
                "image_url": image_url(chunk),
                "link": f"https://www.linkedin.com/feed/update/urn:li:activity:{activity_id}",
            }
        )
    if not posts:
        raise FeedError("No posts could be read from the LinkedIn page")
    return posts


def activity_id_from_link(link: str | None) -> str | None:
    if not link:
        return None
    match = re.search(r"urn:li:activity:(\d+)", link)
    if match:
        return match.group(1)
    match = re.search(r"activity-(\d+)", link)
    return match.group(1) if match else None


def slugify(title: str) -> str:
    text = title.lower()
    for source, target in (
        ("ä", "a"),
        ("ö", "o"),
        ("õ", "o"),
        ("ü", "u"),
        ("š", "s"),
        ("ž", "z"),
    ):
        text = text.replace(source, target)
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:48] or "post"


def save_image(post: dict, image_dir: Path = IMAGE_DIR) -> str | None:
    url = post.get("image_url")
    if not url:
        return None
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Referer": "https://www.linkedin.com/"},
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            content_type = response.headers.get("Content-Type", "")
            payload = response.read()
    except urllib.error.URLError as error:
        print(f"Skipping photo for {post['id']}: {error}", file=sys.stderr)
        return None
    if not payload:
        return None
    extension = ".jpg"
    if "png" in content_type:
        extension = ".png"
    elif "webp" in content_type:
        extension = ".webp"
    image_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{slugify(post['title'])}{extension}"
    destination = image_dir / filename
    if destination.exists():
        filename = f"{slugify(post['title'])}-{post['id'][-6:]}{extension}"
        destination = image_dir / filename
    destination.write_bytes(payload)
    return f"/assets/news/{filename}"


def new_item(post: dict, image: str | None) -> dict:
    item = {
        "title": post["title"],
        "category": "egda",
        "date": post["date"],
        "body": post["body"],
        "link": post["link"],
        "link_label": "Read on LinkedIn",
    }
    if image:
        item["image"] = image
    return item


def merge_posts(items: list[dict], posts: list[dict]) -> list[dict]:
    known = {activity_id_from_link(item.get("link")) for item in items}
    known.discard(None)
    fresh = [post for post in posts if post["id"] not in known]
    return fresh


def write_news(data: dict, path: Path = NEWS_PATH) -> None:
    payload = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    temporary = path.with_suffix(".json.tmp")
    temporary.write_text(payload)
    temporary.replace(path)


def main(argv: list[str] | None = None) -> int:
    arguments = argv if argv is not None else sys.argv[1:]
    dry_run = "--dry-run" in arguments
    try:
        posts = parse_feed(fetch_html())
    except FeedError as error:
        print(error, file=sys.stderr)
        return 1

    data = json.loads(NEWS_PATH.read_text())
    fresh = merge_posts(data.get("items") or [], posts)
    print(f"Found {len(posts)} posts on LinkedIn, {len(fresh)} new.")
    if not fresh:
        return 0
    for post in fresh:
        print(f"{'[dry run] ' if dry_run else ''}Add {post['date']} {post['title']}")
    if dry_run:
        return 0

    added = []
    for post in fresh:
        added.append(new_item(post, save_image(post)))
    data["items"] = added + (data.get("items") or [])
    data["items"].sort(key=lambda item: item.get("date") or "", reverse=True)
    write_news(data)
    return 0


if __name__ == "__main__":
    sys.exit(main())
