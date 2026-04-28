import fetch from 'node-fetch';
import crypto from 'crypto';

// In-memory cache for Vercel serverless (resets on cold start, but helps within a session)
const memoryCache = new Map();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const { prompt, width = '400', height = '267', seed = '1' } = req.query;

  if (!prompt) {
    return res.status(400).send('Missing prompt parameter');
  }

  const cacheKey = crypto.createHash('md5').update(`${prompt}|${width}|${height}|${seed}`).digest('hex');

  // Check memory cache
  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey);
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('CDN-Cache-Control', 'public, max-age=86400');
    return res.send(cached);
  }

  // Fetch from Pollinations
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(pollinationsUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 90000,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = await response.buffer();

      if (buffer.length < 1000) {
        throw new Error(`Suspiciously small: ${buffer.length} bytes`);
      }

      // Cache in memory
      memoryCache.set(cacheKey, buffer);

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      res.setHeader('CDN-Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    } catch (e) {
      if (attempt === 2) {
        return res.status(502).send(`Upstream error: ${e.message}`);
      }
      // Wait before retry
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}