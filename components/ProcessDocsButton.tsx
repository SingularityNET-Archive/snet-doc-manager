// components/ProcessDocsButton.tsx
import { useState } from 'react';

const ProcessDocsButton = () => {
  const [loading, setLoading] = useState(false);

  const processDocuments = async () => {
    try {
      // Make a call to your getAllDocs Netlify function
      const response = await fetch('/.netlify/functions/getAllDocs');
      const data = await response.json();

      // Check if the response is valid
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid response from getAllDocs function');
      }

      const docs = data;

      // Break documents into batches
      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < docs.length; i += batchSize) {
        batches.push(docs.slice(i, i + batchSize));
      }

      // Process each batch by calling your processDocs Netlify function
      const processedResults = [];
      for (const batch of batches) {
        const response = await fetch('/.netlify/functions/processDocs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ docs: batch, test: false }),
        });
        const result = await response.json();
        processedResults.push(result);

        const { docs, statusChangeResponse } = result;
        if (statusChangeResponse.length > 0) {
          // Pass docs and statusChangeResponse to copyChangedDocs
          await fetch('/.netlify/functions/copyChangedDocs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ docs, statusChangeResponse, test: false }), // turn test to true if you dont want to make copies of documents
          });

          // Call getDocText Netlify function to retrieve and save document text for changed documents
          await fetch('/.netlify/functions/getDocText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ docs: batch, statusChangeResponse, test: false }),
          });

          // Call getDocBodyAndCommitToGitHub Netlify function to commit document bodies to GitHub

          await fetch('/.netlify/functions/getDocBodyAndCommitToGitHub', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ docs: batch, statusChangeResponse, test: false }),
          });
        }
      }

      console.log(processedResults);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleClick = async () => {
    setLoading(true);
    await processDocuments();
    setLoading(false);
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? 'Processing...' : 'Process Docs'}
    </button>
  );
};

export default ProcessDocsButton;