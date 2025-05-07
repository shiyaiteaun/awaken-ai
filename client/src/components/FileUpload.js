import React, { useState } from 'react';
import { X } from 'react-bootstrap-icons'; // Import X icon

// Consolidated FileUpload component
function FileUpload({ onClose, onUploadSuccess, onUploadError }) {
  const [files, setFiles] = useState(null); // For multiple files
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleFileChange = (e) => {
    setFiles(e.target.files);
    setUploadMessage(''); // Clear previous messages
    setMessageType('');
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    const formElement = e.target; // The form element itself

    if (!files || files.length === 0) {
      setUploadMessage('Please select at least one file.');
      setMessageType('error');
      return;
    }

    setIsUploading(true);
    setUploadMessage('Uploading...');
    setMessageType(''); // Clear message type while uploading

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('description', description);

    try {
      const response = await fetch('http://localhost:5000/api/ai/upload', { // <--- URL ကို /api/ai/upload သို့ ပြောင်းပါ
        method: 'POST',
        body: formData,
      });

      // For debugging: Log the raw response
      // console.log('Raw server response:', response); 

      const data = await response.json();

      if (!response.ok) {
        // For debugging: Log the parsed data even on error
        // console.log('Error data from server:', data);
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      const successMsg = data.message || `${files.length} file(s) uploaded successfully!`;
      setUploadMessage(successMsg);
      setMessageType('success');
      if (onUploadSuccess) {
        onUploadSuccess(successMsg); // Call the success callback prop
      }
      setFiles(null); // Clear selected files
      setDescription(''); // Clear description

      // Reset file input visually by resetting the form
      if (formElement && typeof formElement.reset === 'function') {
         formElement.reset();
      }

    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = error.message || 'Upload failed. Please try again.';
      setUploadMessage(errorMessage);
      setMessageType('error');
      if (onUploadError) {
        onUploadError(errorMessage); // Call the error callback prop
      }
    } finally {
      setIsUploading(false);
    }
  };

  const renderFileNames = () => {
    if (!files || files.length === 0) {
      return null;
    }
    return (
      <ul className="list-unstyled mt-2 mb-0" style={{ fontSize: '0.875em' }}>
        {Array.from(files).map((file, index) => (
          <li key={index} className="text-muted text-truncate">
            {file.name}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="file-upload-modal-inner">
      <button onClick={onClose} className="file-upload-close-button" title="Close">
        <X size={28} />
      </button>
      <h2>Upload File(s)</h2>
      
      <form onSubmit={handleSubmit} id="fileUploadForm">
        <div className="mb-3">
          <label htmlFor="fileInput" className="form-label">Choose files</label>
          <input 
            type="file" 
            className="form-control" 
            id="fileInput"
            multiple 
            onChange={handleFileChange} 
            disabled={isUploading} 
          />
          {renderFileNames()}
        </div>

        <div className="mb-3">
          <label htmlFor="descriptionInput" className="form-label">Description (Optional)</label>
          <textarea 
            className="form-control" 
            id="descriptionInput"
            rows="3"
            value={description}
            onChange={handleDescriptionChange}
            disabled={isUploading}
            placeholder="Enter a brief description for the file(s)..."
          ></textarea>
        </div>

        {uploadMessage && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mt-3`} role="alert">
            {uploadMessage}
          </div>
        )}

        <div className="file-upload-actions mt-3">
          <button type="submit" className="btn btn-primary" disabled={!files || files.length === 0 || isUploading}>
            {isUploading ? 'Uploading...' : `Upload ${files ? files.length : '0'} File(s)`}
          </button>
          <button type="button" onClick={onClose} disabled={isUploading} className="btn btn-secondary cancel-button">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
} // Closing brace for the FileUpload component function

export default FileUpload; // This line MUST be outside the FileUpload function