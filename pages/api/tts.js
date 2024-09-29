const textToSpeech = require('@google-cloud/text-to-speech');
const util = require('util');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { text, languageCode } = req.body;

    // Creates a client
    const client = new textToSpeech.TextToSpeechClient();

    // Construct the request
    const request = {
      input: { text: text },
      voice: { languageCode: languageCode, ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    try {
      // Performs the Text-to-Speech request
      const [response] = await client.synthesizeSpeech(request);

      // Return base64-encoded audio content instead of writing to a file
      const audioBase64 = Buffer.from(response.audioContent, 'binary').toString('base64');
      res.status(200).json({ audioBase64 });
    } catch (error) {
      console.error('ERROR:', error);
      res.status(500).json({ error: 'Text-to-Speech failed' });
    }
  } else {
    res.status(405).json({ message: 'Only POST requests allowed' });
  }
}
