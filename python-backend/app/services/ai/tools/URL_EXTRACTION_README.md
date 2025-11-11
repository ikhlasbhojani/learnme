# URL Extraction Tool - Nested URL Extraction

## 🎯 Overview

यह tool **BFS (Breadth-First Search)** approach का उपयोग करके documentation pages से **nested URLs** को step-by-step extract करता है।

## ✨ Features

### 1. **Recursive URL Extraction**
- Main URL से शुरू करके सभी nested URLs निकालता है
- Step-by-step हर level की URLs को process करता है
- कोई भी nested URL miss नहीं होता

### 2. **BFS (Breadth-First Search) Algorithm**
```
Level 0: Main URL
  ↓
Level 1: Main URL में मिले सभी URLs
  ↓
Level 2: Level 1 की URLs में मिले सभी nested URLs
  ↓
Level 3: Level 2 की URLs में मिले सभी nested URLs
```

### 3. **Smart Controls**
- **Max Depth**: Maximum 5 levels तक जाता है (configurable) - **INCREASED!**
- **Max URLs per Level**: हर level से maximum 200 URLs process करता है (configurable) - **INCREASED!**
- **All Links Processed**: हर page की सभी links extract होती हैं (no arbitrary limit)
- **Visited Tracking**: Duplicate URLs को skip करता है - O(1) lookup
- **Infinite Loop Prevention**: Already visited URLs को track करता है
- **Error Resilience**: Individual page errors से पूरी crawling stop नहीं होती

## 🔧 Configuration

```python
class URLExtractionContext(BaseModel):
    userId: str
    mainUrl: str
    timeout: int = 60  # seconds - INCREASED for deep crawling
    max_depth: int = 5  # Maximum recursion depth - INCREASED (was 3)
    max_urls_per_level: int = 200  # Max URLs per level - INCREASED (was 50)
```

### ✨ Recent Updates (v2.0)
- ✅ **Max Depth: 3 → 5** - अब 5 levels तक जा सकता है!
- ✅ **URLs per Level: 50 → 200** - हर level से 200 URLs process होंगे
- ✅ **Timeout: 30s → 60s** - ज्यादा time के लिए pages fetch कर सकते हैं
- ✅ **NO LIMIT on links per page** - अब हर page की सभी links process होंगी
- ✅ **Relaxed filtering** - Language pages और subdomains भी include होंगे
- ✅ **Better error handling** - Errors से पूरी crawling stop नहीं होगी

## 📊 Example Output

```json
{
  "topics": [
    {
      "id": "getting-started",
      "title": "Getting Started",
      "url": "https://example.com/docs/getting-started",
      "description": "[Level 1] Documentation page: Getting Started",
      "section": "Docs",
      "depth": 1
    },
    {
      "id": "getting-started-installation",
      "title": "Installation",
      "url": "https://example.com/docs/getting-started/installation",
      "description": "[Level 2] Documentation page: Installation",
      "section": "Docs",
      "depth": 2
    },
    {
      "id": "getting-started-installation-windows",
      "title": "Windows Installation",
      "url": "https://example.com/docs/getting-started/installation/windows",
      "description": "[Level 3] Documentation page: Windows Installation",
      "section": "Docs",
      "depth": 3
    }
  ],
  "mainUrl": "https://example.com/docs",
  "totalPages": 3,
  "maxDepth": 3
}
```

## 🚀 How It Works

### Step-by-Step Process:

1. **Initialization**
   ```python
   queue = [(main_url, 0)]  # (URL, depth)
   visited = {main_url}
   ```

2. **BFS Loop**
   ```python
   while queue:
       current_url, current_depth = queue.popleft()
       
       # Extract URLs from current page
       urls = extract_urls_from_html(current_url)
       
       # Add new URLs to queue
       for url in urls:
           if url not in visited:
               queue.append((url, current_depth + 1))
               visited.add(url)
   ```

3. **Level-by-Level Processing**
   - **Level 0**: `https://example.com/docs`
     - Finds: `/intro`, `/guides`, `/api`
   
   - **Level 1**: 
     - Process `/intro` → Finds: `/intro/setup`, `/intro/quickstart`
     - Process `/guides` → Finds: `/guides/basic`, `/guides/advanced`
     - Process `/api` → Finds: `/api/reference`, `/api/examples`
   
   - **Level 2**:
     - Process `/intro/setup` → Finds nested URLs
     - Process `/intro/quickstart` → Finds nested URLs
     - ... और सभी Level 1 URLs के nested URLs

