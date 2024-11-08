const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(cors());

const bannedKeywords = ['boobs', 'pussy', 'explicit'];

function containsBannedKeywords(prompt) {
  return bannedKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
}

app.get('/sdxl', async (req, res) => {
  try {
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (containsBannedKeywords(prompt)) {
      console.warn('Banned prompt attempted:', prompt);

      const gifResponse = await axios({
        method: 'get',
        url: 'https://i.ibb.co/5jNv9DB/image.gif',
        responseType: 'arraybuffer'
      });

      res.set('Content-Type', 'image/gif');
      return res.send(Buffer.from(gifResponse.data, 'binary'));
    }

    const response = await axios({
      method: 'get',
      url: `https://smfahim.xyz/flux2?prompt=${encodeURIComponent(prompt)}`,
      responseType: 'arraybuffer'
    });

    res.set('Content-Type', 'image/jpeg');
    res.send(Buffer.from(response.data, 'binary'));

  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Error generating image' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port} Made With ⚡ By NZR`);
});
