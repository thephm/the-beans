import express, { Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();
const execAsync = promisify(exec);

// Apply authentication middleware to all backup routes
router.use(requireAuth);



interface BackupProgress {
  step: string;
  status: 'pending' | 'in-progress' | 'success' | 'error';
  message?: string;
}

/**
 * @swagger
 * /api/backup/database:
 *   post:
 *     summary: Create database backup and upload to WebDAV
 *     description: Creates a PostgreSQL dump and uploads it to WebDAV server. Admin only.
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Backup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       step:
 *                         type: string
 *                       status:
 *                         type: string
 *                       message:
 *                         type: string
 *                 filename:
 *                   type: string
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Backup failed
 */
router.post('/database', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const progress: BackupProgress[] = [];
    
    // Step 1: Create timestamp for filename
    progress.push({ step: 'Create filename', status: 'in-progress' });
    const timestamp = new Date().toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .split('.')[0]; // Format: YYYY-MM-DD_HH-MM-SS
    const filename = `the-beans-backup_${timestamp}.sql`;
    const backupPath = path.join('/tmp', filename);
    progress[0].status = 'success';
    progress[0].message = `Filename: ${filename}`;

    // Step 2: Create database dump
    progress.push({ step: 'Create database dump', status: 'in-progress' });
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      progress[1].status = 'error';
      progress[1].message = 'DATABASE_URL not configured';
      return res.status(500).json({ success: false, steps: progress });
    }

    try {
      // Parse DATABASE_URL to extract database connection details
      const dbUrl = process.env.DATABASE_URL || '';
      
      // Format: postgresql://user:password@host:port/database?params
      // Handle both postgres:// and postgresql:// schemes
      // Strip query parameters if present
      const cleanUrl = dbUrl.split('?')[0];
      const urlMatch = cleanUrl.match(/postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/(.+)/);
      
      if (!urlMatch) {
        throw new Error(`Invalid DATABASE_URL format. Expected postgresql://user:pass@host:port/db but got: ${cleanUrl.substring(0, 50)}...`);
      }
      
      const [, dbUser, dbPassword, dbHost, dbPort = '5432', dbName] = urlMatch;
      
      // Check if we're running in Docker (local dev) or directly (production like Render)
      const isDocker = process.env.DOCKER_ENV === 'true';
      
      let dumpCommand: string;
      if (isDocker) {
        // Use docker exec to run pg_dump inside the database container
        // This ensures version compatibility between pg_dump and PostgreSQL server
        const containerName = 'the-beans-database-1';
        dumpCommand = `docker exec ${containerName} pg_dump -U ${dbUser} -d ${dbName}`;
      } else {
        // Use pg_dump directly on production (Render, etc.)
        // Set PGPASSWORD environment variable for authentication
        dumpCommand = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --no-password`;
      }
      
      const { stdout } = await execAsync(dumpCommand, { 
        maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large databases
      });
      
      // Write the dump to file
      fs.writeFileSync(backupPath, stdout);
      
      progress[1].status = 'success';
      progress[1].message = `Database dumped to ${backupPath}`;
    } catch (error: any) {
      progress[1].status = 'error';
      progress[1].message = `Database dump failed: ${error.message}`;
      return res.status(500).json({ success: false, steps: progress });
    }

    // Step 3: Upload to WebDAV
    progress.push({ step: 'Upload to WebDAV', status: 'in-progress' });
    const webdavUrl = process.env.WEBDAV_URL;
    const webdavUser = process.env.WEBDAV_USER;
    const webdavPass = process.env.WEBDAV_PASS;

    if (!webdavUrl || !webdavUser || !webdavPass) {
      progress[2].status = 'error';
      progress[2].message = 'WebDAV credentials not configured (WEBDAV_URL, WEBDAV_USER, WEBDAV_PASS required)';
      
      // Clean up local file
      try {
        fs.unlinkSync(backupPath);
      } catch {}
      
      return res.status(500).json({ success: false, steps: progress });
    }

    try {
      // Use dynamic import to load ES module webdav
      // Using eval to prevent TypeScript from converting import() to require()
      const webdavModule = await (eval('import("webdav")') as Promise<any>);
      const createClient = webdavModule.createClient;
      const { AuthType } = webdavModule;
      
      // Create auth token manually to ensure proper encoding
      const authToken = Buffer.from(`${webdavUser}:${webdavPass}`).toString('base64');
      
      const client = createClient(webdavUrl, {
        username: webdavUser,
        password: webdavPass,
        authType: AuthType.Password,
        headers: {
          'Authorization': `Basic ${authToken}`
        }
      });

      // Read the backup file
      const fileContent = fs.readFileSync(backupPath);
      
      // Upload to WebDAV
      await client.putFileContents(`/backups/${filename}`, fileContent, {
        contentLength: fileContent.length,
      });

      progress[2].status = 'success';
      progress[2].message = `Uploaded to ${webdavUrl}/backups/${filename}`;
    } catch (error: any) {
      progress[2].status = 'error';
      progress[2].message = `WebDAV upload failed: ${error.message}`;
      
      // Clean up local file
      try {
        fs.unlinkSync(backupPath);
      } catch {}
      
      return res.status(500).json({ success: false, steps: progress });
    }

    // Step 4: Clean up local file
    progress.push({ step: 'Clean up local file', status: 'in-progress' });
    try {
      fs.unlinkSync(backupPath);
      progress[3].status = 'success';
      progress[3].message = 'Local backup file removed';
    } catch (error: any) {
      progress[3].status = 'error';
      progress[3].message = `Clean up failed: ${error.message}`;
    }

    res.json({
      success: true,
      steps: progress,
      filename,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Backup failed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/backup/debug-webdav:
 *   get:
 *     summary: Debug WebDAV configuration
 *     description: Shows WebDAV environment variable status (NOT the actual values). Admin only.
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration status
 *       403:
 *         description: Admin access required
 */
router.get('/debug-webdav', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const webdavUrl = process.env.WEBDAV_URL;
    const webdavUser = process.env.WEBDAV_USER;
    const webdavPass = process.env.WEBDAV_PASS;

    res.json({
      urlConfigured: !!webdavUrl,
      urlLength: webdavUrl?.length || 0,
      urlHasTrailingSlash: webdavUrl?.endsWith('/'),
      urlPreview: webdavUrl ? `${webdavUrl.substring(0, 20)}...` : 'NOT SET',
      userConfigured: !!webdavUser,
      userLength: webdavUser?.length || 0,
      userHasSpaces: webdavUser ? /\s/.test(webdavUser) : false,
      userPreview: webdavUser ? `${webdavUser.substring(0, 5)}...@...` : 'NOT SET',
      passConfigured: !!webdavPass,
      passLength: webdavPass?.length || 0,
      passHasSpaces: webdavPass ? /\s/.test(webdavPass) : false,
      passFirstChar: webdavPass ? webdavPass[0] : 'NOT SET',
      passLastChar: webdavPass ? webdavPass[webdavPass.length - 1] : 'NOT SET',
      passHasSpecialChars: webdavPass ? /[^a-zA-Z0-9]/.test(webdavPass) : false,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Debug failed',
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/backup/test-webdav:
 *   get:
 *     summary: Test WebDAV connection
 *     description: Tests if WebDAV credentials are configured correctly. Admin only.
 *     tags: [Backup]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WebDAV connection successful
 *       403:
 *         description: Admin access required
 *       500:
 *         description: WebDAV connection failed
 */
router.get('/test-webdav', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const webdavUrl = process.env.WEBDAV_URL;
    const webdavUser = process.env.WEBDAV_USER;
    const webdavPass = process.env.WEBDAV_PASS;

    // Check configuration first - return 400 for missing config
    if (!webdavUrl || !webdavUser || !webdavPass) {
      return res.status(400).json({
        success: false,
        error: 'Configuration missing',
        message: 'WebDAV credentials not configured (WEBDAV_URL, WEBDAV_USER, WEBDAV_PASS required)',
        configMissing: true,
      });
    }

    // Use dynamic import to load ES module webdav
    // Using eval to prevent TypeScript from converting import() to require()
    const webdavModule = await (eval('import("webdav")') as Promise<any>);
    const createClient = webdavModule.createClient;
    const { AuthType } = webdavModule;
    
    // Create auth token manually to ensure proper encoding
    const authToken = Buffer.from(`${webdavUser}:${webdavPass}`).toString('base64');
    
    const client = createClient(webdavUrl, {
      username: webdavUser,
      password: webdavPass,
      authType: AuthType.Password,
      headers: {
        'Authorization': `Basic ${authToken}`
      }
    });

    // Test connection and ensure /backups directory exists
    try {
      // Try to get /backups directory
      await client.getDirectoryContents('/backups');
    } catch (error: any) {
      // If directory doesn't exist, try to create it
      if (error.response?.status === 404) {
        try {
          await client.createDirectory('/backups');
        } catch (createError: any) {
          // If we can't create it, that might be okay - test basic connection instead
          await client.getDirectoryContents('/');
        }
      } else {
        throw error;
      }
    }

    res.json({
      success: true,
      message: 'WebDAV connection successful',
      url: webdavUrl,
    });
  } catch (error: any) {
    // Connection errors are 500, but with clear structure
    res.status(500).json({
      success: false,
      error: 'WebDAV connection failed',
      message: error.message,
      configMissing: false,
    });
  }
});

export default router;
