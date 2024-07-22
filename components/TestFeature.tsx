// components/TestFeature.tsx
import React, { useState } from 'react';

// Configuration object to toggle functions
const functionConfig = {
  commitNonExistingDocs: false,
  commitNonExistingComments: false,
  commitNonExistingDocsWithComments: false,
  getDocBodyAndCommitToGitHub: false,
  getDocCommentsAndCommitToGitHub: false,
  getDocBodyAndCommentsAndCommitToGitHub: false,
  testGoogle: true
};

const TestFeature: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const processDocuments = async () => {
    try {
      // Test document
      const docs = [{
        all_copy_ids: [
          "138l65anrTcChI8Nz21QolFzv6_4xgizUQB7W46P_MAk",
          "1RnBAR3Tc5QqIxYut6lOCcaVf3pPju_f3hr5hsP72znI",
          "1RhgKX4f5IyLGk1gZx2P_gwvDZyPe686ly-kh3oy0xU8"
        ],
        doc_type: "googleDocs",
        google_id: "1eHe5PmGPpjlX7VpCxQECOHwXDEl5RRnQ1jVyUhus1tg",
        latest_copy_g_id: "",
        sharing_status: "pending",
        workgroup: "Test-Workgroup",
        entity: "Tests"
      }];

      // Process each document (assuming single document for simplicity)
      const batch = docs;

      // These two functions will always run
      const statusChangeResponse = await fetch('/.netlify/functions/checkStatusChanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: batch, test: false }),
      }).then((res) => res.json());

      const recentChangesResponse = await fetch('/.netlify/functions/checkRecentChanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: batch }),
      }).then((res) => res.json());

      console.log('Status Change Response:', statusChangeResponse);
      console.log('Recent Changes Response:', recentChangesResponse);

      // Configurable functions
      if (functionConfig.commitNonExistingDocs) {
        await fetch('/.netlify/functions/commitNonExistingDocs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs: batch, test: false }),
        });
        console.log('Executed: commitNonExistingDocs');
      }

      if (functionConfig.commitNonExistingComments) {
        await fetch('/.netlify/functions/commitNonExistingComments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs: batch, test: false }),
        });
        console.log('Executed: commitNonExistingComments');
      }

      if (functionConfig.commitNonExistingDocsWithComments) {
        await fetch('/.netlify/functions/commitNonExistingDocsWithComments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs: batch, test: false }),
        });
        console.log('Executed: commitNonExistingDocsWithComments');
      }

      if (recentChangesResponse.length > 0) {
        if (functionConfig.getDocBodyAndCommitToGitHub) {
          await fetch('/.netlify/functions/getDocBodyAndCommitToGitHub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ docs: batch, recentChangesResponse, test: false }),
          });
          console.log('Executed: getDocBodyAndCommitToGitHub');
        }

        if (functionConfig.getDocCommentsAndCommitToGitHub) {
          await fetch('/.netlify/functions/getDocCommentsAndCommitToGitHub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ docs: batch, recentChangesResponse, test: false }),
          });
          console.log('Executed: getDocCommentsAndCommitToGitHub');
        }

        if (functionConfig.getDocBodyAndCommentsAndCommitToGitHub) {
          await fetch('/.netlify/functions/getDocBodyAndCommentsAndCommitToGitHub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ docs: batch, recentChangesResponse, test: false }),
          });
          console.log('Executed: getDocBodyAndCommentsAndCommitToGitHub');
        }

        if (functionConfig.testGoogle) {
            await fetch('/.netlify/functions/testGoogle', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ docs: batch, recentChangesResponse, test: false }),
            });
            console.log('Executed: testGoogle');
          }
      }

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
      {loading ? 'Processing...' : 'Test feature'}
    </button>
  );
};

export default TestFeature;