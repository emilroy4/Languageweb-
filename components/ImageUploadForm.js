import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';

export default function ImageUploadForm() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [language, setLanguage] = useState('en');
  const [translation, setTranslation] = useState('');
  const [romanization, setRomanization] = useState('');
  const [english, setEnglish] = useState('');

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

      // Clean the response to remove unwanted prefixes
      const cleanedTranslation = cleanText(data.translation || ''); // Clean translation
      const cleanedRomanization = cleanText(data.romanization || ''); // Clean romanization if available
      const cleanedEnglish = cleanText(data.english || ''); // Clean English translation

      // Set the cleaned values
      setTranslation(cleanedTranslation);
      setRomanization(cleanedRomanization);
      setEnglish(cleanedEnglish);

      // Pass only cleaned values to TTS
      speakTranslation(cleanedTranslation, cleanedEnglish);
    }
  };

  // Helper function to clean the text by removing unwanted prefixes
  const cleanText = (text) => {
    return text
      .replace(/Translated word: /i, '') // Remove 'Translated word: ' if it exists
      .replace(/Romanization: /i, '') // Remove 'Romanization: ' if it exists
      .replace(/In English: /i, '') // Remove 'In English: ' if it exists;
      .trim(); // Clean any extra spaces
  };

  const speakTranslation = (translation, english) => {
    const speechText = `${translation}. ${english}`.trim(); // Concatenate cleaned translation and English
    if (speechText) {
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = language === 'en' ? 'en-US' : language; // Set correct language for TTS
      speechSynthesis.speak(utterance);
    }
  };

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
        <div className="translation-result" style={translationResultStyle}>
          <div style={translationStyle}>{translation}</div>
          {romanization && romanization !== translation && (
            <div style={romanizationStyle}>({romanization})</div>
          )}
          {english && english !== translation && <div style={englishStyle}>{english}</div>}
          <button style={buttonStyle} onClick={() => speakTranslation(translation, english)}>
            Play Translation
          </button>
        </div>
      )}
    </div>
  );
}

// Inline styles for the display
const translationResultStyle = {
  textAlign: 'center',
  marginTop: '20px',
  lineHeight: '1.6', // Add spacing between the lines
};

const translationStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '10px', // Add margin to space it from the next line
};

const romanizationStyle = {
  fontSize: '18px',
  color: '#888', // Grey color for romanization
  marginBottom: '10px', // Space between romanization and English
};

const englishStyle = {
  fontSize: '16px',
  marginTop: '5px',
  marginBottom: '10px',
};

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#007bff',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  marginTop: '10px',
};
