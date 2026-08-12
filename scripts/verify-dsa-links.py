#!/usr/bin/env python3
import urllib.request
import urllib.error
import json
import ssl
import re
import time
import sys

# Create unverified SSL context to bypass SSL validation errors on Mac/Windows
ctx = ssl._create_unverified_context()
HEADERS = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def verify_leetcode_slug(slug):
    url = "https://leetcode.com/graphql"
    query = {
        "query": """
        query questionTitle($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
                questionId
                title
            }
        }
        """,
        "variables": {
            "titleSlug": slug
        }
    }
    
    req = urllib.request.Request(url, data=json.dumps(query).encode('utf-8'), headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            question = res_data.get("data", {}).get("question")
            if question:
                return True, question["title"]
            else:
                return False, "404 Not Found"
    except Exception as e:
        return False, str(e)

def verify_gfg_url(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            html = r.read().decode('utf-8', errors='ignore')
            if 'Oops!! Something went wrong' in html:
                return False, "Oops!! Something went wrong (Broken GfG Redirect)"
            if 'Page Not Found' in html:
                return False, "Page Not Found"
            
            title_match = re.search(r"<title>(.*?)</title>", html, re.IGNORECASE)
            title = title_match.group(1) if title_match else ""
            if "Practice | GeeksforGeeks" in title and "Practice" in title and len(title) < 60:
                return False, f"Generic Title: {title}"
                
            return True, title.strip()
    except urllib.error.HTTPError as e:
        return False, f"HTTP Error {e.code}"
    except Exception as e:
        return False, str(e)

def verify_other_url(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as r:
            return True, f"HTTP {r.status}"
    except urllib.error.HTTPError as e:
        return False, f"HTTP Error {e.code}"
    except Exception as e:
        return False, str(e)

def parse_striver():
    content = open("src/pages/DsaTracker.tsx").read()
    pattern = r"export const STRIVER_SHEET_PROBLEMS: StriverProblem\[\] = \[(.*?)\];"
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return []
    problems_block = match.group(1)
    problem_pattern = r'\{\s*name:\s*"([^"]+)"[^{}]*?problem_link:\s*"([^"]+)"'
    return re.findall(problem_pattern, problems_block)

def parse_daily_gfg():
    content = open("src/components/DailyProblemsWidget.tsx").read()
    pattern = r"const GFG_FALLBACK_PROBLEMS = \[(.*?)\];"
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        return []
    block = match.group(1)
    problem_pattern = r'title:\s*"([^"]+)"[^{}]*?link:\s*"([^"]+)"'
    return re.findall(problem_pattern, block)

def main():
    print("==================================================")
    print("      DSA Tracker Problem Links Health Audit      ")
    print("==================================================")
    
    striver_problems = parse_striver()
    daily_gfg_problems = parse_daily_gfg()
    
    print(f"Loaded {len(striver_problems)} Striver SDE sheet problems.")
    print(f"Loaded {len(daily_gfg_problems)} GFG Daily fallback problems.")
    print("Starting verification...\n")
    
    broken_links = []
    
    # Audit Striver SDE Sheet
    for name, link in striver_problems:
        is_valid = False
        details = ""
        
        if "leetcode.com" in link:
            slug_match = re.search(r"leetcode\.com/problems/([^/]+)", link)
            if slug_match:
                slug = slug_match.group(1)
                is_valid, details = verify_leetcode_slug(slug)
            else:
                details = "Invalid LeetCode URL format"
        elif "geeksforgeeks.org" in link:
            is_valid, details = verify_gfg_url(link)
        else:
            is_valid, details = verify_other_url(link)
            
        if not is_valid:
            broken_links.append((f"Striver SDE Sheet: {name}", link, details))
            print(f"[BROKEN] {name} -> {link} ({details})")
        else:
            print(f"[OK] {name}")
        time.sleep(0.05)
        
    # Audit GFG Daily Fallbacks
    for name, link in daily_gfg_problems:
        is_valid = False
        details = ""
        
        if "leetcode.com" in link:
            slug_match = re.search(r"leetcode\.com/problems/([^/]+)", link)
            if slug_match:
                slug = slug_match.group(1)
                is_valid, details = verify_leetcode_slug(slug)
            else:
                details = "Invalid LeetCode URL format"
        elif "geeksforgeeks.org" in link:
            is_valid, details = verify_gfg_url(link)
        else:
            is_valid, details = verify_other_url(link)
            
        if not is_valid:
            broken_links.append((f"GFG Daily Fallback: {name}", link, details))
            print(f"[BROKEN] {name} -> {link} ({details})")
        else:
            print(f"[OK] {name}")
        time.sleep(0.05)
        
    print("\n========================= AUDIT SUMMARY =========================")
    print(f"Total problems audited: {len(striver_problems) + len(daily_gfg_problems)}")
    print(f"Total broken links flagged: {len(broken_links)}")
    
    if broken_links:
        print("\nBroken links list:")
        for name, link, reason in broken_links:
            print(f" - {name}: {link} (Reason: {reason})")
        sys.exit(1)
    else:
        print("\nAll links are healthy and fully verified!")
        sys.exit(0)

if __name__ == "__main__":
    main()
