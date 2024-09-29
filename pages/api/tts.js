import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    // Decode the Base64 string from the environment variable
    const base64Credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
    const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf8');

    // Save the credentials to a temporary location
    const credentialsPath = path.join('/tmp', 'tts-credentials.json');
    fs.writeFileSync(credentialsPath, decodedCredentials);

    // Set the GOOGLE_APPLICATION_CREDENTIALS environment variable to point to the temp file
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

    const client = new TextToSpeechClient();

    const request = {
      input: { text: req.body.text },
      voice: { languageCode: req.body.languageCode, ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);
    const audioContent = response.audioContent.toString('base64');

    res.status(200).json({ audioBase64: audioContent });
  } catch (error) {
    console.error('Error with TTS:', error);
    res.status(500).json({ error: 'Error processing text-to-speech' });
  }
}
