import React, { useState } from 'react';
import imageCompression from 'browser-image-compression';

export default function ImageUploadForm() {
  const [image, setImage] = useState(null);
  const [language, setLanguage] = useState('en');
  const [translation, setTranslation] = useState('');

  const handleImageUpload = async (e) => {
    const imageFile = e.target.files[0];

    // Compression options (from earlier)
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };

    try {
      const compressedImage = await imageCompression(imageFile, options);
      setImage(compressedImage);
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
      setTranslation(data.translation);

      // Trigger Text-to-Speech after translation
      speakTranslation(data.translation);
    }
  };

  // Text-to-Speech function
  const speakTranslation = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'en' ? 'en-US' : language; // You can customize the language based on user selection
    speechSynthesis.speak(utterance);
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="ko">Korean</option>
          <option value="zh">Chinese</option>
          <option value="hi">Hindi</option>
        </select>
        <button type="submit">Translate</button>
      </form>
      {translation && (
        <div>
          <p>Translated: {translation}</p>
          <button onClick={() => speakTranslation(translation)}>Play Translation</button>
        </div>
      )}
    </div>
  );
}