4. **Smart Filtering**
   - Same domain के URLs ही process होते हैं
   - External links skip होते हैं
   - Anchor links (#) skip होते हैं
   - PDF, images, etc. skip होते हैं

## 🎨 Progress Logging

Tool execution के दौरान detailed logs दिखाता है:

```
🔍 Starting BFS URL extraction from: https://example.com/docs
⚙️  Max Depth: 5, Max URLs per level: 200

📍 Level 0 | Page 1/1: https://example.com/docs
✅ Found 45 URLs at Level 0 from this page
➕ Added 45 new URLs to crawl queue

📍 Level 1 | Page 2/46: https://example.com/docs/intro
✅ Found 23 URLs at Level 1 from this page
➕ Added 18 new URLs to crawl queue

📍 Level 1 | Page 3/63: https://example.com/docs/guides
✅ Found 34 URLs at Level 1 from this page
➕ Added 28 new URLs to crawl queue

📍 Level 2 | Page 47/91: https://example.com/docs/intro/setup
✅ Found 12 URLs at Level 2 from this page
➕ Added 10 new URLs to crawl queue

✨ BFS Complete!
📊 Total pages processed: 250
📊 Total URLs found: 847
📊 Errors encountered: 3
📊 URLs per level: {0: 45, 1: 156, 2: 321, 3: 225, 4: 100}
📊 Total unique pages visited: 850
```

## ⚡ Performance Optimizations (v2.0 Enhanced)

1. **Timeout Management**: Flexible timeouts (60s main, 30s per page, 5s for titles)
2. **URL Limiting**: हर level से maximum 200 URLs (configurable) - **INCREASED!**
3. **Depth Limiting**: Maximum 5 levels तक (configurable) - **INCREASED!**
4. **NO Arbitrary Limits**: सभी page links process होती हैं (पहले 200 की limit थी)
5. **Title Extraction**: Anchor text use करता है (fast, no extra HTTP request)
6. **Visited Tracking**: O(1) lookup के लिए Set use करता है
7. **Relaxed Filtering**: Minimal filtering - सिर्फ zaruri cheezon ko hi filter करता है
8. **Error Resilience**: Individual errors से process stop नहीं होती
9. **Progress Tracking**: Real-time progress के साथ detailed logging
10. **Subdomain Support**: Same base domain के subdomains भी crawl होते हैं

## 🔒 Safety Features

### 1. Infinite Loop Prevention
```python
visited = set()  # Track all visited URLs
if url in visited:
    continue  # Skip already visited URLs
```

### 2. Depth Control
```python
if current_depth > max_depth:
    continue  # Stop at max depth
```

### 3. URL Explosion Control (Enhanced)
```python
# Process up to 200 URLs per level (was 50)
urls_to_process = urls[:max_urls_per_level]

# But extract ALL links from each page (no per-page limit)
anchors = soup.find_all('a', href=True)  # ALL links
```

### 4. Error Handling
```python
try:
    urls = extract_urls_from_html(url)
except Exception as e:
    print(f"❌ Error: {e}")
    continue  # Skip failed URLs, continue with others
```

## 📝 Usage Example

```python
from url_extraction import extract_urls_from_documentation

# Extract URLs with default settings
result = await extract_urls_from_documentation(
    ctx=context,
    url="https://example.com/docs"
)

# Parse result
data = json.loads(result)
print(f"Total pages found: {data['totalPages']}")
print(f"Max depth reached: {data['maxDepth']}")

# Access topics
for topic in data['topics']:
    print(f"[Level {topic['depth']}] {topic['title']}: {topic['url']}")
```

## 🎯 Key Benefits

1. ✅ **Complete Coverage**: सभी nested URLs मिलते हैं, कोई miss नहीं होता
2. ✅ **Step-by-Step**: Proper hierarchical order में URLs extract होते हैं
3. ✅ **Safe**: Infinite loops और timeouts से protected
4. ✅ **Efficient**: Smart filtering और limiting के साथ
5. ✅ **Transparent**: Detailed progress logging के साथ
6. ✅ **Configurable**: Depth और URLs per level customize कर सकते हैं

## 🔍 Comparison: Old vs New

### ❌ Old Approach (Single Level)
```
Main URL → Extract URLs → Done
```
- सिर्फ main page की URLs मिलती थीं
- Nested URLs miss हो जाती थीं

### ✅ New Approach (BFS - Recursive)
```
Main URL
  → Level 1 URLs
    → Level 2 URLs
      → Level 3 URLs
        → Done
```
- सभी nested URLs step-by-step मिलती हैं
- Complete documentation coverage
- Hierarchical structure maintain होती है

## 🛠️ Customization

अगर आपको अलग settings चाहिए:

### 🔥 Aggressive Crawling (Maximum Coverage)
```python
context = URLExtractionContext(
    userId="user123",
    mainUrl="https://example.com/docs",
    timeout=120,         # 2 minutes timeout
    max_depth=7,         # 7 levels तक जाएं!
    max_urls_per_level=500  # हर level से 500 URLs
)
```

### ⚖️ Balanced (Default - Recommended)
```python
context = URLExtractionContext(
    userId="user123",
    mainUrl="https://example.com/docs",
    timeout=60,          # 60 seconds (default)
    max_depth=5,         # 5 levels (default)
    max_urls_per_level=200  # 200 URLs (default)
)
```

### 🏃 Quick Crawl (Fast but Limited)
```python
context = URLExtractionContext(
    userId="user123",
    mainUrl="https://example.com/docs",
    timeout=30,          # 30 seconds
    max_depth=3,         # 3 levels only
    max_urls_per_level=50  # हर level से 50 URLs
)
```

---

**Made with ❤️ for Complete Documentation Coverage**

