const aiService = require('../services/aiService');

exports.chat = async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        const reply = await aiService.chat(message, history);
        res.json({ success: true, reply });
    } catch (error) {
        res.status(500).json({ success: false, message: 'AI Chat failed' });
    }
};

exports.analyzeImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        // Pass buffer and mimetype to service
        const analysis = await aiService.analyzeImage(req.file.buffer, req.file.mimetype);
        res.json({ success: true, data: analysis });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Image analysis failed' });
    }
};

exports.suggestPriority = async (req, res) => {
    try {
        const { description, category } = req.body;
        const priority = await aiService.suggestPriority(description, category);
        res.json({ success: true, priority });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Priority suggestion failed' });
    }
};

exports.suggestResolution = async (req, res) => {
    try {
        const { title, description, category } = req.body;
        const result = await aiService.suggestResolution({ title, description, category });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Resolution suggestion failed' });
    }
};
