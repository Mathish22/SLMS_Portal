const mult = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check if Cloudinary keys exist
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

let storage;
let uploader;

if (useCloudinary) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    storage = new CloudinaryStorage({
        cloudinary,
        params: {
            folder: 'academia-resources',
            resource_type: 'raw',
            allowed_formats: ['pdf'],
            public_id: (req, file) => {
                const ext = path.extname(file.originalname);
                const base = path.basename(file.originalname, ext);
                return `${base}-${Date.now()}${ext}`;
            },
        },
    });

    uploader = {
        destroy: async (public_id) => {
            return await cloudinary.uploader.destroy(public_id, { resource_type: 'raw' });
        }
    };
    console.log('Using Cloudinary Storage');
} else {
    // Fallback to Local Storage
    storage = mult.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const base = path.basename(file.originalname, ext);
            cb(null, `${base}-${Date.now()}${ext}`);
        }
    });

    uploader = {
        destroy: async (filename) => {
            const uploadPath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(uploadPath)) {
                fs.unlinkSync(uploadPath);
                return { result: 'ok' };
            }
            return { result: 'not found' };
        }
    };
    console.log('Using Local Disk Storage (Cloudinary keys missing)');
}

const upload = mult({ storage });

module.exports = {
    upload,
    uploader,
    useCloudinary
};
