const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

/**
 * AI Service to handle Chat and Vision features.
 * Returns structured responses { text, options[] }
 */
class AIService {

    constructor() {
        this.model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;
        this.visionModel = genAI ? genAI.getGenerativeModel({ model: "gemini-pro-vision" }) : null;

        this.systemPrompt = `
      You are the CivicReport Assistant.
      Help citizens report issues (potholes, garbage, etc.).
      Keep answers concise.
    `;
    }

    async chat(message, history = []) {
        if (!this.model) {
            return this.getMockChatResponse(message);
        }

        try {
            const chat = this.model.startChat({
                history: history.map(h => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: h.content, // Note: Real Gemini history might need adjustment if we send JSON objects, but for now we keep it simple for real API
                })),
            });

            const result = await chat.sendMessage(this.systemPrompt + "\nUser: " + message);
            const text = await result.response.text();

            // For real AI, we just return text with standard options for now
            return {
                text: text,
                options: ["Report Issue", "Check Status", "Help"]
            };
        } catch (error) {
            console.error("AI Chat Error:", error);
            return {
                text: "I'm having trouble connecting right now. Please try again later.",
                options: ["Retry"]
            };
        }
    }

    async analyzeImage(imageBuffer, mimeType) {
        if (!this.visionModel) {
            return this.getMockImageResponse();
        }

        try {
            const prompt = `Analyze this civic issue image. 
            Return ONLY a JSON object with: 
            - category: (one of: pothole, garbage, streetlight, water_leak, other)
            - description: (professional 1-sentence summary)
            - priority: (low, medium, high - based on danger to citizens)
            - confidence: (high, medium, low)`;

            const result = await this.visionModel.generateContent([
                prompt,
                { inlineData: { data: imageBuffer.toString("base64"), mimeType: mimeType } }
            ]);

            const text = result.response.text();
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("AI Analysis Error:", error);
            return { category: "other", description: "Visual analysis inconclusive.", priority: "medium", confidence: "low" };
        }
    }

    async suggestPriority(description, category) {
        if (!this.model) {
            return this.getMockPriority(description, category);
        }

        try {
            const prompt = `As a civic official, rate the priority (low, medium, high) of this issue.
            Category: ${category}
            Description: ${description}
            Return only the word: low, medium, or high.`;

            const result = await this.model.generateContent(prompt);
            const priority = result.response.text().toLowerCase().trim();
            return ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
        } catch (error) {
            return 'medium';
        }
    }

    async suggestResolution(issueDetails) {
        if (!this.model) {
            return this.getMockResolution(issueDetails);
        }

        try {
            const prompt = `As a civic official, generate a professional resolution plan and response draft for this issue.
            Issue: ${issueDetails.title}
            Category: ${issueDetails.category}
            Description: ${issueDetails.description}
            
            Return JSON with:
            - suggested_action: (short official action, e.g., "Dispatch road crew")
            - response_draft: (professional 2-3 sentence response for the citizen)
            - estimated_days: (numeric estimate to resolve)`;

            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("AI Resolution Error:", error);
            return this.getMockResolution(issueDetails);
        }
    }

    // --- MOCK RESPONSES (Structured) ---

    getMockChatResponse(message) {
        const msg = message.toLowerCase();

        // 1. EMERGENCY
        if (msg.match(/\b(emergency|fire|accident|police|911)\b/)) {
            return {
                text: "⚠️ **EMERGENCY ALERT**: This platform is for non-emergency issues.\n\nPlease call **911** or Emergency Services immediately.",
                options: ["I understand", "Back to Menu"]
            };
        }

        // 2. GREETINGS
        if (msg.match(/\b(hi|hello|hey|start|menu)\b/)) {
            return {
                text: "👋 **Hello! Welcome to CivicReport.**\nI can help you report issues, track status, or answer questions.\n\nType a question or choose an option below:",
                options: ["📝 Report Issue", "🔍 Check Status", "💡 Issue Types", "🏆 Leaderboard"]
            };
        }

        // 3. REPORTING
        if (msg.includes("report") || msg.includes("file")) {
            return {
                text: "📝 **How to Report:**\n1. Click 'Report Issue' menu.\n2. Upload a photo.\n3. Use 'Analyze with AI'.\n4. Submit!",
                options: ["Start Reporting", "What categories?", "Main Menu"]
            };
        }

        // 4. CATEGORIES
        if (msg.includes("categories") || msg.includes("types") || msg.includes("pothole") || msg.includes("garbage")) {
            return {
                text: "We handle several categories:\n\n🛣️ **Roads**: Potholes, Cracks\n🗑️ **Sanitation**: Garbage, Dumping\n💡 **Electrical**: Streetlights\n💧 **Water**: Leaks, Drains\n\nChoose one for guidelines:",
                options: ["Roads", "Sanitation", "Streetlights", "Water"]
            };
        }

        // 5. STATUS
        if (msg.includes("status") || msg.includes("track")) {
            return {
                text: "🔍 **Status Tracking**:\nYou can track reports on your Dashboard.\nStatus flow: Pending → In Progress → Resolved.",
                options: ["Go to Dashboard", "Main Menu"]
            };
        }

        // DEFAULT
        return {
            text: "I understand you're asking about civic issues. I can help categorizes issues or guide you.",
            options: ["📝 Report Issue", "🔍 Check Status", "💡 Issue Types"]
        };
    }

    getMockImageResponse() {
        const mocks = [
            { category: 'pothole', description: 'Significant pothole on major roadway causing traffic hazard.', priority: 'high', confidence: 'high' },
            { category: 'garbage', description: 'Illegal dumping of waste in public residential area.', priority: 'medium', confidence: 'medium' },
            { category: 'streetlight', description: 'Malfunctioning streetlight causing low visibility at intersection.', priority: 'medium', confidence: 'medium' },
            { category: 'water_leak', description: 'Suspected main water line leak causing minor localized flooding.', priority: 'high', confidence: 'high' }
        ];
        return mocks[Math.floor(Math.random() * mocks.length)];
    }

    getMockPriority(description, category) {
        const d = description.toLowerCase();
        if (d.includes('danger') || d.includes('hazard') || d.includes('flood') || d.includes('accident')) return 'high';
        if (d.includes('minor') || d.includes('cosmetic')) return 'low';
        return 'medium';
    }

    getMockResolution(issue) {
        const resolutions = {
            pothole: { suggested_action: "Dispatch asphalt repair crew", response_draft: "Thank you for reporting this pothole. A road maintenance crew has been scheduled to inspect and repair the surface within 48 hours.", estimated_days: 2 },
            garbage: { suggested_action: "Schedule sanitation pickup", response_draft: "We have received your report regarding uncollected waste. Our sanitation department will clear this location during the next scheduled cycle.", estimated_days: 1 },
            streetlight: { suggested_action: "Assign electrical contractor", response_draft: "The reported lighting issue has been logged. An electrical team will replace the faulty components to restore visibility shortly.", estimated_days: 3 },
            water_leak: { suggested_action: "Emergency utility inspection", response_draft: "Technical teams are being dispatched to address this water leak. We appreciate your prompt report in helping conserve resources.", estimated_days: 1 },
            other: { suggested_action: "Review by department head", response_draft: "Your report has been received and forwarded to the relevant department for detailed assessment and action.", estimated_days: 5 }
        };
        return resolutions[issue.category] || resolutions.other;
    }
}

module.exports = new AIService();
