import { useState } from 'react';
import imageCompression from 'browser-image-compression';

export default function ImageUploadForm() {
  const [image, setImage] = useState(null);
  const [language, setLanguage] = useState('en');
  const [translation, setTranslation] = useState('');

  const handleImageUpload = async (e) => {
    const imageFile = e.target.files[0];

    // Compression options
    const options = {
      maxSizeMB: 1, // Max file size of 1 MB
      maxWidthOrHeight: 800, // Max width/height of 800px
      useWebWorker: true, // Enable web worker for performance
    };

    try {
      // Compress the image
      const compressedImage = await imageCompression(imageFile, options);
      console.log('Compressed image:', compressedImage);

      setImage(compressedImage); // Set compressed image for further processing
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
    }
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
      {translation && <p>Translated: {translation}</p>}
    </div>
  );
}
