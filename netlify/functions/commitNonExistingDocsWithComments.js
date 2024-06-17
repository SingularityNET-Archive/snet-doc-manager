// netlify/functions/commitNonExistingDocsWithComments.js
// Wont commit files where the comment's context has changed and is not present in the doc anymore
import { Octokit } from '@octokit/rest';
import { getDocumentTextAndComments } from '../../utils/getDocumentTextAndComments';

async function commitNonExistingDocsToGitHub(docs) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

  for (const doc of docs) {
    const existingFileNames = new Set();
    const path = `Data/${doc.entity}/Content/${doc.workgroup}/Docs/GoogleDocs/${doc.google_id}`;

    try {
      const { data: existingFiles } = await octokit.repos.getContent({
        owner: "SingularityNET-Archive",
        repo: "SingularityNET-Archive",
        path,
      });
      existingFiles.forEach((file) => {
        const fileName = file.name.replace(".md", "");
        existingFileNames.add(fileName);
      });
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
    }

    if (!existingFileNames.has("doc-with-comments")) {
      const textWithComments = await getDocumentTextAndComments(doc);
      // Check if the generated Markdown content includes comments
      if (textWithComments.includes('> [Comments]')) {
        await octokit.repos.createOrUpdateFileContents({
          owner: "SingularityNET-Archive",
          repo: "SingularityNET-Archive",
          path: `${path}/doc-with-comments.md`,
          message: `Add document text and comments for ${doc.google_id}`,
          content: Buffer.from(textWithComments).toString('base64'),
        });
      } else {
        console.log(`No comments found for document ${doc.google_id}. Skipping commit.`);
      }
    }
  }
}
  
  export async function handler(event, context) {
    try {
      const { docs, test } = JSON.parse(event.body);
      if (!test) {
        await commitNonExistingDocsToGitHub(docs);
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Non-existing docs committed successfully' }),
      };
    } catch (error) {
      console.error('Error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      };
    }
  }