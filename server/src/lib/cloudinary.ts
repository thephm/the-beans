import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Validate Cloudinary environment variables
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error(
    'Missing Cloudinary configuration! Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.'
  );
}

// Warn if using test credentials
if (process.env.CLOUDINARY_CLOUD_NAME === 'test-cloud') {
  console.warn('⚠️  Using test Cloudinary credentials - image uploads will fail but server will start for testing');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'roaster-images',
    format: async (req: any, file: any) => {
      // Support common image formats
      const allowedFormats = ['jpg', 'jpeg', 'png', 'webp'];
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      return allowedFormats.includes(fileExtension || '') ? fileExtension : 'jpg';
    },
    public_id: (req: any, file: any) => {
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const originalName = file.originalname.split('.')[0];
      return `roaster-${timestamp}-${originalName}`;
    },
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ]
  } as any,
});

// File filter to only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create multer upload middleware
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Function to upload image from URL to Cloudinary
export const uploadImageFromUrl = async (imageUrl: string, roasterId: string): Promise<{ url: string; publicId: string } | null> => {
  try {
    const timestamp = Date.now();
    const publicId = `roaster-${timestamp}-${roasterId}`;
    
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'roaster-images',
      public_id: publicId,
      transformation: [
        {
          width: 1200,
          height: 800,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto'
        }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Error uploading image from URL to Cloudinary:', error);
    return null;
  }
};

// Function to delete image from Cloudinary
export const deleteImage = async (publicId: string): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

export { cloudinary };