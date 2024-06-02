// components/TestDocument.tsx
import { useState } from 'react';

const TestDocument = () => {
  const [loading, setLoading] = useState(false);

  const processDocuments = async () => {
    try {
      // Test document
      const docs = [{
        all_copy_ids: [
          "1eGGomRx1voTpp_WfjLQqO5IVSrBSGc0gngVkcSx940k",
          "16HmDiG8b8Qbb4FKQOg2S4g3t4fgKKqA8AMsmYZDYMzQ",
          "1r7N9Kb3iQCFq2VwB9hOVGvv4VYKAFh99x7DdNXeVhaI"],
        doc_type: "googleDocs",
        google_id: "1uebknjv2fZVFEOnTZFex_u6IWQoddDLEZq9o_U01pU8",
        latest_copy_g_id: "",
        sharing_status: "pending",
        workgroup: "Test-Workgroup",
        entity: "Tests"
      }];

      // Break documents into batches
      const batchSize = 1;
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

        processedResults.push({ statusChangeResponse, recentChangesResponse });

        if (statusChangeResponse.length > 0) {
          for (const changedDocId of statusChangeResponse) {
            const changedDoc = batch.find((doc: any) => doc.google_id === changedDocId);
            if (changedDoc) {
              // Delete the first copy from Google Drive
              if (changedDoc.all_copy_ids.length > 2) {
                const lastCopyId = changedDoc.all_copy_ids[0];
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

        // Call commitNonExistingDocs Netlify function to commit non-existing docs
        await fetch('/.netlify/functions/commitNonExistingDocs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ docs: batch, test: false }),
        });
        // Call commitNonExistingComments Netlify function to commit non-existing docs
        await fetch('/.netlify/functions/commitNonExistingComments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ docs: batch, test: false }),
        });
        // Call commitNonExistingDocsWithComments Netlify function to commit non-existing docs
        await fetch('/.netlify/functions/commitNonExistingDocsWithComments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ docs: batch, test: false }),
        });

        if (recentChangesResponse.length > 0) {
          // Call getDocBodyAndCommitToGitHub Netlify function to commit document bodies to GitHub
          await fetch('/.netlify/functions/getDocBodyAndCommitToGitHub', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ docs: batch, recentChangesResponse, test: false }),
          });
          await fetch('/.netlify/functions/getDocCommentsAndCommitToGitHub', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ docs: batch, recentChangesResponse, test: false }),
          });
          await fetch('/.netlify/functions/getDocBodyAndCommentsAndCommitToGitHub', {
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
      {loading ? 'Processing...' : 'Test doc'}
    </button>
  );
};

export default TestDocument;