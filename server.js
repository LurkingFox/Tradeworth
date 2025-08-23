const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Error handler for invalid JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  next();
});

app.post('/api/claude', async (req, res) => {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Missing request body' });
    }
    const { apiKey, prompt } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || !prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid apiKey or prompt' });
    }

    // Prepare payload for Anthropic
    const payload = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    };

    // Make request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    // Try to parse response as JSON
    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error('Failed to parse Anthropic response as JSON:', parseErr);
      return res.status(502).json({ error: 'Invalid response from Anthropic API' });
    }

    if (!response.ok) {
      // Log Anthropic API error details
      console.error('Anthropic API error:', data);
      return res.status(response.status).json(data);
    }

    // Success
    res.json(data);
  } catch (err) {
    // Log server-side error details
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));