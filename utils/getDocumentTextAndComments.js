// utils/getDocBodyAndComments.js
import { google } from 'googleapis';
import { getOAuth2Client } from '../utils/oauth2Client';
import { sendErrorMessageToDiscord } from '../utils/discordWebhook';

const oauth2Client = getOAuth2Client();

export async function getDocumentTextAndComments(doc) {
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
  
    try {
      const [response, commentsResponse] = await Promise.all([
        docs.documents.get({ documentId: doc.google_id }),
        drive.comments.list({
          fileId: doc.google_id,
          fields: 'comments(id,author,content,quotedFileContent,anchor,replies(author,content))',
        }),
      ]);
  
      const content = response.data.body.content;
      const commentsData = commentsResponse.data.comments;
  
      //console.log('Document ID:', doc.google_id);
      //console.log('Comments Data:', commentsData);
  
      let docText = '';
      let isTitleFound = false;
      const addedCommentIds = [];
  
      content.forEach((element) => {
        if (element.paragraph) {
          let headingLevel = 0;
          if (element.paragraph.paragraphStyle && element.paragraph.paragraphStyle.namedStyleType) {
            const styleType = element.paragraph.paragraphStyle.namedStyleType;
            if (styleType === 'TITLE' && !isTitleFound) {
              headingLevel = 1;
              isTitleFound = true;
            } else if (styleType === 'HEADING_1') {
              headingLevel = 1;
            } else if (styleType === 'HEADING_2') {
              headingLevel = 2;
            } else if (styleType === 'HEADING_3') {
              headingLevel = 3;
            } else if (styleType === 'HEADING_4') {
              headingLevel = 4;
            } else if (styleType === 'HEADING_5') {
              headingLevel = 5;
            } else if (styleType === 'HEADING_6') {
              headingLevel = 6;
            }
          }
          let paragraphText = '';
          let isBold = false;
          element.paragraph.elements.forEach((el) => {
            if (el.textRun && el.textRun.content) {
              const text = el.textRun.content.replace(/\n/g, '').trim();
              const style = el.textRun.textStyle;
              if (style && style.bold && headingLevel === 0) {
                if (!isBold) {
                  paragraphText += '**';
                  isBold = true;
                }
                paragraphText += text;
                if (text.endsWith(' ')) {
                  paragraphText += '** ';
                  isBold = false;
                }
              } else {
                if (isBold) {
                  paragraphText += '** ';
                  isBold = false;
                }
                paragraphText += text + ' ';
              }
            }
          });
          if (isBold) {
            paragraphText += '**';
          }
  
          // Check if there are any comments associated with this paragraph
          const comments = commentsData.filter((comment) => {
            if (comment.quotedFileContent && comment.quotedFileContent.value) {
              const quotedText = comment.quotedFileContent.value.replace(/\n/g, '').trim();
              return paragraphText.includes(quotedText) && !addedCommentIds.includes(comment.id);
            }
            return false;
          });
  
          // Filter out comments where the context text is not present in the paragraph
          const filteredComments = comments.filter((comment) => {
            if (comment.quotedFileContent && comment.quotedFileContent.value) {
              const quotedText = comment.quotedFileContent.value.replace(/\n/g, '').trim();
              return paragraphText.includes(quotedText);
            }
            return false;
          });
  
          //console.log('Paragraph Start Index:', element.startIndex);
          //console.log('Paragraph End Index:', element.endIndex);
          //console.log('Associated Comments:', comments);
  
          /*// Log comment details
          commentsData.forEach((comment) => {
            console.log('Comment ID:', comment.id);
            console.log('Comment Content:', comment.content);
            console.log('Comment QuotedFileContent:', comment.quotedFileContent ? comment.quotedFileContent : 'N/A');
            console.log('---');
          });*/
  
          // Add comments to the paragraph text
          if (filteredComments.length > 0) {
            paragraphText += '\n\n> [Comments]\n';
            filteredComments.forEach((comment, index) => {
              addedCommentIds.push(comment.id);
              const resolvedReply = comment.replies.find((reply) => reply.content === '');
              const isResolved = resolvedReply !== undefined;
    
              if (comment.quotedFileContent) {
                paragraphText += `> Context - ${comment.quotedFileContent.value}\n`;
              }
    
              paragraphText += `> * ${comment.author.displayName}: ${comment.content}`;
    
              if (isResolved) {
                paragraphText += ` (Resolved by ${resolvedReply.author.displayName})\n`;
              } else {
                paragraphText += '\n';
              }
    
              comment.replies.forEach((reply) => {
                if (reply.content !== '') {
                  paragraphText += `>   - ${reply.author.displayName}: ${reply.content}\n`;
                }
              });
              
              paragraphText += '>\n';
            });
          }
  
          if (headingLevel > 0 && paragraphText.trim() !== '') {
            docText += `${'#'.repeat(headingLevel)} ${paragraphText.trim()}\n\n`;
          } else {
            docText += paragraphText.trim() + '\n\n';
          }
        }
      });
  
      return docText;
    } catch (error) {
      if (error.code === 403) {
        console.warn('Access denied for document:', doc.google_id);
        await sendErrorMessageToDiscord(`Access denied for document: ${doc.google_id}`);
        return true;
      } else if (error.code === 404) {
        console.warn('File not found:', doc.google_id);
        await sendErrorMessageToDiscord(`File not found: ${doc.google_id}`);
        return true;
      } else if (error.code === 401 && error.message.includes('invalid_grant')) {
        console.error('Refresh token expired. Please obtain a new refresh token.');
        await sendErrorMessageToDiscord('Google Refresh Token Expired. Please obtain a new refresh token.');
        throw error;
      } else {
        console.error('Failed to retrieve document text and comments:', error);
        await sendErrorMessageToDiscord(`Failed to retrieve document text and comments ${doc.google_id}: ${error.message}`);
        throw error;
      }
    }
  }