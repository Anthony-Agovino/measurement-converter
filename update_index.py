import re

with open('index.html', 'r') as f:
    content = f.read()

# Remove the link rel="manifest"
content = re.sub(r'<link rel="manifest".*?>\n?', '', content)

# Remove the old script block registering sw.js
content = re.sub(r'<script>\s*if \(\'serviceWorker\'.*?</script>\n?', '', content, flags=re.DOTALL)

# Change the main script
content = content.replace('<script src="script.js"></script>', '<script type="module" src="/script.js"></script>')

# Add the footer before </body>
footer_html = '\n    <footer class="app-footer"><p id="last-updated"></p></footer>\n'
content = content.replace('</body>', footer_html + '</body>')

with open('index.html', 'w') as f:
    f.write(content)
