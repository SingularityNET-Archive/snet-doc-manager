// pages/doc-manager/index.tsx
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import styles from '../../styles/docManager.module.css';
import DocumentTable from '../../components/doc-manager/DocumentTable';
import AddDocument from '../../components/doc-manager/AddDocument';

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
  const handleButtonClick = (doc: Document) => {
    console.log(doc);
    // Perform any other desired actions with the document values
  };

  // Function to handle adding a new document
  const handleAddDocument = (newDoc: {
    url: string;
    title: string;
    entity: string;
    workgroup: string;
  }) => {
    console.log("New document:", newDoc);
    // Here you would typically add the new document to your documents state
    // and possibly send it to your backend
    // For example:
    // setDocuments([...documents, { ...newDoc, google_id: generateId(), sharing_status: "private" }]);
    //setShowAddDocument(false); // Switch back to document table view after adding
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
              docTypes={uniqueDocTypes}  // Add this line
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