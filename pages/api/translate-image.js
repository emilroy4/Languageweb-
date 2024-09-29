import formidable from 'formidable';
import fs from 'fs';
import sharp from 'sharp';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false, // This is important to handle the file upload manually
  },
};

export default async function handler(req, res) {
  console.log('API hit!'); // Check if the API is being called

  if (req.method === 'POST') {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ error: 'Error parsing form' });
      }

      try {
        console.log('File received, starting processing...');

        const file = files.file[0]; // Access the first file
        const imagePath = file.filepath || file.path; // Path of the uploaded file
        const imageBuffer = fs.readFileSync(imagePath);

        // Resize the image using sharp
        const resizedImageBuffer = await sharp(imageBuffer)
          .resize({ width: 800 }) // Resize image to a max width of 800px
          .jpeg({ quality: 80 }) // Lower quality to 80% to reduce size
          .toBuffer();

        const imageBase64 = resizedImageBuffer.toString('base64');
        const language = fields.language;

        console.log('Image processed, sending to GPT-4...');

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

        console.log('GPT-4 response received.');

        const mainObject = response.choices[0].message.content;

        // Send the translation result back to the client
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
