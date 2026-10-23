"""
SpendNest GitHub Repository Uploader
Pushes workspace files directly to https://github.com/appuethu/spendnest via GitHub REST API.
Usage:
    python push_to_github.py <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>
"""

import os
import sys
import json
import base64
import urllib.request
import urllib.error

REPO_OWNER = "appuethu"
REPO_NAME = "spendnest"
BRANCH = "main"

EXCLUDE_DIRS = {
    "node_modules", ".git", "dist", ".tmp", "__pycache__", ".system_generated"
}
EXCLUDE_EXTS = {".zip", ".pyc"}

def github_api_request(url, method="GET", data=None, token=None):
    headers = {
        "User-Agent": "SpendNest-Deployer",
        "Accept": "application/vnd.github.v3+json",
    }
    if token:
        headers["Authorization"] = f"token {token}"
    if data is not None:
        headers["Content-Type"] = "application/json"
        data_bytes = json.dumps(data).encode("utf-8")
    else:
        data_bytes = None

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        raise RuntimeError(f"HTTP {e.code} Error: {error_body}")

def upload_project(token):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"Collecting files from {base_dir}...")

    blobs = []
    for root, dirs, files in os.walk(base_dir):
        # Filter directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in EXCLUDE_EXTS:
                continue

            filepath = os.path.join(root, file)
            rel_path = os.path.relpath(filepath, base_dir).replace("\\", "/")

            # Skip large media or generated scratch files if over 5MB
            if os.path.getsize(filepath) > 5 * 1024 * 1024:
                continue

            try:
                with open(filepath, "rb") as f:
                    content_bytes = f.read()
            except Exception as e:
                print(f"Skipping {rel_path}: {e}")
                continue

            b64_content = base64.b64encode(content_bytes).decode("ascii")

            # Create blob
            blob_resp = github_api_request(
                f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/git/blobs",
                method="POST",
                data={"content": b64_content, "encoding": "base64"},
                token=token
            )
            blobs.append({
                "path": rel_path,
                "mode": "100644",
                "type": "blob",
                "sha": blob_resp["sha"]
            })
            print(f"✓ Uploaded blob: {rel_path}")

    # Create Tree
    print("\nCreating Git tree...")
    tree_resp = github_api_request(
        f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/git/trees",
        method="POST",
        data={"tree": blobs},
        token=token
    )
    tree_sha = tree_resp["sha"]

    # Check for existing commit on main branch
    parent_commits = []
    try:
        ref_resp = github_api_request(
            f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/git/ref/heads/{BRANCH}",
            method="GET",
            token=token
        )
        parent_commits.append(ref_resp["object"]["sha"])
    except Exception:
        pass

    # Create Commit
    print("Creating commit...")
    commit_data = {
        "message": "Initial commit: SpendNest Revenue Intelligence application and deliverables",
        "tree": tree_sha,
        "parents": parent_commits
    }
    commit_resp = github_api_request(
        f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/git/commits",
        method="POST",
        data=commit_data,
        token=token
    )
    commit_sha = commit_resp["sha"]

    # Update or Create Ref
    print(f"Updating branch {BRANCH}...")
    try:
        github_api_request(
            f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/git/refs/heads/{BRANCH}",
            method="PATCH",
            data={"sha": commit_sha, "force": True},
            token=token
        )
    except Exception:
        github_api_request(
            f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/git/refs",
            method="POST",
            data={"ref": f"refs/heads/{BRANCH}", "sha": commit_sha},
            token=token
        )

    print(f"\n🎉 Successfully pushed all files to https://github.com/{REPO_OWNER}/{REPO_NAME}!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        token = sys.argv[1].strip()
    else:
        token = input("Enter your GitHub Personal Access Token (repo scope): ").strip()
    
    if not token:
        print("Error: GitHub token is required.")
        sys.exit(1)

    upload_project(token)
