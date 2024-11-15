const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sharp = require('sharp');
const NodeCache = require('node-cache');
const app = express();
const port = 3000;

const cache = new NodeCache({ stdTTL: 300 });

app.use(cors());

app.get('/sdxl', async (req, res) => {
  const { prompt } = req.query;

  if (!prompt) {
    console.log(`[ERROR] No prompt provided by user`);
    return res.status(400).json({ error: 'Prompt is required' });
  }

  console.log(`[REQUEST] Prompt received: "${prompt}"`);

  const cachedImage = cache.get(prompt);
  if (cachedImage) {
    console.log(`[CACHE] Serving cached image for prompt: "${prompt}"`);
    res.set('Content-Type', 'image/jpeg');
    return res.send(cachedImage);
  }

  try {
    const mainApiUrl = `https://smfahim.xyz/flux2?prompt=${encodeURIComponent(prompt)}`;
    const backupApiUrl = `https://imagine-v2-by-nzr-meta.onrender.com/generate?prompt=${encodeURIComponent(prompt)}`;

    const responses = await Promise.any([
      axios.get(mainApiUrl, { responseType: 'arraybuffer' }),
      axios.get(backupApiUrl, { responseType: 'arraybuffer' })
    ]);

    console.log(`[SUCCESS] Image generated for prompt: "${prompt}"`);

    const watermarkText = 'SDXL BY NZ R';
    const fontSize = 24;
    const watermarkSvg = `
      <svg width="200" height="55">
        <text x="9" y="35" font-size="${fontSize}" font-family="Arial" fill="white" opacity="0.4">${watermarkText}</text>
      </svg>`;
    const watermarkBuffer = Buffer.from(watermarkSvg);

    const imageWithWatermark = await sharp(responses.data)
      .composite([
        {
          input: watermarkBuffer,
          gravity: 'southeast',
          blend: 'over'
        }
      ])
      .jpeg({ quality: 100, progressive: true, chromaSubsampling: '4:4:4' })
      .toBuffer();

    cache.set(prompt, imageWithWatermark);

    res.set('Content-Type', 'image/jpeg');
    res.send(imageWithWatermark);

  } catch (error) {
    if (error.response) {
      console.log(`[ERROR] Failed to fetch image for prompt: "${prompt}". Status: ${error.response.status}`);
      res.status(error.response.status).json({
        error: 'Failed to fetch the image from external APIs.',
        details: error.response.data
      });
    } else if (error.request) {
      console.log(`[ERROR] No response from external APIs for prompt: "${prompt}"`);
      res.status(503).json({
        error: 'No response received from external APIs. Please try again later.'
      });
    } else {
      console.log(`[ERROR] Internal server error for prompt: "${prompt}". Error: ${error.message}`);
      res.status(500).json({
        error: 'Internal server error occurred. Please check the server logs.'
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port} | Made with ⚡ by NZR`);
});
