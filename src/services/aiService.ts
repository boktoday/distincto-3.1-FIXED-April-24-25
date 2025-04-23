import { JournalEntry, FoodItem, ReportType, SmartSummaryData, AISettingsData } from '../types';
import { mockSummaryData, mockPatternData, mockTrendData, mockRecommendationsData } from '../mockData'; // Assuming mock data exists

// --- AI Service ---
// Handles interaction with AI models (OpenRouter or Ollama) and stores related settings

class AIService {
  private settings: AISettingsData = {
    openRouterApiKey: null,
    openRouterModel: 'google/gemma-3-27b-it:free', // Default OpenRouter model
    ollamaEndpoint: 'http://localhost:11434', // Default Ollama endpoint
    ollamaModel: 'llama3', // Default Ollama model
    useOllama: false,
    assemblyAiApiKey: null, // Default AssemblyAI Key
  };

  constructor() {
    this.loadSettings();
  }

  loadSettings() {
    try {
      const storedSettings = localStorage.getItem('aiSettings');
      if (storedSettings) {
        const parsedSettings = JSON.parse(storedSettings);
        // Merge stored settings with defaults, ensuring all keys are present
        this.settings = { ...this.settings, ...parsedSettings };
        // Ensure useOllama is explicitly boolean
        this.settings.useOllama = !!parsedSettings.useOllama;
      } else {
         // If no settings stored, save the defaults
         localStorage.setItem('aiSettings', JSON.stringify(this.settings));
      }
    } catch (error) {
      console.error("Failed to load AI settings from localStorage:", error);
      // Fallback to defaults if loading fails
      this.settings = {
        openRouterApiKey: null,
        openRouterModel: 'google/gemma-3-27b-it:free',
        ollamaEndpoint: 'http://localhost:11434',
        ollamaModel: 'llama3',
        useOllama: false,
        assemblyAiApiKey: null,
      };
    }
    console.log("AI Service initialized/loaded settings:", {
      ...this.settings,
      openRouterApiKey: this.settings.openRouterApiKey ? '******' : 'Not Set',
      assemblyAiApiKey: this.settings.assemblyAiApiKey ? '******' : 'Not Set',
    });
  }

  getSettings(): AISettingsData {
    // Return a copy to prevent direct modification
    return { ...this.settings };
  }

  async updateSettings(newSettings: Partial<AISettingsData>): Promise<void> {
     // Ensure endpoint doesn't have trailing slashes before saving
     if (newSettings.ollamaEndpoint) {
       newSettings.ollamaEndpoint = newSettings.ollamaEndpoint.replace(/\/+$/, '');
     }

    this.settings = { ...this.settings, ...newSettings };
    // Ensure useOllama is explicitly boolean
    this.settings.useOllama = !!newSettings.useOllama;

    try {
      localStorage.setItem('aiSettings', JSON.stringify(this.settings));
      console.log("AI Service settings updated:", {
        ...this.settings,
        openRouterApiKey: this.settings.openRouterApiKey ? '******' : 'Not Set',
        assemblyAiApiKey: this.settings.assemblyAiApiKey ? '******' : 'Not Set',
      });
    } catch (error) {
      console.error("Failed to save AI settings to localStorage:", error);
    }
  }

  // Checks if AI for *report generation* is configured
  isReportConfigured(): boolean {
    if (this.settings.useOllama) {
      // For Ollama, endpoint and model are needed
      return !!this.settings.ollamaEndpoint && !!this.settings.ollamaModel;
    } else {
      // For OpenRouter, API key and model are needed
      return !!this.settings.openRouterApiKey && !!this.settings.openRouterModel;
    }
  }

  // Checks if AI for *transcription* is configured
  isTranscriptionConfigured(): boolean {
    return !!this.settings.assemblyAiApiKey;
  }

