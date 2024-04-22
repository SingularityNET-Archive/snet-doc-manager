// checkStatusChanges.js
import { supabaseAdmin } from "../../lib/supabaseClient";
import { google } from "googleapis";

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_uris = process.env.GOOGLE_REDIRECT_URI;
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris
);
oauth2Client.setCredentials({ refresh_token: refreshToken });

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
      } // Additional logic for 'user', 'group', 'domain' types can be added here
    });
    return status;
  }

  async function checkDocumentForChanges(doc) {
    const drive = google.drive({ version: "v3", auth: oauth2Client });
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
      const hasStatusChanged = currentStatus !== doc.sharing_status;
      if (hasStatusChanged && !test) {
        // Document sharing status has changed, update the database
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
      console.error("Failed to check document for changes:", error);
      // Here, you could distinguish between different types of errors
      // For example, if permissions couldn't be fetched due to an API restriction or rate limit
      if (error.code === 403) {
        // Example: Handling specific API errors
        if (doc.sharing_status == "view only") {
          return false;
        } else {
          return true;
        }
      }
      throw error; // Rethrow or handle other errors as needed
    }
  }
  for (const doc of docs) {
    const hasChanges = await checkDocumentForChanges(doc);
    if (hasChanges) {
      changedDocs.push(doc.google_id);
    }
  }
  return { statusCode: 200, body: JSON.stringify(changedDocs) };
};
