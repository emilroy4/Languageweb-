import formidable from 'formidable';
import fs from 'fs';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Set the payload size limit to 10 MB
    },
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Error parsing form' });
      }

      try {
        const file = files.file[0]; // Access the first file in the array
        const imagePath = file.filepath || file.path; // Path of the uploaded file
        const imageBuffer = fs.readFileSync(imagePath);

        const imageBase64 = imageBuffer.toString('base64');
        const language = fields.language;

        // Send the resized image to GPT-4 for object recognition
        const client = new OpenAI(process.env.OPENAI_API_KEY);
        const response = await client.chat.completions.create({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `You are a world-class visual translator. Please study the image carefully and identify the main object or location that is depicted. Just return 3 things: Translated word, Romanization (if possible), and in English. Return it in the following language: ${language}. If Romanization is not possible, omit it.`,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 100, // Limit tokens to reduce response time
        });

        const mainObject = response.choices[0].message.content;

        res.status(200).json({ translation: mainObject });
      } catch (fileError) {
        console.error('Error processing file:', fileError);
        res.status(500).json({ error: 'File processing error' });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
