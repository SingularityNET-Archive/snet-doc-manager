import { google } from 'googleapis';
//import { getOAuth2Client } from '../utils/oauth2Client';
import { getGoogleAuth } from '../utils/googleAuth';
import { sendErrorMessageToDiscord } from '../utils/discordWebhook';

//const oauth2Client = getOAuth2Client();
const auth = getGoogleAuth();

export async function getDocumentComments(doc, date = null) {
    const drive = google.drive({ version: 'v3', auth: auth });
    const fileId = date ? doc.originalDocId : doc.google_id;
    console.log('File ID:', fileId, date);

    try {
      const commentsResponse = await drive.comments.list({
        fileId: fileId,
        fields: 'comments(id,author,content,quotedFileContent,anchor,replies(author,content))',
      });
  
      const commentsData = commentsResponse.data.comments;
  
      console.log('Document ID:', fileId);
      console.log('Comments Data:', commentsData);
  
      let commentsText = '';
  
      commentsData.forEach((comment) => {
        const resolvedReply = comment.replies.find((reply) => reply.content === '');
        const isResolved = resolvedReply !== undefined;
  
        if (comment.quotedFileContent) {
          commentsText += `#### Context - ${comment.quotedFileContent.value}\n`;
        }
  
        commentsText += `> * ${comment.author.displayName}: ${comment.content}`;
  
        if (isResolved) {
          commentsText += ` (Resolved by ${resolvedReply.author.displayName})\n`;
        } else {
          commentsText += '\n';
        }

        comment.replies.forEach((reply) => {
            if (reply.content !== '') {
              commentsText += `>   - ${reply.author.displayName}: ${reply.content}\n`;
            }
          });
  
        commentsText += '> \n';
      });
  
      return commentsText;
    } catch (error) {
      if (error.code === 403) {
        console.warn('Access denied for document:', fileId);
        await sendErrorMessageToDiscord(`Access denied for document: ${fileId}`);
        return true;
      } else if (error.code === 404) {
        console.warn('File not found:', fileId);
        await sendErrorMessageToDiscord(`File not found: ${fileId}`);
        return true;
      } else if (error.code === 401 && error.message.includes('invalid_grant')) {
        console.error('Refresh token expired. Please obtain a new refresh token.');
        await sendErrorMessageToDiscord('Google Refresh Token Expired. Please obtain a new refresh token.');
        throw error;
      } else {
        console.error('Failed to retrieve document comments:', error);
        await sendErrorMessageToDiscord(`Failed to retrieve document comments ${fileId}: ${error.message}`);
        throw error;
      }
    }
  }