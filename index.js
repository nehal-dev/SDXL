const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sharp = require('sharp');
const NodeCache = require('node-cache');
const app = express();
const port = 3000;

const cache = new NodeCache({ stdTTL: 300 });

app.use(cors());

// Ratios with advanced prompts for cinematic, dynamic angles
const ratios = {
  1: {
    width: 1024,
    height: 1024,
    promptSuffix:
      "a cinematic square image with the subject showcased in the center, captured at unique angles and perspectives, surrounded by intricate and vivid details. The background complements the subject with artistic lighting, creating depth and drama --HDR-- Metallic effect glossy finsh reflections"
  },
  2: {
    width: 800,
    height: 1200,
    promptSuffix:
      "a tall cinematic portrait with the subject positioned dynamically in the center, viewed from an artistic angle, highlighted by a stunning interplay of light and shadow. The background emphasizes vertical depth with vivid colors and soft gradients --HDR-- Metallic effect glossy finsh reflections"
  },
  3: {
    width: 1600,
    height: 900,
    promptSuffix:
      "a wide cinematic frame featuring the subject in the center, presented from an artistic perspective with dynamic angles. The background expands panoramically with balanced details and stunning atmospheric lighting.Ultra Wide Angle 16:9 ratio the subjet will upper side and the background will wide with motion blur the main subject will all time in the center with random angles --HDR-- Metallic effect glossy finsh reflections "
  }
};

app.get('/sdxl', async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  // Extract ratio from the prompt
  const ratioMatch = prompt.match(/--(\d)/);
  const ratioCode = ratioMatch ? parseInt(ratioMatch[1], 10) : 1;
  const ratio = ratios[ratioCode] || ratios[1];

  // Refine prompt and add detailed description
  const sanitizedPrompt = prompt.replace(/--\d/, '').trim();
  const finalPrompt = `${sanitizedPrompt}, ${ratio.promptSuffix}`;

  const cacheKey = `${finalPrompt}-${ratioCode}`;
  const cachedImage = cache.get(cacheKey);
  if (cachedImage) {
    res.set('Content-Type', 'image/jpeg');
    return res.send(cachedImage);
  }

  try {
    const mainApiUrl = `https://smfahim.xyz/flux2?prompt=${encodeURIComponent(finalPrompt)}`;
    const backupApiUrl = `https://imagine-v2-by-nzr-meta.onrender.com/generate?prompt=${encodeURIComponent(finalPrompt)}`;

    // Fetching image from any available API
    const responses = await Promise.any([
      axios.get(mainApiUrl, { responseType: 'arraybuffer' }),
      axios.get(backupApiUrl, { responseType: 'arraybuffer' })
    ]);

    // Adding watermark
    const watermarkText = 'SDXL BY NZ R';
    const watermarkSvg = `
      <svg width="200" height="55">
        <text x="9" y="35" font-size="24" font-family="Arial" fill="white" opacity="0.4">${watermarkText}</text>
      </svg>`;
    const watermarkBuffer = Buffer.from(watermarkSvg);

    // Process image with sharp
    const imageWithWatermark = await sharp(responses.data)
      .resize(ratio.width, ratio.height, { fit: 'cover', position: 'attention' })
      .composite([
        {
          input: watermarkBuffer,
          gravity: 'southeast',
          blend: 'over'
        }
      ])
      .jpeg({ quality: 100, progressive: true, chromaSubsampling: '4:4:4' })
      .toBuffer();

    cache.set(cacheKey, imageWithWatermark);
    res.set('Content-Type', 'image/jpeg');
    res.send(imageWithWatermark);

  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Failed to fetch the image from external APIs.',
        details: error.response.data
      });
    } else if (error.request) {
      res.status(503).json({
        error: 'No response received from external APIs. Please try again later.'
      });
    } else {
      res.status(500).json({
        error: 'Internal server error occurred. Please check the server logs.'
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port} | Made with ⚡ by NZR`);
});

