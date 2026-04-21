const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0' },
  customFields: {
    item: [['media:content', 'media'], ['source', 'source']],
  },
});

// Google News RSS feeds — Global market coverage
const FEEDS = {
  markets: {
    label: 'Global Markets',
    url: 'https://news.google.com/rss/search?q=stock+market+OR+Wall+Street+OR+S%26P+500+OR+NASDAQ+OR+Dow+Jones+OR+FTSE+OR+Nikkei+OR+DAX&hl=en&gl=US&ceid=US:en',
  },
  business: {
    label: 'Business',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en&gl=US&ceid=US:en',
  },
  international: {
    label: 'World News',
    url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en&gl=US&ceid=US:en',
  },
  economy: {
    label: 'Economy',
    url: 'https://news.google.com/rss/search?q=economy+OR+GDP+OR+inflation+OR+interest+rate+OR+Federal+Reserve+OR+ECB+OR+central+bank&hl=en&gl=US&ceid=US:en',
  },
  wallstreet: {
    label: 'Wall Street',
    url: 'https://news.google.com/rss/search?q=Wall+Street+OR+NYSE+OR+NASDAQ+OR+S%26P+500+OR+Dow+Jones+OR+earnings&hl=en&gl=US&ceid=US:en',
  },
  europe: {
    label: 'Europe',
    url: 'https://news.google.com/rss/search?q=FTSE+100+OR+DAX+OR+CAC+40+OR+Euro+Stoxx+OR+London+Stock+Exchange+OR+European+markets&hl=en&gl=GB&ceid=GB:en',
  },
  asia: {
    label: 'Asia-Pacific',
    url: 'https://news.google.com/rss/search?q=Nikkei+OR+Hang+Seng+OR+Shanghai+OR+Sensex+OR+Nifty+OR+ASX+OR+KOSPI+OR+Asian+markets&hl=en&gl=US&ceid=US:en',
  },
  commodities: {
    label: 'Commodities',
    url: 'https://news.google.com/rss/search?q=crude+oil+price+OR+gold+price+OR+silver+OR+natural+gas+OR+commodities+market&hl=en&gl=US&ceid=US:en',
  },
  crypto: {
    label: 'Crypto',
    url: 'https://news.google.com/rss/search?q=bitcoin+OR+ethereum+OR+cryptocurrency+OR+crypto+market&hl=en&gl=US&ceid=US:en',
  },
};

// Simple in-memory cache (TTL = 5 minutes)
const cache = {};
const CACHE_TTL = 5 * 60 * 1000;

const extractImageUrl = (item) => {
  // Try different spots where images hide in RSS
  if (item.media && item.media.$ && item.media.$.url) return item.media.$.url;
  if (item.enclosure && item.enclosure.url) return item.enclosure.url;

  // Parse from the content/encoded HTML
  const html = item['content:encoded'] || item.content || item.summary || '';
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return null;
};

const cleanTitle = (title) => {
  // Google News appends " - Source Name" at the end
  if (!title) return '';
  const parts = title.split(' - ');
  if (parts.length > 1) {
    return { title: parts.slice(0, -1).join(' - '), source: parts[parts.length - 1] };
  }
  return { title, source: '' };
};

const getNews = async (req, res) => {
  const { category = 'business' } = req.query;

  const feedConfig = FEEDS[category] || FEEDS.business;

  // Check cache
  const cacheKey = category;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return res.json(cache[cacheKey].data);
  }

  try {
    const feed = await parser.parseURL(feedConfig.url);

    const articles = (feed.items || []).slice(0, 30).map((item, index) => {
      const { title, source } = cleanTitle(item.title);
      return {
        id: index,
        title,
        source: source || item.creator || item.source?._ || item.source || feedConfig.label,
        link: item.link,
        pubDate: item.pubDate || item.isoDate,
        timestamp: item.isoDate || item.pubDate,
        snippet: (item.contentSnippet || item.summary || '').slice(0, 200).replace(/<[^>]+>/g, ''),
        image: extractImageUrl(item),
        category: feedConfig.label,
      };
    });

    const responseData = {
      category: feedConfig.label,
      articles,
      lastUpdated: new Date().toISOString(),
    };

    cache[cacheKey] = { data: responseData, timestamp: Date.now() };
    res.json(responseData);
  } catch (error) {
    console.error(`News fetch error [${category}]:`, error.message);
    res.status(500).json({ message: 'Failed to fetch news', error: error.message });
  }
};

const getNewsCategories = (req, res) => {
  const categories = Object.entries(FEEDS).map(([key, val]) => ({
    id: key,
    label: val.label,
  }));
  res.json(categories);
};

module.exports = { getNews, getNewsCategories };
