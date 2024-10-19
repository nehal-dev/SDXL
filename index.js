const express = require('express');
const axios = require('axios');
const sharp = require('sharp');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

app.get('/sdxl', async (req, res) => {
  try {
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await axios({
      method: 'get',
      url: `https://sandipbaruwal.onrender.com/fluxdev?prompt=${encodeURIComponent(prompt)}`,
      responseType: 'arraybuffer'
    });

    const imageBuffer = Buffer.from(response.data, 'binary');

    const processedImage = await sharp(imageBuffer)
      .resize(1024, 1024, {
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .gif({ quality: 100, effort: 6 })
      .toBuffer();

    res.set('Content-Type', 'image/gif');
    res.send(processedImage);

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Error generating image' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
