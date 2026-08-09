#!/bin/bash
set -euo pipefail
KEY="/Users/airm1/.ssh/prince_esquare_ed25519"
HOST="root@161.35.58.181"
ROOT="/var/www/Prince-Esquare"
LOCAL="/Users/airm1/Projects/Prince-Esquare"

rsync -az -e "ssh -i $KEY -o BatchMode=yes" \
  "$LOCAL/frontend/src/components/BlogShowcase.jsx" \
  "$LOCAL/frontend/src/components/HomeBlogSection.jsx" \
  "$HOST:$ROOT/frontend/src/components/"

ssh -i "$KEY" -o BatchMode=yes "$HOST" bash -s <<'REMOTE'
set -euo pipefail
cd /var/www/Prince-Esquare

python3 <<'PY'
from pathlib import Path

p = Path("frontend/src/pages/AdminDashboard.jsx")
text = p.read_text()

sidebar = """  const allSidebarItems = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
    { id: 'blogs', label: 'Blogs', icon: BookOpen, section: 'Content' },
    { id: 'orders', label: 'Orders', icon: Package, section: 'Store' },
    { id: 'products', label: 'Products', icon: ShoppingBag, section: 'Catalogue' },
    { id: 'users', label: 'Users', icon: Users, section: 'People' },
    { id: 'reviews', label: 'Reviews', icon: Star, section: 'Marketing', badge: '5' },
    { id: 'settings', label: 'Settings', icon: Settings, section: 'System' },
  ], []);"""

import re
text = re.sub(
    r"  const allSidebarItems = useMemo\(\(\) => \[\n[\s\S]*?\], \[\]\);",
    sidebar,
    text,
    count=1,
)
p.write_text(text)
print("Admin sidebar OK")

# Home.jsx: use HomeBlogSection always at bottom
h = Path("frontend/src/pages/Home.jsx")
home = h.read_text()
if "HomeBlogSection" not in home:
    home = home.replace(
        "import BlogShowcase from '../components/BlogShowcase';",
        "import HomeBlogSection from '../components/HomeBlogSection';",
    )
# Remove featuredBlogs state and fetch effect
import re
home = re.sub(
    r"  const \[featuredBlogs, setFeaturedBlogs\] = useState\(\[\]\);\n\n",
    "",
    home,
)
home = re.sub(
    r"  useEffect\(\(\) => \{\n    let cancelled = false;\n\n    const fetchFeaturedBlogs = async \(\) => \{[\s\S]*?  \}, \[\]\);\n\n",
    "",
    home,
    count=1,
)
# Replace conditional blog block with HomeBlogSection
home = re.sub(
    r"\{featuredBlogs\.length > 0 && \(\n          <section className=\"pt-10 pb-20[\s\S]*?\)\}\n        \)\}",
    "        <HomeBlogSection />",
    home,
)
if "<HomeBlogSection />" not in home:
    home = home.replace(
        "      </main>\n\n      <Footer />",
        "        <HomeBlogSection />\n      </main>\n\n      <Footer />",
    )
h.write_text(home)
print("Home.jsx OK")
PY

cd frontend
npm run build 2>&1 | tail -4
echo "Bundle: $(grep -o 'index-[^.]*\.js' dist/index.html)"
REMOTE

echo "Blogs sidebar + home section deployed."
