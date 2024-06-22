// ../netlify/functions/commitNonExistingComments.js
import { Octokit } from '@octokit/rest';
import { getDocumentComments } from '../../utils/getDocumentComments';

async function commitNonExistingCommentsToGitHub(docs) {
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

    if (!existingFileNames.has("doc-comments-only")) {
      const comments = await getDocumentComments(doc);
      // Check if the generated Markdown content includes context
      if (comments.includes('#### Context - ')) {
        await octokit.repos.createOrUpdateFileContents({
          owner: "SingularityNET-Archive",
          repo: "SingularityNET-Archive",
          path: `${path}/doc-comments-only.md`,
          message: `Add document comments for ${doc.google_id}`,
          content: Buffer.from(comments).toString('base64'),
        });
      } else {
        console.log(`No context found for document ${doc.google_id}. Skipping commit.`);
      }
    }
  }
}
  
  export async function handler(event, context) {
    try {
      const { docs, test } = JSON.parse(event.body);
      if (!test) {
        await commitNonExistingCommentsToGitHub(docs);
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