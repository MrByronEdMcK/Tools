"""
Educational Tools Hub - Hub & Integrity Tests
Validates file structure, tools.json schema, asset link resolution, and branding consistency.
"""

import os
import json
import re
import unittest

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

class TestHubIntegrity(unittest.TestCase):

    def test_core_files_exist(self):
        """Verify all essential hub and shared files exist on disk."""
        required_files = [
            'index.html',
            'index.css',
            'index.js',
            'tools.json',
            os.path.join('shared', 'css', 'theme.css'),
            os.path.join('shared', 'css', 'tool-nav.css'),
            os.path.join('shared', 'js', 'theme.js'),
            os.path.join('shared', 'js', 'tools-data.js'),
            os.path.join('Tools', 'Networks', 'index.html'),
            os.path.join('Tools', 'Networks', 'app.js'),
            os.path.join('Tools', 'Networks', 'styles.css'),
            os.path.join('Tools', 'Regression', 'index.html'),
            os.path.join('Tools', 'Regression', 'app.js'),
            os.path.join('Tools', 'Regression', 'styles.css'),
        ]
        for rel_path in required_files:
            full_path = os.path.join(BASE_DIR, rel_path)
            self.assertTrue(os.path.isfile(full_path), f"Missing core file: {rel_path}")

    def test_tools_json_schema(self):
        """Validate tools.json schema and verify all referenced tool paths exist."""
        tools_path = os.path.join(BASE_DIR, 'tools.json')
        self.assertTrue(os.path.isfile(tools_path), "tools.json is missing")

        with open(tools_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        self.assertIsInstance(data, list, "tools.json root must be an array")
        self.assertGreater(len(data), 0, "tools.json must contain at least one tool")

        required_keys = ['id', 'title', 'category', 'description', 'path', 'tags']
        for tool in data:
            for key in required_keys:
                self.assertIn(key, tool, f"Tool {tool.get('id', 'unknown')} missing required key '{key}'")
            
            # Check path resolves to an actual tool directory with index.html
            clean_path = tool['path'].lstrip('./').replace('/', os.sep)
            tool_dir = os.path.join(BASE_DIR, clean_path)
            self.assertTrue(os.path.isdir(tool_dir), f"Tool directory not found for: {tool['path']}")
            tool_index = os.path.join(tool_dir, 'index.html')
            self.assertTrue(os.path.isfile(tool_index), f"Tool index.html not found in: {tool_dir}")

    def test_html_link_resolutions(self):
        """Ensure all relative link hrefs and script srcs across HTML files resolve properly."""
        html_files = [
            'index.html',
            os.path.join('Tools', 'Networks', 'index.html'),
            os.path.join('Tools', 'Regression', 'index.html'),
        ]

        for rel_html in html_files:
            html_path = os.path.join(BASE_DIR, rel_html)
            html_dir = os.path.dirname(html_path)
            with open(html_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Find all relative stylesheet / script / link paths
            links = re.findall(r'(?:href|src)=["\']([^"\']+)["\']', content)
            for link in links:
                if link.startswith(('http://', 'https://', '#', 'mailto:', 'data:')):
                    continue
                # Strip query strings or hash fragments
                clean_link = link.split('?')[0].split('#')[0]
                if not clean_link:
                    continue

                target_path = os.path.normpath(os.path.join(html_dir, clean_link))
                self.assertTrue(
                    os.path.exists(target_path),
                    f"Broken asset link in {rel_html}: '{link}' -> resolved to non-existent path {target_path}"
                )

    def test_branding_consistency(self):
        """Verify that personal author branding MrByronEdMcK is removed from HTML titles and headers."""
        html_files = [
            'index.html',
            os.path.join('Tools', 'Networks', 'index.html'),
            os.path.join('Tools', 'Regression', 'index.html'),
        ]

        for rel_html in html_files:
            html_path = os.path.join(BASE_DIR, rel_html)
            with open(html_path, 'r', encoding='utf-8') as f:
                content = f.read()
            title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
            self.assertTrue(title_match, f"Missing title tag in {rel_html}")
            self.assertNotIn(
                'MrByronEdMcK',
                title_match.group(1),
                f"File {rel_html} title should not contain personal branding 'MrByronEdMcK'"
            )
            # Also verify header doesn't contain personal brand badge
            h1_match = re.search(r'<h1>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
            if h1_match:
                self.assertNotIn(
                    'MrByronEdMcK',
                    h1_match.group(1),
                    f"File {rel_html} h1 header should not contain personal branding 'MrByronEdMcK'"
                )

    def test_theme_css_tokens(self):
        """Verify essential CSS design tokens exist in theme.css."""
        theme_path = os.path.join(BASE_DIR, 'shared', 'css', 'theme.css')
        with open(theme_path, 'r', encoding='utf-8') as f:
            content = f.read()

        tokens = [
            '--bg-body',
            '--bg-surface',
            '--text-main',
            '--accent-primary',
            '--accent-secondary',
            '[data-theme="dark"]',
            '--font-sans',
            '--font-mono'
        ]
        for token in tokens:
            self.assertIn(token, content, f"theme.css missing token or rule: {token}")

if __name__ == '__main__':
    unittest.main()