  async testConnection(testSettings: AISettingsData): Promise<boolean> {
    console.log("Testing AI connection with settings:", {
      ...testSettings,
      openRouterApiKey: testSettings.openRouterApiKey ? '******' : 'Not Set',
      assemblyAiApiKey: testSettings.assemblyAiApiKey ? '******' : 'Not Set', // Log masked key
    });

    // Ensure endpoint doesn't have trailing slashes for testing
    const cleanedOllamaEndpoint = (testSettings.ollamaEndpoint || '').replace(/\/+$/, '');

    if (testSettings.useOllama) {
      // Test Ollama connection
      if (!cleanedOllamaEndpoint) {
        throw new Error("Ollama endpoint is not configured.");
      }
      try {
        // Use the /api/tags endpoint as a simple connectivity check
        const baseUrl = cleanedOllamaEndpoint.replace(/\/v1\/?$/, ''); // Remove potential /v1 suffix
        const response = await fetch(`${baseUrl}/api/tags`, {
           method: 'GET',
           headers: {
             'Accept': 'application/json',
           }
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Ollama connection test failed:', response.status, response.statusText, errorText);
          throw new Error(`Ollama connection failed: ${response.statusText} - ${errorText.substring(0, 100)}`);
        }
        console.log("Ollama connection test successful.");
        return true;
      } catch (error) {
        console.error('Error testing Ollama connection:', error);
        throw new Error(`Failed to connect to Ollama endpoint ${baseUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Test OpenRouter connection
      if (!testSettings.openRouterApiKey) {
        throw new Error("OpenRouter API Key is not configured.");
      }
      if (!testSettings.openRouterModel) {
        throw new Error("OpenRouter model is not configured.");
      }
      try {
        // Perform a simple, low-cost request to OpenRouter to validate the key and model
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${testSettings.openRouterApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: testSettings.openRouterModel,
            messages: [{ role: "user", content: "Test connection" }],
            max_tokens: 1, // Keep it minimal
          }),
        });

        if (!response.ok) {
           const errorData = await response.json().catch(() => ({ detail: 'Unknown error structure' }));
           console.error('OpenRouter connection test failed:', response.status, response.statusText, errorData);
           const errorMessage = errorData?.error?.message || errorData?.detail || response.statusText;
           throw new Error(`OpenRouter connection failed: ${response.status} ${errorMessage}`);
        }
        console.log("OpenRouter connection test successful.");
        return true; // Assuming a 2xx response means success
      } catch (error) {
        console.error('Error testing OpenRouter connection:', error);
         throw new Error(`Failed to connect to OpenRouter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    // Note: Testing AssemblyAI connection here is tricky as it requires an upload.
    // We rely on the user providing a valid key. Actual validation happens during transcription.
  }


  // --- Report Generation Logic ---

  async generateReportContent(
    type: ReportType,
    entries: JournalEntry[],
    foodItems: FoodItem[]
  ): Promise<string | SmartSummaryData> {
    console.log(`Generating report: ${type}`);
    console.log(`Using ${entries.length} journal entries and ${foodItems.length} food items.`);
    console.log("Current AI settings for reports:", {
      useOllama: this.settings.useOllama,
      openRouterModel: this.settings.openRouterModel,
      ollamaEndpoint: this.settings.ollamaEndpoint,
      ollamaModel: this.settings.ollamaModel,
    });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Basic check if configured for reports
    if (!this.isReportConfigured()) {
      console.warn("AI Service for reports not configured, returning mock data.");
      // Return mock data even if not configured for now
    } else {
        console.log(`AI Service for reports is configured. Using ${this.settings.useOllama ? 'Ollama' : 'OpenRouter'}.`);
        // TODO: Implement actual API calls to OpenRouter or Ollama based on settings
        // For now, we still return mock data after the configuration check.
    }


    // Prepare a combined text context (simplified example)
    let context = `Child Name: ${entries[0]?.childName || foodItems[0]?.childName || 'Unknown'}\n\n`;
    context += "--- Journal Entries ---\n";
    entries.forEach(entry => {
      context += `Date: ${new Date(entry.timestamp).toLocaleDateString()}\n`;
      if (entry.medicationNotes) context += `Medication: ${entry.medicationNotes}\n`;
      if (entry.educationNotes) context += `Education: ${entry.educationNotes}\n`;
      if (entry.socialEngagementNotes) context += `Social: ${entry.socialEngagementNotes}\n`;
      if (entry.sensoryProfileNotes) context += `Sensory: ${entry.sensoryProfileNotes}\n`;
      if (entry.foodNutritionNotes) context += `Food/Nutrition: ${entry.foodNutritionNotes}\n`;
      if (entry.behavioralNotes) context += `Behavior: ${entry.behavioralNotes}\n`;
      if (entry.sleepNotes) context += `Sleep: ${entry.sleepNotes}\n`; // Include sleep notes
      if (entry.magicMoments) context += `Magic Moments: ${entry.magicMoments}\n`;
      context += "---\n";
    });

    context += "\n--- Food Items ---\n";
    foodItems.forEach(item => {
      context += `Date: ${new Date(item.timestamp).toLocaleDateString()}\n`;
      context += `Food: ${item.name} (Category: ${item.category})\n`;
      if (item.notes) context += `Notes: ${item.notes}\n`;
      context += "---\n";
    });

    console.log("Mock AI Context Snippet:", context.substring(0, 500) + "..."); // Log snippet of context

    // Return mock data based on type
    switch (type) {
      case 'summary':
        // For summary, we expect structured data
        return {
            ...mockSummaryData, // Use imported mock data
            overview: `This is a mock smart summary based on ${entries.length} journal entries and ${foodItems.length} food items, including sleep notes. ${mockSummaryData.overview}`
        };
      case 'pattern':
        return `*Mock Pattern Analysis*:\n${mockPatternData}\n\nIdentified patterns across ${entries.length} journal entries and ${foodItems.length} food items, considering sleep patterns.`;
      case 'trend':
         return `*Mock Trend Report*:\n${mockTrendData}\n\nAnalyzed trends over time from ${entries.length} journal entries and ${foodItems.length} food items, including sleep data trends.`;
      case 'recommendations':
        return `*Mock Recommendations*:\n${mockRecommendationsData}\n\nBased on analysis of ${entries.length} journal entries and ${foodItems.length} food items, including sleep information.`;
      default:
        console.error(`Unknown report type: ${type}`);
        throw new Error(`Unsupported report type: ${type}`);
    }
  }
}

const aiService = new AIService();
export default aiService;
