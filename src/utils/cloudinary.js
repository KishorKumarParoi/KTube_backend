import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })

        // file has been uploaded successfully
        console.log("File uploaded successfully on ", response.url);
        return response;
    }
    catch (error) {
        fs.unlink(localFilePath);
        // removed the locally saved temporary file as the upload operation got failed
        console.error("Error in uploading file on cloudinary: ", error);
        return null;
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

export { uploadOnCloudinary };