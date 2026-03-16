require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Replicate = require('replicate');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Replicate AI client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Style prompts — Xhosa cultural authenticity built in
const stylePrompts = {
  'Xhosa Warrior': `A majestic portrait of a proud Xhosa warrior from the Eastern Cape of South Africa, 
    wearing traditional umqhele headband, carrying an assegai spear and cowhide shield, 
    adorned with traditional Xhosa beadwork in red white and black, 
    wearing ibhayi blanket draped over shoulders, 
    natural traditional hairstyle, 
    regal dignified expression, 
    dramatic golden light, 
    hyper realistic oil painting style, 
    black background, 
    African royalty, 
    ancestral pride`,

  'African Royalty': `A breathtaking portrait of African royalty, 
    wearing an elaborate crown made of gold and natural materials, 
    adorned with rich Xhosa beadwork necklaces and bracelets in traditional colours, 
    wearing a leopard skin robe, 
    natural traditional African hairstyle with copper and brass ornaments, 
    commanding royal presence, 
    warm golden dramatic lighting, 
    hyper realistic oil painting, 
    black background, 
    dignity and power`,

  'Ndebele Royalty': `A stunning portrait of Ndebele royalty from South Africa, 
    wearing traditional Ndebele beaded apron and geometric beadwork, 
    large beaded neck rings and arm rings, 
    bold geometric patterns in red blue yellow white and black, 
    traditional natural hairstyle adorned with beads, 
    proud dignified expression, 
    vivid colours against dark background, 
    hyper realistic oil painting style, 
    ancestral African beauty`,

  'Zulu Chief': `A powerful portrait of a Zulu chief from South Africa, 
    wearing traditional isicoco headring showing senior status, 
    adorned with leopard skin and traditional Zulu regalia, 
    carrying ceremonial knobkerrie, 
    traditional Zulu beadwork, 
    natural traditional hairstyle, 
    commanding powerful expression, 
    dramatic warm lighting, 
    hyper realistic oil painting, 
    black background, 
    the spirit of uShaka, 
    ancestral African dignity`
};

// Generate portrait endpoint
app.post('/generate', upload.single('photo'), async (req, res) => {
  try {
    const { style } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    if (!stylePrompts[style]) {
      return res.status(400).json({ error: 'Invalid style selected' });
    }

    console.log(`Generating ${style} portrait...`);

    // Read uploaded image
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = `data:image/jpeg;base64,${imageData.toString('base64')}`;

    // Call Replicate AI — using flux-2-pro for best results
    const output = await replicate.run(
      "black-forest-labs/flux-2-pro",
      {
        input: {
          prompt: stylePrompts[style],
          image: base64Image,
          prompt_strength: 0.8,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          output_format: "webp",
          output_quality: 90,
          aspect_ratio: "3:4"
        }
      }
    );

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Return the generated image URL
    res.json({
      success: true,
      imageUrl: output,
      style: style,
      message: `Your ${style} portrait is ready. Uyindoda / Uyinkosazana.`
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      error: 'Portrait generation failed. Please try again.',
      details: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Mntu Omnyama is alive 👑' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   MNTU OMNYAMA — Server Running        ║
  ║   By Isidima Vuka Sizwe Sakuthi        ║
  ║   http://localhost:${PORT}               ║
  ╚════════════════════════════════════════╝
  `);
});
