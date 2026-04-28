const crypto = require('crypto');

const memoryCache = new Map();

exports.handler = async (event) => {
  const { prompt, width = '400', height = '267', seed = '1' } = event.queryStringParameters || {};

  if (!prompt) {
    return { statusCode: 400, body: 'Missing prompt parameter' };
  }

  const cacheKey = crypto.createHash('md5').update(`${prompt}|${width}|${height}|${seed}`).digest('hex');

  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400',
      },
      body: cached.toString('base64'),
      isBase64Encoded: true,
    };
  }

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(90000),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const arrayBuffer = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length < 1000) throw new Error(`Too small: ${buffer.length} bytes`);

      memoryCache.set(cacheKey, buffer);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true,
      };
    } catch (e) {
      if (attempt === 2) {
        return { statusCode: 502, body: `Upstream error: ${e.message}` };
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }
};