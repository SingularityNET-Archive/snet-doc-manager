// ../netlify/functions/getDocBodyAndCommentsAndCommitToGitHub.js
import { Octokit } from '@octokit/rest';
import { getDocumentComments } from '../../utils/getDocumentComments';

async function commitDocumentCommentsToGitHub(docs, date = null) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  for (const doc of docs) {
    const documentTextAndComments = await getDocumentComments(doc, date);
    console.log('Generated Markdown:', documentTextAndComments);

    // Check if the generated Markdown content includes comments
    if (documentTextAndComments.includes('#### Context - ')) {
      let path;
      if (date) {
        path = `Data/${doc.entity}/Content/${doc.workgroup}/Docs/GoogleDocs/${doc.originalDocId}/Archive-copies/${date}/${doc.google_id}/doc-comments-only.md`;
      } else {
        path = `Data/${doc.entity}/Content/${doc.workgroup}/Docs/GoogleDocs/${doc.google_id}/doc-comments-only.md`;
      }
      let currentSHA = null;
      try {
        const { data: currentFile } = await octokit.repos.getContent({
          owner: "SingularityNET-Archive",
          repo: "SingularityNET-Archive",
          path,
        });
        currentSHA = currentFile.sha;
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
      }
      await octokit.repos.createOrUpdateFileContents({
        owner: "SingularityNET-Archive",
        repo: "SingularityNET-Archive",
        path,
        message: `Update document comments for ${doc.google_id}${date ? ` on ${date}` : ''}`,
        content: Buffer.from(documentTextAndComments).toString('base64'),
        sha: currentSHA,
      });
    } else {
      console.log(`No comments found for document ${date ? doc.originalDocId : doc.google_id}. Skipping commit. ${date}`);
    }
  }
}

export async function handler(event, context) {
  try {
    // Get the documents, test flag, and date from the request body
    const { docs, recentChangesResponse, test, date } = JSON.parse(event.body);
    const docsToCommit = docs.filter(doc => recentChangesResponse.includes(doc.google_id));
    // Process each document
    if (!test) {
      // Process each document
      await commitDocumentCommentsToGitHub(docsToCommit, date);
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Document text and comments retrieved and committed successfully' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
}