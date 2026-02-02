import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcckh4zyh',
  api_key: process.env.CLOUDINARY_API_KEY || '748887982651489',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'ueLG4GHuqWqtOn0mcwCEWIQvvC4',
});

export default cloudinary;
