import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// Professional headshot prompt
const HEADSHOT_PROMPT = `The Universal Corporate Headshot Prompt
Subject & Composition:
Create a photorealistic, high-resolution corporate headshot of the individual from the provided image, framed from the chest up. The subject should be rendered with a confident yet approachable expression, featuring a subtle and genuine smile to convey trustworthiness and professionalism. Ensure their posture is upright and relaxed, with shoulders slightly angled towards the camera for a dynamic composition.
Professional Attire:
Dress the subject in sharp, contemporary business attire. This should consist of a well-tailored dark suit jacket, in either navy blue or charcoal gray, worn over a crisp, white or light-blue collared shirt or blouse. The clothing must appear to be of high-quality fabric, perfectly fitted, and free of any wrinkles.
Studio Lighting:
Employ a classic and flattering studio lighting scheme. Use a soft key light to gently define and sculpt the facial features (loop lighting is preferred). Add a subtle fill light to soften shadows on the opposite side of the face, ensuring detail is preserved. Include a gentle hair light or rim light from behind to create clear separation from the background. It is critical that there are distinct, professional catchlights visible in the subject's eyes to bring them to life.
Background:
Place the subject against a seamless, solid, neutral-gray studio background. The background should be clean and unobtrusive, featuring a subtle, smooth gradient that is slightly darker at the bottom and lighter towards the top. This will add a sense of depth while ensuring the subject remains the sole focus.
Photographic Specifications:
The final image must emulate the quality of a professional DSLR camera equipped with an 85mm prime portrait lens, shot at an aperture of f/2.8. This will produce a shallow depth of field, rendering the subject's eyes and facial features in tack-sharp focus while the background is softly and pleasingly blurred (bokeh). The final output must be high-resolution, sharp, and entirely free of digital noise or artifacts.`;

// Transform headshot endpoint
app.post('/transform-headshot', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    // Convert uploaded file to base64
    const base64Image = req.file.buffer.toString('base64');
    
    const config = {
      responseModalities: [
        'IMAGE',
        'TEXT',
      ],
    };
    const model = 'gemini-2.5-flash-image-preview';
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: HEADSHOT_PROMPT,
          },
          {
            inlineData: {
              mimeType: req.file.mimetype,
              data: base64Image
            }
          }
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });
    
    let imageData = null;
    let mimeType = null;
    let textContent = '';
    
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        imageData = inlineData.data;
        mimeType = inlineData.mimeType || 'image/jpeg';
        break; // We got the image, we can stop
      } else if (chunk.text) {
        textContent += chunk.text;
      }
    }
    
    if (imageData) {
      res.json({
        success: true,
        image: `data:${mimeType};base64,${imageData}`,
        mimeType: mimeType
      });
    } else if (textContent) {
      res.json({
        success: false,
        error: 'The model returned text instead of an image. Please try again.',
        text: textContent
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to generate headshot image'
      });
    }
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process image'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
