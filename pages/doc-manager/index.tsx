// pages/doc-manager/index.tsx
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import styles from '../../styles/docManager.module.css';
import DocumentTable from '../../components/doc-manager/DocumentTable';
import AddDocument from '../../components/doc-manager/AddDocument';
import { processNewDocument } from '../../utils/processNewDocument';

interface Document {
  google_id: string;
  title: string;
  workgroup: string;
  entity: string;
  sharing_status: string;
  url: string;
  doc_type: string;
}

const DocManager: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("All");
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<string>("All");
  const [showAddDocument, setShowAddDocument] = useState<boolean>(false);

  useEffect(() => {
    async function fetchDocuments() {
      setLoading(true);
      const response = await fetch('/.netlify/functions/getAllDocs');
      const data = await response.json();
      console.log(data);
      setDocuments(data);
      setLoading(false);
    }

    fetchDocuments();
  }, []);

  // Group documents by entity and workgroup
  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.entity]) {
      acc[doc.entity] = {};
    }
    if (!acc[doc.entity][doc.workgroup]) {
      acc[doc.entity][doc.workgroup] = [];
    }
    acc[doc.entity][doc.workgroup].push(doc);
    return acc;
  }, {} as { [entity: string]: { [workgroup: string]: Document[] } });

  // Get unique entities
  const uniqueEntities = Array.from(new Set(documents.map(doc => doc.entity))).sort();

  // Get unique doc types
  const uniqueDocTypes = Array.from(new Set(documents.map(doc => doc.doc_type))).sort();

  // Function to get workgroups for a specific entity
  const getWorkgroupsForEntity = (entity: string) => {
    return entity && groupedDocuments[entity] 
      ? Object.keys(groupedDocuments[entity]).sort()
      : [];
  };

  // Get unique entities and workgroups
  const entities = ["All", ...Object.keys(groupedDocuments)];
  const workgroups = selectedEntity && selectedEntity !== "All" 
    ? ["All", ...Object.keys(groupedDocuments[selectedEntity] || {}).sort()]
    : ["All"];

  // Filter and sort documents based on selected entity and workgroup
  const filteredDocuments = selectedEntity === "All"
    ? [...documents].sort((a, b) => {
        if (a.entity === b.entity) {
          return a.workgroup.localeCompare(b.workgroup);
        }
        return a.entity.localeCompare(b.entity);
      })
    : [...documents]
        .filter(doc => doc.entity === selectedEntity)
        .sort((a, b) => a.workgroup.localeCompare(b.workgroup))
        .filter(doc => selectedWorkgroup === "All" || doc.workgroup === selectedWorkgroup);

  // Function to handle button click and log document values
  const handleButtonClick = async (doc: Document, rationale: string) => {
    try {
      // Step 1: Create the folder
      const folderPath = `manual-copies-of-documents/${doc.entity}/${doc.workgroup}/${doc.google_id}`;
      const folderResponse = await fetch('/.netlify/functions/createGoogleFolder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPath }),
      });
  
      if (!folderResponse.ok) {
        throw new Error('Failed to create folder');
      }
  
      const folderData = await folderResponse.json();
      const folderId = folderData.folderId;
  
      // Step 2: Create a manual copy of the Google Doc
      const copyResponse = await fetch('/.netlify/functions/copyGoogleDocument', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ doc, folderId, rationale }),
      });
  
      if (!copyResponse.ok) {
        throw new Error('Failed to create manual copy');
      }
  
      const copyData = await copyResponse.json();
      const newDocId = copyData.newDocId;
  
      console.log('New document ID:', newDocId);
  
      // Step 3: Add headers and footers to the new copy
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).replace(/ /g, '-');
  
      const headersFootersResult = await fetch('/.netlify/functions/addHeadersAndFooters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: newDocId,
          formattedDate: formattedDate,
          originalDocId: doc.google_id
        }),
      });
  
      if (!headersFootersResult.ok) {
        throw new Error('Failed to add headers and footers');
      }
  
      const headersFootersData = await headersFootersResult.json();
      console.log('Headers and footers result:', headersFootersData);
  
      // Step 4: Commit the document to GitHub
      const newDoc = {
        ...doc,
        google_id: newDocId,  
        originalDocId: doc.google_id
      };
      
      const commitResult = await fetch('/.netlify/functions/getDocBodyAndCommitToGitHub', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docs: [newDoc],
          recentChangesResponse: [newDocId],
          test: false,
          date: formattedDate
        }),
      });
  
      if (!commitResult.ok) {
        throw new Error('Failed to commit document to GitHub');
      }
  
      const commitData = await commitResult.json();
      console.log('Commit result:', commitData);
  
    } catch (error) {
      console.error('Error in handleButtonClick:', error);
      // Handle the error appropriately (e.g., show an error message to the user)
    }
  };

  // Function to handle adding a new document
  const handleAddDocument = async (newDoc: {
    url: string;
    title: string;
    entity: string;
    workgroup: string;
    doc_type: string;
    google_id: string;
  }) => {
    console.log("New document:", newDoc);
    
    // Create the document object in the required structure
    const docForUpload = {
      [newDoc.doc_type]: [{
        doc_id: newDoc.url,
        entity: newDoc.entity,
        workgroup: newDoc.workgroup,
        workingDoc: {
          link: newDoc.url,
          title: newDoc.title
        }
      }]
    };

    try {
      // Upload the new document to the database
      const response = await fetch('/.netlify/functions/uploadDocs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(docForUpload),
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const result = await response.json();
      console.log('Upload result:', result);

      // If the upload was successful, add the new document to the local state
      if (result.inserted > 0) {
        const fullNewDoc = {
          google_id: newDoc.google_id,
          url: newDoc.url,
          title: newDoc.title,
          entity: newDoc.entity,
          workgroup: newDoc.workgroup,
          doc_type: newDoc.doc_type,
          sharing_status: 'pending',
          all_copy_ids: [],
          latest_copy_g_id: null,
        };

        setDocuments(prevDocs => [...prevDocs, fullNewDoc]);

        if (fullNewDoc.doc_type == 'googleDocs') {
          // Process the new document
          await processNewDocument(fullNewDoc);
        }

        //setShowAddDocument(false); // Switch back to document table view after adding
      } else {
        console.warn('Document was not inserted. It may already exist in the database.');
      }
    } catch (error) {
      console.error('Error adding new document:', error);
      // Here you might want to show an error message to the user
    }
  };

  return (
    <div className={styles.container}>
      <h1>Snet Document Manager</h1>
      {loading ? (
        <p>Loading documents...</p>
      ) : (
        <>
          <div className={styles.buttonGroup}>
            <button
              className={`${styles.toggleButton} ${!showAddDocument ? styles.active : ''}`}
              onClick={() => setShowAddDocument(false)}
            >
              View Documents
            </button>
            <button
              className={`${styles.toggleButton} ${showAddDocument ? styles.active : ''}`}
              onClick={() => setShowAddDocument(true)}
            >
              Add New Document
            </button>
          </div>
          {showAddDocument ? (
            <AddDocument 
              onAddDocument={handleAddDocument} 
              entities={uniqueEntities}
              getWorkgroupsForEntity={getWorkgroupsForEntity}
              docTypes={uniqueDocTypes}  
            />
          ) : (
            <>
              <div className={styles.dropdown}>
                <label htmlFor="entity-select">Entity: </label>
                <select
                  id="entity-select"
                  value={selectedEntity}
                  onChange={(e) => {
                    setSelectedEntity(e.target.value);
                    setSelectedWorkgroup("All");
                  }}
                >
                  {entities.map((entity) => (
                    <option key={entity} value={entity}>
                      {entity}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.dropdown}>
                <label htmlFor="workgroup-select">Workgroup: </label>
                <select
                  id="workgroup-select"
                  value={selectedWorkgroup}
                  onChange={(e) => setSelectedWorkgroup(e.target.value)}
                  disabled={selectedEntity === "All"}
                >
                  {workgroups.map((workgroup) => (
                    <option key={workgroup} value={workgroup}>
                      {workgroup}
                    </option>
                  ))}
                </select>
              </div>
              <DocumentTable documents={filteredDocuments} onActionClick={handleButtonClick} />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default DocManager;