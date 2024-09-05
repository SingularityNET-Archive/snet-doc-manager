// ../netlify/functions/checkStatusChanges.js
import { supabaseAdmin } from "../../lib/supabaseServerSideClient";
import { google } from "googleapis";
import { getOAuth2Client } from '../../utils/oauth2Client';
import { getGoogleAuth } from '../../utils/googleAuth';
import { sendErrorMessageToDiscord } from '../../utils/discordWebhook';

const oauth2Client = getOAuth2Client();
const auth = getGoogleAuth();

export const handler = async (event, context) => {
  const { docs, test } = JSON.parse(event.body);
  const changedDocs = [];

  function determineSharingStatus(permissions) {
    if (!permissions || permissions.length === 0) {
      return "view only"; // Handle case where no permissions are returned
    }

    let status = "view only"; // Default to the most restrictive

    permissions.forEach((permission) => {
      if (permission.type === "anyone") {
        if (permission.role === "writer") {
          status = "open";
        } else if (permission.role === "commenter") {
          status = "comment";
        } else {
          status = "view only";
        }
      }
      // Additional logic for 'user', 'group', 'domain' types can be added here
    });

    return status;
  }

  async function checkDocumentForChanges(doc) {
    const drive = google.drive({ version: "v3", auth: auth });
    try {
      // Attempt to fetch the document's current permissions
      const permissionsResponse = await drive.files.get({
        fileId: doc.google_id,
        fields: "id, name, permissions(id, type, role)",
      });
  
      // Determine the current sharing status based on permissions
      const currentStatus = determineSharingStatus(
        permissionsResponse.data.permissions
      );
  
      // Compare current status with the last known status stored in your database
      const hasStatusChanged =
        doc.sharing_status === null || currentStatus !== doc.sharing_status;
  
      if (hasStatusChanged && !test) {
        // Document sharing status has changed or was previously null, update the database
        await supabaseAdmin
          .from("documents")
          .update({
            sharing_status: currentStatus,
            previous_sharing_status: doc.sharing_status,
          })
          .match({ google_id: doc.google_id });
  
        console.log(
          `Updated sharing status for document ${doc.google_id} to ${currentStatus}`
        );
      }
  
      // Return whether there was a change in sharing status or not
      return hasStatusChanged;
    } catch (error) {
      if (error.code === 403) {
        console.warn('Access denied for document:', doc.google_id);
        await sendErrorMessageToDiscord(`Access denied for document: ${doc.google_id}`);
        
        if (!test) {
          // Update the sharing status to "access denied" in the database
          await supabaseAdmin
            .from("documents")
            .update({
              sharing_status: "access denied",
              previous_sharing_status: doc.sharing_status,
            })
            .match({ google_id: doc.google_id });
        }
  
        // Return true if the document's current sharing status is null or not "view only"
        return doc.sharing_status === null || doc.sharing_status !== "view only";
      } else if (error.code === 404) {
        console.warn('File not found:', doc.google_id);
        await sendErrorMessageToDiscord(`File not found: ${doc.google_id}`);

        if (!test) {
          // Update the sharing status to "file not found" in the database
          await supabaseAdmin
            .from("documents")
            .update({
              sharing_status: "access denied",
              previous_sharing_status: doc.sharing_status,
            })
            .match({ google_id: doc.google_id });
        }
  
        // Return true to indicate that there was a change in the sharing status
        return true;
      } else if (error.code === 401 && error.message.includes('invalid_grant')) {
        console.error('Refresh token expired. Please obtain a new refresh token.');
        await sendErrorMessageToDiscord('Google Refresh Token Expired. Please obtain a new refresh token.');
        throw error;
      } else {
        console.error("Failed to check document for changes:", error);
        await sendErrorMessageToDiscord(`Failed to check document for recent changes: ${error.message}`);
        throw error; // Rethrow other errors
      }
    }
  }

  for (const doc of docs) {
    const hasChanges = await checkDocumentForChanges(doc);
    if (hasChanges) {
      changedDocs.push(doc.google_id);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(changedDocs),
  };
};