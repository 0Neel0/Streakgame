require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Testing Cloudinary Connection...');

cloudinary.api.ping((error, result) => {
    if (error) {
        console.error('FAILED:', error.message);
        process.exit(1);
    } else {
        console.log('SUCCESS:', result);
        process.exit(0);
    }
});
