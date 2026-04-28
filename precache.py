#!/usr/bin/env python3
"""Pre-cache all fact images from Pollinations AI with rate-limit-safe delays."""

import json
import hashlib
import urllib.request
import urllib.parse
import os
import time
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(BASE_DIR, '.image_cache')
FACTS_FILE = os.path.join(BASE_DIR, 'data', 'facts.json')

os.environ['no_proxy'] = '*'
os.environ['NO_PROXY'] = '*'
for k in ['http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY']:
    os.environ.pop(k, None)

os.makedirs(CACHE_DIR, exist_ok=True)


def hash_seed(fact_id):
    h = 0
    for c in fact_id:
        h = ((h << 5) - h) + ord(c)
        # JavaScript |= 0 truncates to 32-bit signed int
        h = h & 0xFFFFFFFF
        if h >= 0x80000000:
            h -= 0x100000000
    return abs(h)


def cache_key(prompt, width, height, seed):
    return hashlib.md5(f'{prompt}|{width}|{height}|{seed}'.encode()).hexdigest()


def fetch_image(prompt, width, height, seed, cache_file):
    url = (
        f'https://image.pollinations.ai/prompt/{urllib.parse.quote(prompt)}'
        f'?width={width}&height={height}&seed={seed}&nologo=true'
    )
    for attempt in range(5):
        try:
            proxy_handler = urllib.request.ProxyHandler({})
            opener = urllib.request.build_opener(proxy_handler)
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0')
            with opener.open(req, timeout=120) as resp:
                data = resp.read()
            if len(data) < 1000:
                raise Exception(f'Suspiciously small: {len(data)} bytes')
            with open(cache_file, 'wb') as f:
                f.write(data)
            return len(data)
        except Exception as e:
            err_str = str(e)
            wait = 10 * (attempt + 1)
            if '429' in err_str:
                wait = 30 * (attempt + 1)
                print(f'  Rate limited, waiting {wait}s...')
            elif attempt < 4:
                print(f'  Retry {attempt+1}/5: {e}')
            else:
                print(f'  FAILED after 5 attempts: {e}')
                return 0
            time.sleep(wait)
    return 0


def main():
    with open(FACTS_FILE, 'r', encoding='utf-8') as f:
        facts = json.load(f)

    print(f'Total facts: {len(facts)}')

    cached = 0
    skipped = 0
    failed = 0

    for i, fact in enumerate(facts):
        prompt = fact.get('image_prompt') or fact.get('search_term') or fact.get('answer', '')
        seed = hash_seed(fact['id'])
        key = cache_key(prompt, 400, 267, seed)
        cache_file = os.path.join(CACHE_DIR, f'{key}.jpg')

        if os.path.exists(cache_file):
            skipped += 1
            continue

        print(f'[{i+1}/{len(facts)}] {fact["answer"]}: ', end='', flush=True)
        start = time.time()
        size = fetch_image(prompt, 400, 267, seed, cache_file)
        elapsed = time.time() - start

        if size > 0:
            cached += 1
            print(f'{size} bytes in {elapsed:.1f}s')
        else:
            failed += 1

        # Rate limit: wait between requests
        time.sleep(5)

    print(f'\nDone! Cached: {cached}, Skipped: {skipped}, Failed: {failed}')


if __name__ == '__main__':
    main()
