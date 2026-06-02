"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImportStatus = exports.importQuiz = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const fs_1 = __importDefault(require("fs"));
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const processAiJob = async (jobId, reqBody, file) => {
    try {
        let response;
        if (file) {
            const fileBuffer = fs_1.default.readFileSync(file.path);
            const blob = new Blob([fileBuffer], { type: file.mimetype });
            const formData = new FormData();
            formData.append('file', blob, file.originalname || 'upload.pdf');
            const endpoint = file.mimetype.startsWith('image/') ? '/ai/parse-image' : '/ai/parse-pdf';
            response = await fetch(`${AI_SERVICE_URL}${endpoint}`, {
                method: 'POST',
                body: formData,
            });
            try {
                fs_1.default.unlinkSync(file.path);
            }
            catch (e) { }
        }
        else if (reqBody.url || reqBody.targetUrl) {
            response = await fetch(`${AI_SERVICE_URL}/ai/parse-url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: reqBody.url || reqBody.targetUrl })
            });
        }
        else if (reqBody.topic || reqBody.textContent) {
            response = await fetch(`${AI_SERVICE_URL}/ai/parse-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: reqBody.topic || reqBody.textContent })
            });
        }
        else {
            throw new Error('No valid input provided (file, url, or topic)');
        }
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI service failed: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        let questions = data.questions || [];
        if (reqBody.count && !isNaN(parseInt(reqBody.count, 10)) && questions.length > parseInt(reqBody.count, 10)) {
            questions = questions.slice(0, parseInt(reqBody.count, 10));
        }
        await prisma_1.default.importJob.update({
            where: { jobId },
            data: {
                jobStatus: 'COMPLETED',
                parsedQuestions: JSON.stringify(questions),
                completedAt: new Date(),
            }
        });
    }
    catch (error) {
        console.error(`[Job ${jobId}] AI processing error:`, error);
        await prisma_1.default.importJob.update({
            where: { jobId },
            data: {
                jobStatus: 'FAILED',
            }
        });
    }
};
const importQuiz = async (req, res) => {
    try {
        const { title, topic, url, count, textContent, targetUrl } = req.body;
        const file = req.file;
        let jobTitle = title || topic || url || targetUrl || 'AI Generated Quiz';
        if (textContent)
            jobTitle = 'AI Generated Quiz from Text';
        if (file) {
            jobTitle = title || file.originalname || 'AI Generated Quiz from File';
        }
        // Create an import job
        const job = await prisma_1.default.importJob.create({
            data: {
                title: jobTitle,
                jobStatus: 'PROCESSING',
            }
        });
        // Start background processing
        processAiJob(job.jobId, req.body, file).catch(e => console.error("Unhandled error in processAiJob:", e));
        return res.status(202).json({
            success: true,
            message: 'Import started',
            data: job
        });
    }
    catch (error) {
        console.error('Error importing quiz:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.importQuiz = importQuiz;
const getImportStatus = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const job = await prisma_1.default.importJob.findUnique({
            where: { jobId }
        });
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        return res.json({
            success: true,
            message: 'Job status retrieved',
            data: job
        });
    }
    catch (error) {
        console.error('Error fetching job status:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.getImportStatus = getImportStatus;
