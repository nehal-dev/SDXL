const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const port = 3000;

app.use(cors());

const bannedPatterns = [
  /b[o0]{2,}bs/i, /p[u*]+ssy/i, /h[o0]rny/i, /n[a@]ked/i, /s[e3]x/i,
  /d[i1]ck/i, /v[a@]g[i1]na/i, /c[u*]m/i, /sl[u*]t/i, /wh[o0]re/i,
  /n[i1]pples/i, /f[a@]p/i, /p[o0]rn/i, /n[u*]de/i, /c[o0]ck/i,
  /r[a@]pe/i, /b[e3]avers/i, /b[a@]lls/i, /t[i1]ts/i, /g[a@]ngb[a@]ng/i,
  /squ[i1]rt/i, /tw[a@]t/i, /b[i1]tch/i, /m[i1]lf/i, /y[a@]nk/i
];

function containsBannedKeywords(prompt) {
  return bannedPatterns.some(pattern => pattern.test(prompt));
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
