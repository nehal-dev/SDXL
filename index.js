const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(cors());

app.get('/sdxl', async (req, res) => {
  const { prompt } = req.query;

  if (!prompt) {
    console.log(`[ERROR] No prompt provided by user`);
    return res.status(400).json({ error: 'Prompt is required' });
  }

  console.log(`[REQUEST] Prompt received: "${prompt}"`);

  try {
    const response = await axios({
      method: 'get',
      url: `https://smfahim.xyz/flux2?prompt=${encodeURIComponent(prompt)}`,
      responseType: 'arraybuffer'
    });

    console.log(`[SUCCESS] Image generated for prompt: "${prompt}"`);
    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(response.data, 'binary'));

  } catch (error) {
    if (error.response) {
      console.log(`[ERROR] Failed to fetch image for prompt: "${prompt}". Status: ${error.response.status}`);
      res.status(error.response.status).json({
        error: 'Failed to fetch the image from the external API.',
        details: error.response.data
      });
    } else if (error.request) {
      console.log(`[ERROR] No response from external API for prompt: "${prompt}"`);
      res.status(503).json({
        error: 'No response received from the external API. Please try again later.'
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
