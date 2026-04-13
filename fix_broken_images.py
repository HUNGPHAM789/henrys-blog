import os
import re

# Configuration
POSTS_DIR = os.path.expanduser('~/projects/henrys-blog/posts/')
REPLACEMENT_HTML = """<div class="callout"><i class="ph-duotone ph-warning-circle callout-icon"></i><div class="callout-text">Image placeholder: Original source unavailable.</div></div>"""

def fix_images():
    if not os.path.exists(POSTS_DIR):
        print(f"Error: {POSTS_DIR} does not exist.")
        return

    files_fixed = 0
    
    for filename in os.listdir(POSTS_DIR):
        if filename.endswith(".html"):
            filepath = os.path.join(POSTS_DIR, filename)
            
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Pattern 1: <img> tags with external/broken src
            # This matches <img src="..." ...>
            new_content, count = re.subn(
                r'<img[^>]+src=["\'][^"\']+["\'][^>]*>',
                f'<div class="image-placeholder" style="background:#e5e5e0; height:200px; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#6b7280; font-size:0.8rem; text-align:center; padding:20px; border:1px dashed #d1d5db;">[Image Placeholder: Original source unavailable]</div>',
                content,
                flags=re.DOTALL
            )

            # Pattern 2: CSS background-image:url(...)
            # This matches background-image:url('...') or background-image:url("...")
            new_content, count2 = re.subn(
                r'background-image:\s*url\([\'"]?.*?[\'"]?\);?',
                'background-color: #f3f4f6; border: 1px dashed #d1d5db; min-height: 150px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background-image: none !important;',
                new_content,
                flags=re.IGNORECASE
            )

            if count + count2 > 0:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"✅ Fixed {filename}: {count} <img> replaced, {count2} CSS backgrounds reset.")
                files_fixed += 1
            else:
                print(f"ℹ️ Checked {filename}: No broken images found.")

    print(f"\nSummary: Processed {files_fixed} files.")

if __name__ == "__main__":
    fix_images()
