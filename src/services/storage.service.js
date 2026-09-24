const path = require('path');
const fs = require('fs');
const env = require('../config/env');

class StorageService {
  constructor() {
    this.uploadDir = path.resolve(env.UPLOAD_DIR || './uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Abstract save method. Currently saves to local disk.
   * Can be swapped for AWS S3 / Azure Blob in production without changing controllers.
   */
  async uploadFile(fileBuffer, originalName, mimeType) {
    const fileExt = path.extname(originalName) || '.bin';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${fileExt}`;
    const filePath = path.join(this.uploadDir, filename);

    await fs.promises.writeFile(filePath, fileBuffer);

    return {
      filename,
      fileUrl: `/uploads/${filename}`,
      size: `${(fileBuffer.length / (1024 * 1024)).toFixed(1)} MB`
    };
  }

  async deleteFile(filename) {
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    return true;
  }
}

module.exports = new StorageService();
