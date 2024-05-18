import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import { ApiError } from '../utils/ApiError.js';

dotenv.config({
    path: './.env'
});

// Configuration

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
});

// const cloudinary = require('cloudinary');

console.log("Cloudinary config: ", process.env.CLOUD_NAME, process.env.CLOUD_API_KEY, process.env.CLOUD_API_SECRET);

// cloudinary.config({
//     cloud_name: 'dtcs3u36z',
//     api_key: '958875827214149',
//     api_secret: '4cS8XO46nDp-wbDD-1HliJ_CwqQ',
//     secure: true,
// });

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            console.log("No File Path Provided");
            return null
        }

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,
            {
                resource_type: "auto",
                folder: "ktube-image"
            }
        )

        // file has been uploaded successfully
        console.log("File uploaded successfully on ", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch (error) {
        fs.unlinkSync(localFilePath);
        // removed the locally saved temporary file as the upload operation got failed
        console.error("Error in uploading file on cloudinary: ", error);
        throw new ApiError(500, error?.message || "Server error");
    }
}

const deleteOldImageOnCloudinary = async (oldImageUrl, publicId) => {
    try {
        if (!oldImageUrl || !publicId) {
            throw new ApiError(404, "OldImageUrl or PublicId required");
        }

        const result = await cloudinary.uploader.destroy(
            publicId,
            {
                resource_type: `${oldImageUrl.includes("image") ? "image" : "video"}`
            }
        )
        console.log("Asset deleted from Cloudinary:", result);
    } catch (error) {
        console.error("Error deleting asset from Cloudinary:", error);
        throw new ApiError(500, error?.message || "Server error");
    }
}

// (async function () {

//     // Configuration
//     cloudinary.config({
//         cloud_name: process.env.CLOUD_NAME,
//         api_key: process.env.CLOUD_API_KEY,
//         api_secret: process.env.CLOUD_API_SECRET,
//     });

//     // Upload an image
//     const uploadResult = await cloudinary.uploader.upload("https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg", {
//         public_id: "shoes"
//     }).catch((error) => { console.log(error) });

//     console.log(uploadResult);

//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url("shoes", {
//         fetch_format: 'auto',
//         quality: 'auto'
//     });

//     console.log(optimizeUrl);

//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url("shoes", {
//         crop: 'auto',
//         gravity: 'auto',
//         width: 500,
//         height: 500,
//     });

//     console.log(autoCropUrl);
// });

export { deleteOldImageOnCloudinary, uploadOnCloudinary };

