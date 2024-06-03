// components/ProcessUpdates.tsx
import { useState } from 'react';

const ProcessUpdates = () => {
  const [loading, setLoading] = useState(false);

  const processDoc = async (doc: any) => {
    try {
      // Call the getDocCommitsAndCreateMarkdown function for a single document
      await fetch('/.netlify/functions/getDocCommitsAndCreateMarkdown', {
        method: 'POST',
        body: JSON.stringify(doc),
      });
    } catch (error) {
      console.error('Error processing document:', error);
    }
  };

  const handleClick = async () => {
    try {
      setLoading(true);

      // Make a call to your getAllDocs Netlify function
      const response = await fetch('/.netlify/functions/getAllDocs');
      const data = await response.json();

      // Check if the response is valid
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response from getAllDocs function');
      }
      const docs = data;

      console.log("docs:", docs);

      // Process each document sequentially
      for (const doc of docs) {
        await processDoc(doc);
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Processing...' : 'Update Doc logs'}
    </button>
  );
};

export default ProcessUpdates;