// utils/processNewDocument.ts

interface Document {
    google_id: string;
    title: string;
    workgroup: string;
    entity: string;
    sharing_status: string;
    url: string;
    doc_type: string;
  }
  
  export async function processNewDocument(newDoc: Document) {
    try {
      // Wrap the new document in an array as most functions expect an array of docs
      const docArray = [newDoc];
  
      // Check status changes
      const statusChangeResponse = await fetch('/.netlify/functions/checkStatusChanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: docArray, test: false }),
      }).then(res => res.json());
  
      // Check recent changes
      const recentChangesResponse = await fetch('/.netlify/functions/checkRecentChanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: docArray }),
      }).then(res => res.json());
  
      // Process status changes if any
      if (statusChangeResponse.length > 0) {
        // Copy changed docs
        await fetch('/.netlify/functions/copyChangedDocs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs: docArray, statusChangeResponse, test: false }),
        });
  
        // Get and save document text
        await fetch('/.netlify/functions/getDocText', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs: docArray, statusChangeResponse, test: false }),
        });
      }
  
      // Commit non-existing docs
      await fetch('/.netlify/functions/commitNonExistingDocs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: docArray, test: false }),
      });
  
      // Commit non-existing comments
      await fetch('/.netlify/functions/commitNonExistingComments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: docArray, test: false }),
      });
  
      // Commit non-existing docs with comments
      await fetch('/.netlify/functions/commitNonExistingDocsWithComments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docs: docArray, test: false }),
      });
  
      // Process recent changes if any
      if (recentChangesResponse.length > 0) {
        // Commit document bodies to GitHub
        await fetch('/.netlify/functions/getDocBodyAndCommitToGitHub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs: docArray, recentChangesResponse, test: false }),
        });
  
        // Commit document comments to GitHub
        await fetch('/.netlify/functions/getDocCommentsAndCommitToGitHub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs: docArray, recentChangesResponse, test: false }),
        });
  
        // Commit document body and comments to GitHub
        await fetch('/.netlify/functions/getDocBodyAndCommentsAndCommitToGitHub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docs: docArray, recentChangesResponse, test: false }),
        });
      }
  
      console.log('New document processed successfully');
    } catch (error) {
      console.error('Error processing new document:', error);
    }
  }