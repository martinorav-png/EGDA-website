#!/usr/bin/env python3
"""Parser and merge checks for the LinkedIn news updater."""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import update_linkedin_news as news

CARD = """
<article data-activity-urn="urn:li:activity:7521251132330086400" data-id="main-feed-card">
  <p class="attributed-text-segment-list__content" dir="ltr" data-test-id="main-feed-activity-card__commentary">Creative Europe-MEDIA funding call for game developers!💰

Click the portal. → <a class="link" href="https://lnkd.in/dD9_VWQ6">https://lnkd.in/dD9_VWQ6</a>
</p>
</article>
<article data-activity-urn="urn:li:activity:7517130747548405760">
  <p data-test-id="main-feed-activity-card__commentary">EIS had a creative industries seminar. ⛴️

Thanks for having us!</p>
  <img data-delayed-url="https://media.licdn.com/dms/image/v2/D4D22AQEybbRQznkJ7w/feedshare-shrink_800/photo.jpg" alt="">
  <img src="https://media.licdn.com/dms/image/v2/logo/company-logo_100_100/logo.jpg" alt="">
</article>
"""


class ParseFeedTest(unittest.TestCase):
    def test_reads_posts_newest_first(self):
        posts = news.parse_feed(CARD)
        self.assertEqual([post["id"] for post in posts], [
            "7521251132330086400",
            "7517130747548405760",
        ])
        self.assertEqual(posts[0]["title"], "Creative Europe-MEDIA funding call for game developers!")
        self.assertIn("https://lnkd.in/dD9_VWQ6", posts[0]["body"])
        self.assertNotIn("💰", posts[0]["body"])
        self.assertNotIn("→", posts[0]["body"])
        self.assertEqual(posts[0]["date"], "2026-10-28T16:46:48Z")
        self.assertIsNone(posts[0]["image_url"])
        self.assertIn("/feedshare-shrink_800/", posts[1]["image_url"])

    def test_login_wall_is_an_error(self):
        with self.assertRaises(news.FeedError):
            news.parse_feed("<html><title>LinkedIn Login, Sign in | LinkedIn</title></html>")

    def test_blocked_page_is_an_error(self):
        with self.assertRaises(news.FeedError):
            news.parse_feed("<html>Attention Required! | Cloudflare</html>")

    def test_merge_skips_posts_already_stored(self):
        items = [{
            "title": "Already here",
            "link": "https://www.linkedin.com/feed/update/urn:li:activity:7521251132330086400",
        }]
        fresh = news.merge_posts(items, news.parse_feed(CARD))
        self.assertEqual([post["id"] for post in fresh], ["7517130747548405760"])


if __name__ == "__main__":
    unittest.main()
