import axiosInstance from "./Axiosinstance";
import { API_PATHS } from "./ApiPath";

/**
 * Uploads an image file to the backend
 * @param {File} imageFile - The file object to upload
 * @returns {Promise<{ imageUrl: string }>} - Resolves with the image URL object
 */
export const uploadImage = async (imageFile) => {
  const formData = new FormData();
  // Append the image file under 'image'
  formData.append("image", imageFile);

  try {
    const response = await axiosInstance.post(
      API_PATHS.IMAGE.UPLOAD_IMAGE,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error uploading the image:", error);
    throw error;
  }
};

export default uploadImage;
