// ../pages/doc-manager/index.tsx
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import styles from '../../styles/docManager.module.css';

interface Document {
  google_id: string;
  title: string;
  workgroup: string;
  entity: string;
  sharing_status: string;
  url: string;
}

const DocManager: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>("All");
  const [selectedWorkgroup, setSelectedWorkgroup] = useState<string>("All");
  const [newDocUrl, setNewDocUrl] = useState<string>("");

  useEffect(() => {
    async function fetchDocuments() {
      setLoading(true);
      const response = await fetch('/.netlify/functions/getAllDocs');
      const data = await response.json();
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
  const handleAddDocument = () => {
    console.log("New document URL:", newDocUrl);
    // Perform any other desired actions with the new document URL
  };

  return (
    <div className={styles.container}>
      <h1>Snet Document Manager</h1>
      {loading ? (
        <p>Loading documents...</p>
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
          <div className={styles.addDocument}>
            <input
              type="text"
              placeholder="Enter document URL"
              value={newDocUrl}
              onChange={(e) => setNewDocUrl(e.target.value)}
            />
            <button onClick={handleAddDocument}>Add Document</button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Workgroup</th>
                <th>Entity</th>
                <th>Sharing Status</th>
                <th>Link</th>
                <th>Archives</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.google_id}>
                  <td>{doc.title}</td>
                  <td>{doc.workgroup}</td>
                  <td>{doc.entity}</td>
                  <td>{doc.sharing_status}</td>
                  <td>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                      Open
                    </a>
                  </td>
                  <td>
                    <a
                      href={`https://github.com/SingularityNET-Archive/SingularityNET-Archive/tree/main/Data/${doc.entity}/Content/${doc.workgroup}/Docs/GoogleDocs/${doc.google_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      GitHub
                    </a>
                  </td>
                  <td>
                    <button onClick={() => handleButtonClick(doc)}>Action</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default DocManager;
