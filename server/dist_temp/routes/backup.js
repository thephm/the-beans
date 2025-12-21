"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var child_process_1 = require("child_process");
var util_1 = require("util");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var requireAuth_1 = require("../middleware/requireAuth");
var router = express_1.default.Router();
var execAsync = (0, util_1.promisify)(child_process_1.exec);
// Apply authentication middleware to all backup routes
router.use(requireAuth_1.requireAuth);
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
router.post('/database', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, progress, timestamp, filename, backupPath, dbUrl, dbUrl_1, urlMatch, dbUser, dbPassword, dbHost, dbPort, dbName, containerName, dumpCommand, stdout, error_1, webdavUrl, webdavUser, webdavPass, webdavModule, createClient, client, fileContent, error_2, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
                user = req.user;
                if (!user || user.role !== 'admin') {
                    return [2 /*return*/, res.status(403).json({ error: 'Admin access required' })];
                }
                progress = [];
                // Step 1: Create timestamp for filename
                progress.push({ step: 'Create filename', status: 'in-progress' });
                timestamp = new Date().toISOString()
                    .replace(/T/, '_')
                    .replace(/:/g, '-')
                    .split('.')[0];
                filename = "the-beans-backup_".concat(timestamp, ".sql");
                backupPath = path.join('/tmp', filename);
                progress[0].status = 'success';
                progress[0].message = "Filename: ".concat(filename);
                // Step 2: Create database dump
                progress.push({ step: 'Create database dump', status: 'in-progress' });
                dbUrl = process.env.DATABASE_URL;
                if (!dbUrl) {
                    progress[1].status = 'error';
                    progress[1].message = 'DATABASE_URL not configured';
                    return [2 /*return*/, res.status(500).json({ success: false, steps: progress })];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                dbUrl_1 = process.env.DATABASE_URL || '';
                urlMatch = dbUrl_1.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
                if (!urlMatch) {
                    throw new Error('Invalid DATABASE_URL format');
                }
                dbUser = urlMatch[1], dbPassword = urlMatch[2], dbHost = urlMatch[3], dbPort = urlMatch[4], dbName = urlMatch[5];
                containerName = 'the-beans-database-1';
                dumpCommand = "docker exec ".concat(containerName, " pg_dump -U ").concat(dbUser, " -d ").concat(dbName);
                return [4 /*yield*/, execAsync(dumpCommand, {
                        maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large databases
                    })];
            case 2:
                stdout = (_a.sent()).stdout;
                // Write the dump to file
                fs.writeFileSync(backupPath, stdout);
                progress[1].status = 'success';
                progress[1].message = "Database dumped to ".concat(backupPath);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                progress[1].status = 'error';
                progress[1].message = "Database dump failed: ".concat(error_1.message);
                return [2 /*return*/, res.status(500).json({ success: false, steps: progress })];
            case 4:
                // Step 3: Upload to WebDAV
                progress.push({ step: 'Upload to WebDAV', status: 'in-progress' });
                webdavUrl = process.env.WEBDAV_URL;
                webdavUser = process.env.WEBDAV_USER;
                webdavPass = process.env.WEBDAV_PASS;
                if (!webdavUrl || !webdavUser || !webdavPass) {
                    progress[2].status = 'error';
                    progress[2].message = 'WebDAV credentials not configured (WEBDAV_URL, WEBDAV_USER, WEBDAV_PASS required)';
                    // Clean up local file
                    try {
                        fs.unlinkSync(backupPath);
                    }
                    catch (_b) { }
                    return [2 /*return*/, res.status(500).json({ success: false, steps: progress })];
                }
                _a.label = 5;
            case 5:
                _a.trys.push([5, 8, , 9]);
                return [4 /*yield*/, eval('import("webdav")')];
            case 6:
                webdavModule = _a.sent();
                createClient = webdavModule.createClient;
                client = createClient(webdavUrl, {
                    username: webdavUser,
                    password: webdavPass,
                });
                fileContent = fs.readFileSync(backupPath);
                // Upload to WebDAV
                return [4 /*yield*/, client.putFileContents("/backups/".concat(filename), fileContent, {
                        contentLength: fileContent.length,
                    })];
            case 7:
                // Upload to WebDAV
                _a.sent();
                progress[2].status = 'success';
                progress[2].message = "Uploaded to ".concat(webdavUrl, "/backups/").concat(filename);
                return [3 /*break*/, 9];
            case 8:
                error_2 = _a.sent();
                progress[2].status = 'error';
                progress[2].message = "WebDAV upload failed: ".concat(error_2.message);
                // Clean up local file
                try {
                    fs.unlinkSync(backupPath);
                }
                catch (_c) { }
                return [2 /*return*/, res.status(500).json({ success: false, steps: progress })];
            case 9:
                // Step 4: Clean up local file
                progress.push({ step: 'Clean up local file', status: 'in-progress' });
                try {
                    fs.unlinkSync(backupPath);
                    progress[3].status = 'success';
                    progress[3].message = 'Local backup file removed';
                }
                catch (error) {
                    progress[3].status = 'error';
                    progress[3].message = "Clean up failed: ".concat(error.message);
                }
                res.json({
                    success: true,
                    steps: progress,
                    filename: filename,
                });
                return [3 /*break*/, 11];
            case 10:
                error_3 = _a.sent();
                console.error('Backup error:', error_3);
                res.status(500).json({
                    success: false,
                    error: 'Backup failed',
                    message: error_3.message,
                });
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
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
router.get('/test-webdav', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, webdavUrl, webdavUser, webdavPass, webdavModule, createClient, client, error_4, createError_1, error_5;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 13, , 14]);
                user = req.user;
                if (!user || user.role !== 'admin') {
                    return [2 /*return*/, res.status(403).json({ error: 'Admin access required' })];
                }
                webdavUrl = process.env.WEBDAV_URL;
                webdavUser = process.env.WEBDAV_USER;
                webdavPass = process.env.WEBDAV_PASS;
                if (!webdavUrl || !webdavUser || !webdavPass) {
                    return [2 /*return*/, res.status(500).json({
                            success: false,
                            error: 'WebDAV credentials not configured',
                        })];
                }
                return [4 /*yield*/, eval('import("webdav")')];
            case 1:
                webdavModule = _b.sent();
                createClient = webdavModule.createClient;
                client = createClient(webdavUrl, {
                    username: webdavUser,
                    password: webdavPass,
                });
                _b.label = 2;
            case 2:
                _b.trys.push([2, 4, , 12]);
                // Try to get /backups directory
                return [4 /*yield*/, client.getDirectoryContents('/backups')];
            case 3:
                // Try to get /backups directory
                _b.sent();
                return [3 /*break*/, 12];
            case 4:
                error_4 = _b.sent();
                if (!(((_a = error_4.response) === null || _a === void 0 ? void 0 : _a.status) === 404)) return [3 /*break*/, 10];
                _b.label = 5;
            case 5:
                _b.trys.push([5, 7, , 9]);
                return [4 /*yield*/, client.createDirectory('/backups')];
            case 6:
                _b.sent();
                return [3 /*break*/, 9];
            case 7:
                createError_1 = _b.sent();
                // If we can't create it, that might be okay - test basic connection instead
                return [4 /*yield*/, client.getDirectoryContents('/')];
            case 8:
                // If we can't create it, that might be okay - test basic connection instead
                _b.sent();
                return [3 /*break*/, 9];
            case 9: return [3 /*break*/, 11];
            case 10: throw error_4;
            case 11: return [3 /*break*/, 12];
            case 12:
                res.json({
                    success: true,
                    message: 'WebDAV connection successful',
                    url: webdavUrl,
                });
                return [3 /*break*/, 14];
            case 13:
                error_5 = _b.sent();
                res.status(500).json({
                    success: false,
                    error: 'WebDAV connection failed',
                    message: error_5.message,
                });
                return [3 /*break*/, 14];
            case 14: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
