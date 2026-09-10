import React, { useRef, useState } from "react";
import { LuUser, LuUpload, LuTrash } from "react-icons/lu";

const ProfilePhotoSelector = ({ image, setImage }) => {
  const inputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Update the image state
      setImage(file);

      // Generate preview URL from the file
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreviewUrl(null);
  };

  const onChooseFile = () => {
    inputRef.current.click();
  };

  return (
    <div className="flex justify-center mb-6">
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleImageChange}
        className="hidden"
      />

      {!image ? (
        <div
          className="w-20 h-20 flex items-center justify-center bg-blue-100/60 rounded-full relative cursor-pointer group hover:bg-blue-100 transition-colors"
          onClick={onChooseFile}
        >
          <LuUser className="text-4xl text-blue-600" />
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full absolute -bottom-1 -right-1 shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onChooseFile();
            }}
            aria-label="Upload photo"
          >
            <LuUpload size={16} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Profile preview"
            className="w-20 h-20 object-cover rounded-full border-2 border-blue-600/30"
          />
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full absolute -bottom-1 -right-1 shadow-md hover:bg-red-600 transition-colors cursor-pointer"
            onClick={handleRemoveImage}
            aria-label="Remove photo"
          >
            <LuTrash size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoSelector;