const { FoodScannerError, scanFoodLabel } = require('./foodScanner.service');

function getHeader(req, name) {
  return req.headers?.[name] || req.headers?.[name.toLowerCase()] || '';
}

async function readRequestBody(req) {
  if (req.rawBody?.length) {
    return Buffer.from(req.rawBody);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function parseMultipart(req, bodyBuffer) {
  const contentType = getHeader(req, 'content-type');
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) {
    throw new FoodScannerError('Expected multipart form data.', 400);
  }

  const boundary = `--${match[1] || match[2]}`;
  const raw = bodyBuffer.toString('latin1');
  const segments = raw.split(boundary).slice(1, -1);
  const fields = {};
  let file = null;

  for (let segment of segments) {
    segment = segment.replace(/^\r\n/, '').replace(/\r\n$/, '');
    const dividerIndex = segment.indexOf('\r\n\r\n');
    if (dividerIndex === -1) continue;

    const rawHeaders = segment.slice(0, dividerIndex);
    const rawContent = segment.slice(dividerIndex + 4).replace(/\r\n$/, '');
    const nameMatch = rawHeaders.match(/name="([^"]+)"/i);
    if (!nameMatch) continue;

    const fieldName = nameMatch[1];
    const filenameMatch = rawHeaders.match(/filename="([^"]*)"/i);
    const mimeMatch = rawHeaders.match(/content-type:\s*([^\r\n]+)/i);
    const contentBuffer = Buffer.from(rawContent, 'latin1');

    if (filenameMatch && filenameMatch[1]) {
      file = {
        fieldName,
        originalname: filenameMatch[1],
        mimetype: mimeMatch ? mimeMatch[1].trim().toLowerCase() : 'application/octet-stream',
        buffer: contentBuffer,
      };
    } else {
      fields[fieldName] = contentBuffer.toString('utf8').trim();
    }
  }

  return { fields, file };
}

function parseList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function resolveApiKey(getApiKey) {
  return getApiKey?.() || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
}

function sendJson(res, status, payload) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(status).json(payload);
    return;
  }

  res.statusCode = status;
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json');
  }
  res.end(JSON.stringify(payload));
}

function createFoodScanHandler({ getApiKey } = {}) {
  return async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method Not Allowed' });
      return;
    }

    try {
      const body = await readRequestBody(req);
      const { fields, file } = parseMultipart(req, body);
      const result = await scanFoodLabel({
        file,
        userId: fields.userId,
        productName: fields.productName,
        allergies: parseList(fields.allergies),
        conditions: parseList(fields.conditions),
        mode: fields.mode === 'consultant' ? 'consultant' : 'companion',
        apiKey: resolveApiKey(getApiKey),
      });

      sendJson(res, 200, {
        productName: result.productName,
        ingredients: result.ingredients,
        riskLevel: result.riskLevel,
        summary: result.summary,
        actionSteps: result.actionSteps,
        triggeredAlerts: result.triggeredAlerts,
        recommendedAlternatives: result.recommendedAlternatives,
        homeSuggestions: result.homeSuggestions,
      });
    } catch (error) {
      const status = error instanceof FoodScannerError ? error.status : 500;
      const message = error instanceof FoodScannerError
        ? error.message
        : 'Unable to extract ingredients clearly. Please upload a clearer image.';
      sendJson(res, status, { error: message });
    }
  };
}

module.exports = {
  createFoodScanHandler,
  parseList,
};
