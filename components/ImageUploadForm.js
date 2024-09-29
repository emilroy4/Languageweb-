import React, { useState, useEffect, useRef } from 'react';
import imageCompression from 'browser-image-compression';

export default function ImageUploadForm() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [language, setLanguage] = useState('en'); // Default language set to English
  const [translation, setTranslation] = useState('');
  const [romanization, setRomanization] = useState('');
  const [english, setEnglish] = useState('');
  const [audioBase64, setAudioBase64] = useState('');
  
  // Reference to the audio element
  const audioRef = useRef(null);

  const handleImageUpload = async (e) => {
    const imageFile = e.target.files[0];

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };

    try {
      const compressedImage = await imageCompression(imageFile, options);
      setImage(compressedImage);
      setImagePreview(URL.createObjectURL(imageFile)); // Show image preview
    } catch (error) {
      console.log('Error during image compression:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (image) {
      const formData = new FormData();
      formData.append('file', image);
      formData.append('language', language);

      const res = await fetch('/api/translate-image', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      // Filter out "Not applicable" or empty romanization
      if (language === 'en' || language === 'es' || data.romanization === 'Not applicable') {
        setRomanization(''); // Clear romanization for English, Spanish, and "Not applicable"
      } else {
        setRomanization(data.romanization || '');
      }

      setTranslation(data.translation || '');
      setEnglish(data.english || '');
    }
  };

  const handleTTS = async () => {
    const speechText = language === 'en' ? translation : `${translation} ${english}`.trim(); // Only include English for non-English translations

    if (speechText) {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: speechText,
          languageCode: language, // Send the selected language code
        }),
      });

      const data = await res.json();
      setAudioBase64(data.audioBase64);
    }
  };

  useEffect(() => {
    if (audioBase64 && audioRef.current) {
      audioRef.current.play();
    }
  }, [audioBase64]);

  return (
    <div className="container">
      <h1>Image Translation App</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en">🇺🇸 English</option>
          <option value="es">🇪🇸 Spanish</option>
          <option value="ko">🇰🇷 Korean</option>
          <option value="zh">🇨🇳 Chinese</option>
          <option value="hi">🇮🇳 Hindi</option>
        </select>
        <button type="submit">Translate</button>
      </form>

      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt="Selected" style={{ maxWidth: '100%', height: 'auto' }} />
        </div>
      )}

      {translation && (
        <div className="translation-result" style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ marginBottom: '10px' }}>{translation}</p>
          {/* Only render romanization if it's not "Not applicable" and not empty */}
          {romanization && (
            <p style={{ marginBottom: '10px' }}>{romanization}</p>
          )}
          {/* Only show English translation if the selected language is not English */}
          {language !== 'en' && <p style={{ marginBottom: '10px' }}>{english}</p>}
          <div style={{ marginBottom: '20px' }}>
            <button onClick={handleTTS} style={{ display: 'block', margin: '0 auto' }}>
              Play Translation
            </button>
          </div>
          {audioBase64 && (
            <audio
              controls
              src={`data:audio/mp3;base64,${audioBase64}`}
              ref={audioRef}
              style={{ display: 'block', margin: '0 auto' }}
            />
          )}
        </div>
      )}
    </div>
  );
}
