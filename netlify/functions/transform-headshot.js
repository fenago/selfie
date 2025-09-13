import { GoogleGenAI } from '@google/genai';
import busboy from 'busboy';

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

export const handler = async (event, context) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse multipart form data
    const { file, mimeType } = await parseMultipartForm(event);
    
    if (!file) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'No image file uploaded' }),
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
      };
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    // Convert file buffer to base64
    const base64Image = file.toString('base64');
    
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
              mimeType: mimeType,
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
    let imageMimeType = null;
    let textContent = '';
    
    for await (const chunk of response) {
      if (!chunk.candidates || !chunk.candidates[0].content || !chunk.candidates[0].content.parts) {
        continue;
      }
      if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        imageData = inlineData.data;
        imageMimeType = inlineData.mimeType || 'image/jpeg';
        break; // We got the image, we can stop
      } else if (chunk.text) {
        textContent += chunk.text;
      }
    }
    
    if (imageData) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          image: `data:${imageMimeType};base64,${imageData}`,
          mimeType: imageMimeType
        }),
      };
    } else if (textContent) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'The model returned text instead of an image. Please try again.',
          text: textContent
        }),
      };
    } else {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to generate headshot image'
        }),
      };
    }
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to process image'
      }),
    };
  }
};

// Helper function to parse multipart form data
function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: event.headers });
    let file = null;
    let mimeType = null;

    bb.on('file', (name, stream, info) => {
      const { filename, encoding, mimeType: mime } = info;
      mimeType = mime;
      const chunks = [];
      
      stream.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        file = Buffer.concat(chunks);
      });
    });

    bb.on('finish', () => {
      resolve({ file, mimeType });
    });

    bb.on('error', reject);

    const buffer = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
    bb.end(buffer);
  });
}
