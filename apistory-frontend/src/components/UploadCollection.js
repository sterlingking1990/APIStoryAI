import React, {useState} from 'react';
import axios from 'axios';

const UploadCollection = ({ onUpload }) => {
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('file', selectedFile);
        console.log(selectedFile);

        try{
            const response = await axios.post('http://127.0.0.1:8000/upload-api-collection/',formData)
            console.log(response.data);
            onUpload(response.data);
        }catch(error){
            console.error('Error uploading the file', error);
        }
    };

    return (
        <div>
            <input type = "file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload Collection</button>
        </div>
    );
};

export default UploadCollection;
