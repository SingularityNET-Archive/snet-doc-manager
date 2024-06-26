// components/doc-manager/AddDocument.tsx
import React, { useState, useEffect } from 'react';
import styles from '../../styles/docManager.module.css';

interface AddDocumentProps {
  onAddDocument: (document: {
    all_copy_ids: string[];
    doc_type: string;
    entity: string;
    google_id: string;
    latest_copy_g_id: string;
    sharing_status: string;
    title: string;
    url: string;
    workgroup: string;
  }) => void;
  entities: string[];
  getWorkgroupsForEntity: (entity: string) => string[];
  docTypes: string[];  
  isUploading: boolean;
}

const AddDocument: React.FC<AddDocumentProps> = ({ 
  onAddDocument, 
  entities, 
  getWorkgroupsForEntity, 
  docTypes, 
  isUploading  // New prop
}) => {
  const [newDoc, setNewDoc] = useState({
    url: "",
    title: "",
    entity: "",
    workgroup: "",
    doc_type: ""
  });

  const [isNewEntity, setIsNewEntity] = useState(false);
  const [isNewWorkgroup, setIsNewWorkgroup] = useState(false);
  const [isNewDocType, setIsNewDocType] = useState(false);
  const [workgroups, setWorkgroups] = useState<string[]>([]);
  const hardcodedDocTypes = ['googleSpreadsheets', 'googleSlides', 'youTubeVideos', 'mediumArticles','miroBoards', 'others'];

  useEffect(() => {
    if (newDoc.entity && !isNewEntity) {
      setWorkgroups(getWorkgroupsForEntity(newDoc.entity));
    } else {
      setWorkgroups([]);
    }
  }, [newDoc.entity, isNewEntity, getWorkgroupsForEntity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewDoc(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setIsNewEntity(true);
      setNewDoc(prevState => ({ ...prevState, entity: '', workgroup: '' }));
    } else {
      setIsNewEntity(false);
      setNewDoc(prevState => ({ ...prevState, entity: value, workgroup: '' }));
    }
    setIsNewWorkgroup(false);
  };

  const handleWorkgroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setIsNewWorkgroup(true);
      setNewDoc(prevState => ({ ...prevState, workgroup: '' }));
    } else {
      setIsNewWorkgroup(false);
      setNewDoc(prevState => ({ ...prevState, workgroup: value }));
    }
  };

  const handleDocTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setIsNewDocType(true);
      setNewDoc(prevState => ({ ...prevState, doc_type: '' }));
    } else {
      setIsNewDocType(false);
      setNewDoc(prevState => ({ ...prevState, doc_type: value }));
    }
  };

  const extractGoogleId = (url: string): string => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  const handleAddDocument = () => {
    if (isUploading) return;
    const googleId = extractGoogleId(newDoc.url);
    const formattedDoc = {
      all_copy_ids: [googleId],
      doc_type: newDoc.doc_type,
      entity: newDoc.entity,
      google_id: googleId,
      latest_copy_g_id: googleId,
      sharing_status: "pending",
      title: newDoc.title,
      url: newDoc.url,
      workgroup: newDoc.workgroup
    };

    onAddDocument(formattedDoc);

    setNewDoc({
      url: "",
      title: "",
      entity: "",
      workgroup: "",
      doc_type: ""
    });
    setIsNewEntity(false);
    setIsNewWorkgroup(false);
    setIsNewDocType(false);
  };

  return (
    <div className={styles.addDocument}>
      {isUploading && (
        <div className={styles.uploadingMessage}>
          Please do not leave this window or refresh until it is done.
        </div>
      )}
      <input
        type="text"
        name="url"
        placeholder="Enter document URL"
        value={newDoc.url}
        autoComplete='off'
        onChange={handleInputChange}
        disabled={isUploading}
      />
      <input
        type="text"
        name="title"
        placeholder="Enter document title"
        value={newDoc.title}
        autoComplete='off'
        onChange={handleInputChange}
        disabled={isUploading}
      />
      <select 
        name="doc_type" 
        onChange={handleDocTypeChange} 
        value={isNewDocType ? 'new' : newDoc.doc_type}
        disabled={isUploading}
      >
        <option value="">Select document type</option>
        {docTypes.filter(type => !hardcodedDocTypes.includes(type)).map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
        {hardcodedDocTypes.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
        <option value="new">Add new document type</option>
      </select>
      {isNewDocType && (
        <input
          type="text"
          name="doc_type"
          placeholder="Enter new document type"
          value={newDoc.doc_type}
          onChange={handleInputChange}
          disabled={isUploading}
        />
      )}
      <select 
        name="entity" 
        onChange={handleEntityChange} 
        value={isNewEntity ? 'new' : newDoc.entity}
        disabled={isUploading}
      >
        <option value="">Select an entity</option>
        {entities.map(entity => (
          <option key={entity} value={entity}>{entity}</option>
        ))}
        <option value="new">Add new entity</option>
      </select>
      {isNewEntity && (
        <input
          type="text"
          name="entity"
          placeholder="Enter new entity"
          value={newDoc.entity}
          onChange={handleInputChange}
          disabled={isUploading}
        />
      )}
      <select 
        name="workgroup" 
        onChange={handleWorkgroupChange} 
        value={isNewWorkgroup ? 'new' : newDoc.workgroup}
        disabled={!newDoc.entity || isNewEntity || isUploading}
      >
        <option value="">Select a workgroup</option>
        {workgroups.map(workgroup => (
          <option key={workgroup} value={workgroup}>{workgroup}</option>
        ))}
        <option value="new">Add new workgroup</option>
      </select>
      {isNewWorkgroup && (
        <input
          type="text"
          name="workgroup"
          placeholder="Enter new workgroup"
          value={newDoc.workgroup}
          onChange={handleInputChange}
          disabled={isUploading}
        />
      )}
      <button onClick={handleAddDocument} disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Add Document'}
      </button>
    </div>
  );
};

export default AddDocument;