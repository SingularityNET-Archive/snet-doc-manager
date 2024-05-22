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

      // Process each batch
      const processedResults = [];
      for (const batch of batches) {
        // Call checkStatusChanges Netlify function
        const statusChangeResponse = await fetch('/.netlify/functions/checkStatusChanges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ docs: batch, test: false }),
        }).then((res) => res.json());

        // Call checkRecentChanges Netlify function
        const recentChangesResponse = await fetch('/.netlify/functions/checkRecentChanges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ docs: batch }),
        }).then((res) => res.json());

        // Call getDocComments Netlify function
        const commentsResponse = await fetch('/.netlify/functions/getDocComments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ docs: batch, test: false }),
        }).then((res) => res.json());

        processedResults.push({ statusChangeResponse, recentChangesResponse, commentsResponse });

        if (statusChangeResponse.length > 0) {
          for (const changedDocId of statusChangeResponse) {
            const changedDoc = batch.find((doc: any) => doc.google_id === changedDocId);
            if (changedDoc) {
              // Delete the last copy from Google Drive
              if (changedDoc.all_copy_ids.length > 0) {
                const lastCopyId = changedDoc.all_copy_ids[changedDoc.all_copy_ids.length - 1];
                await fetch('/.netlify/functions/deleteFileFromDrive', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ fileId: lastCopyId }),
                });
              }
            }
          }

          // Pass docs and statusChangeResponse to copyChangedDocs
          await fetch('/.netlify/functions/copyChangedDocs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ docs: batch, statusChangeResponse, test: false }),
          });

          // Call getDocText Netlify function to retrieve and save document text for changed documents
          await fetch('/.netlify/functions/getDocText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ docs: batch, statusChangeResponse, test: false }),
          });
        }

        if (recentChangesResponse.length > 0) {
          // Call getDocBodyAndCommitToGitHub Netlify function to commit document bodies to GitHub
          await fetch('/.netlify/functions/getDocBodyAndCommitToGitHub', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ docs: batch, recentChangesResponse, test: false }),
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