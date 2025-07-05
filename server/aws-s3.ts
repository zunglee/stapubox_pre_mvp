import AWS from 'aws-sdk';
import crypto from 'crypto';

// AWS S3 Configuration
const s3Config = {
  accessKeyId: '',
  secretAccessKey: '',
  region: ''
};

AWS.config.update(s3Config);

const s3 = new AWS.S3();
const BUCKET_NAME = '';
const PROFILE_PIC_PREFIX = '';

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

// Generate filename with USER_ID + 6-digit hashcode + extension
export function generateFilename(userId: number, originalName: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  const hashCode = crypto.randomBytes(3).toString('hex'); // 6 digit hex
  return `${userId}_${hashCode}.${extension}`;
}

// Upload profile picture to S3
export async function uploadProfilePicture(
  userId: number, 
  fileBuffer: Buffer, 
  originalName: string,
  mimeType: string
): Promise<UploadResult> {
  try {
    console.log("=== AWS S3 UPLOAD START ===");
    console.log("User ID:", userId);
    console.log("Original filename:", originalName);
    console.log("MIME type:", mimeType);
    console.log("Buffer size:", fileBuffer.length);
    
    const filename = generateFilename(userId, originalName);
    const key = `${PROFILE_PIC_PREFIX}${filename}`;
    
    console.log("Generated filename:", filename);
    console.log("S3 key:", key);
    console.log("Bucket:", BUCKET_NAME);
    
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read' // Make images publicly accessible
    };

    console.log(`Uploading profile picture for user ${userId}: ${filename}`);
    console.log("Upload params:", {
      ...uploadParams,
      Body: `Buffer(${fileBuffer.length} bytes)`
    });
    
    const result = await s3.upload(uploadParams).promise();
    
    console.log(`Profile picture uploaded successfully: ${result.Location}`);
    console.log("Upload result:", {
      Location: result.Location,
      ETag: result.ETag,
      Key: result.Key
    });
    
    return {
      success: true,
      url: result.Location,
      filename: filename
    };
    
  } catch (error) {
    console.error('=== AWS S3 UPLOAD ERROR ===');
    console.error('Error uploading profile picture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

// Delete profile picture from S3
export async function deleteProfilePicture(filename: string): Promise<boolean> {
  try {
    const key = `${PROFILE_PIC_PREFIX}${filename}`;
    
    await s3.deleteObject({
      Bucket: BUCKET_NAME,
      Key: key
    }).promise();
    
    console.log(`Profile picture deleted: ${filename}`);
    return true;
    
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    return false;
  }
}

// Test S3 connection
export async function testS3Connection(): Promise<boolean> {
  try {
    await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
    console.log('S3 connection test successful');
    return true;
  } catch (error) {
    console.error('S3 connection test failed:', error);
    return false;
  }
}
