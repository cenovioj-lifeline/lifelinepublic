"""
Sync local changes to GitHub using MCP
Since git CLI auth isn't working, this script helps push changes to GitHub
"""

import os
import json
import subprocess
from pathlib import Path

def get_changed_files():
    """Get list of modified files from git"""
    try:
        # Get modified files
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD"],
            capture_output=True, text=True, cwd=Path(__file__).parent
        )
        modified = result.stdout.strip().split('\n') if result.stdout.strip() else []

        # Get untracked files
        result = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            capture_output=True, text=True, cwd=Path(__file__).parent
        )
        untracked = result.stdout.strip().split('\n') if result.stdout.strip() else []

        all_files = [f for f in modified + untracked if f and not f.startswith('.')]
        return all_files
    except Exception as e:
        print(f"Error getting changed files: {e}")
        return []

def main():
    changed_files = get_changed_files()

    if not changed_files:
        print("No changes to sync")
        return

    print(f"Found {len(changed_files)} changed files:")
    for f in changed_files[:10]:  # Show first 10
        print(f"  - {f}")
    if len(changed_files) > 10:
        print(f"  ... and {len(changed_files) - 10} more")

    print("\nTo push these changes to GitHub:")
    print("1. Use Claude Code with GitHub MCP")
    print("2. Or set up a GitHub Personal Access Token")
    print("\nChanged files saved to: changed_files.txt")

    # Save list for reference
    with open("changed_files.txt", "w") as f:
        f.write('\n'.join(changed_files))

if __name__ == "__main__":
    main()