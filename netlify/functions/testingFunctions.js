import axios from 'axios';

export const handler = async (event, context) => {
    const results = {};
    const baseUrl = 'http://localhost:8888/.netlify/functions/';

    try {
      const fetchAllDocsUrl = `${baseUrl}fetchAllDocs`;
      const response = await axios.get(fetchAllDocsUrl);
      const docs = response.data;
      results.docs = docs // This is now an array of objects with google_id and sharing_status
      
      if (!docs.length) {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "No documents found for testing." })
        };
      }
  
      // Assuming checkStatusChanges expects an array of these objects
      const checkStatusChangesUrl = `${baseUrl}checkStatusChanges`;
      const statusChangeResponse = await axios.post(checkStatusChangesUrl, { docs, test: true }); // Pass the whole docs array and the test flag
      results.checkedStatusDocs = statusChangeResponse.data
      // Process results as needed...
  
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Testing function executed successfully.", results: results })
      };
    } catch (error) {
      console.error("Error in testing function:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to execute testing function." })
      };
    }
  };
  