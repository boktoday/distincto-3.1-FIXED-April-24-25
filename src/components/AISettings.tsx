import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, Server, Key, Mic } from 'lucide-react'; // Added Mic icon
import aiService from '../services/aiService';
import { AISettingsData } from '../types'; // Import the type

interface AISettingsProps {
  onClose: () => void;
}

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

const AISettings: React.FC<AISettingsProps> = ({ onClose }) => {
  // Use AISettingsData for state initialization and updates
  const [settings, setSettings] = useState<AISettingsData>(aiService.getSettings());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    // Load current settings on mount
    setSettings(aiService.getSettings());

    // If Ollama is enabled, fetch available models
    if (aiService.getSettings().useOllama) {
      fetchOllamaModels(aiService.getSettings().ollamaEndpoint);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // When useOllama or ollamaEndpoint changes in the *form state*, fetch models if Ollama is enabled
  useEffect(() => {
    if (settings.useOllama) {
      fetchOllamaModels(settings.ollamaEndpoint);
    } else {
      // Clear models if Ollama is disabled
      setOllamaModels([]);
    }
  }, [settings.useOllama, settings.ollamaEndpoint]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;

    // Handle checkbox separately
    const newValue = type === 'checkbox' ? (event.target as HTMLInputElement).checked : value;

    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: newValue,
    }));
  };


  const fetchOllamaModels = async (endpoint: string | undefined | null) => { // Allow null
    if (!endpoint) {
        setOllamaModels([]); // Clear models if endpoint is missing
        return;
    }

    setLoadingModels(true);
    setOllamaModels([]); // Clear previous models immediately
    try {
      // Extract the base URL without the /v1 path if it exists
      const baseUrl = endpoint.replace(/\/v1\/?$/, '').replace(/\/+$/, ''); // Also remove trailing slashes
      console.log('Fetching Ollama models from:', `${baseUrl}/api/tags`);

      const response = await fetch(`${baseUrl}/api/tags`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error fetching Ollama models:', response.status, response.statusText, errorText);
        setTestResult({ success: false, message: `Failed to fetch Ollama models: ${response.statusText}` });
        throw new Error(`Failed to fetch Ollama models: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Ollama models response:', data);

      if (data.models && Array.isArray(data.models)) {
        setOllamaModels(data.models);
        // If the current ollamaModel is not in the fetched list, reset it or select the first one
        if (settings.ollamaModel && !data.models.some((m: OllamaModel) => m.name === settings.ollamaModel)) {
            const defaultModel = data.models.length > 0 ? data.models[0].name : '';
             setSettings(prev => ({ ...prev, ollamaModel: defaultModel }));
             console.log(`Current Ollama model '${settings.ollamaModel}' not found. Resetting to '${defaultModel}'.`);
        }
      } else {
        console.error('Invalid response format from Ollama API:', data);
        setOllamaModels([]);
        setTestResult({ success: false, message: 'Received invalid model list from Ollama.' });
      }
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      setOllamaModels([]);
       if (!testResult?.success) { // Avoid overwriting a successful test message
         setTestResult({ success: false, message: `Error fetching models: ${error instanceof Error ? error.message : 'Unknown error'}` });
       }
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTestResult(null); // Clear previous test results on save
    try {
      // Pass the current form state to updateSettings
      await aiService.updateSettings(settings);
      setIsSaving(false);
      onClose(); // Close modal on successful save
    } catch (error) {
      console.error('Error saving AI settings:', error);
      setTestResult({ success: false, message: `Error saving settings: ${error instanceof Error ? error.message : 'Unknown error'}` });
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Pass the current form state (settings) to testConnection
      // This tests OpenRouter or Ollama connection based on 'useOllama'
      const result = await aiService.testConnection(settings);

      setTestResult({
        success: true,
        message: `Successfully connected to ${settings.useOllama ? 'Ollama' : 'OpenRouter'} API.`
      });

      // If testing Ollama connection was successful, fetch/refresh models
      if (settings.useOllama) {
        fetchOllamaModels(settings.ollamaEndpoint);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResult({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
       // Clear models if Ollama test failed
       if (settings.useOllama) {
         setOllamaModels([]);
       }
    } finally {
      setIsTesting(false);
    }
    // Note: AssemblyAI test is not performed here.
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center z-10">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Settings size={20} className="mr-2" />
            AI & Transcription Settings
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close settings"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="px-6 py-4 space-y-6">

          {/* === START: AssemblyAI Settings Section === */}
          <div className="space-y-4 pb-4 border-b border-gray-200">
             <h4 className="font-medium text-gray-900 mb-2 flex items-center">
               <Mic size={16} className="mr-2" />
               AssemblyAI Transcription Settings
             </h4>
             <div className="space-y-3">
               <div>
                 <label htmlFor="assemblyAiApiKey" className="block text-sm font-medium text-gray-700">
                   API Key
                 </label>
                 <input
                   type="password"
                   id="assemblyAiApiKey"
                   name="assemblyAiApiKey" // Add name attribute
                   value={settings.assemblyAiApiKey || ''}
                   onChange={handleInputChange}
                   placeholder="Enter your AssemblyAI API Key"
                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                 />
                 <p className="mt-1 text-xs text-gray-500">
                   Required for voice note transcription. Get your key from <a href="https://www.assemblyai.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">AssemblyAI</a>.
                 </p>
               </div>
             </div>
           </div>
           {/* === END: AssemblyAI Settings Section === */}


          {/* OpenRouter Settings */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Key size={16} className="mr-2" />
                OpenRouter API Settings (for Reports)
              </h4>
              <div className="space-y-3">
                <div>
                  <label htmlFor="openRouterApiKey" className="block text-sm font-medium text-gray-700">
                    API Key
                  </label>
                  <input
                    type="password"
                    id="openRouterApiKey"
                    name="openRouterApiKey" // Add name attribute
                    value={settings.openRouterApiKey || ''}
                    onChange={handleInputChange}
                    placeholder="sk-or-v1-..."
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={settings.useOllama} // Disable if Ollama is used
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">OpenRouter</a>
                  </p>
                </div>

                <div>
                  <label htmlFor="openRouterModel" className="block text-sm font-medium text-gray-700">
                    Model
                  </label>
                  <input
                    type="text"
                    id="openRouterModel"
                    name="openRouterModel" // Add name attribute
                    value={settings.openRouterModel || ''}
                    onChange={handleInputChange}
                    placeholder="google/gemma-3-27b-it:free"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={settings.useOllama} // Disable if Ollama is used
                  />
                   <p className="mt-1 text-xs text-gray-500">
                     E.g., <code className="text-xs">google/gemma-3-27b-it:free</code>, <code className="text-xs">anthropic/claude-3.5-sonnet</code>
                   </p>
                </div>
              </div>
            </div>

            {/* Ollama Settings */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Server size={16} className="mr-2" />
                Ollama Local Model Settings (for Reports)
              </h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="useOllama"
                    name="useOllama" // Add name attribute
                    type="checkbox"
                    checked={settings.useOllama}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="useOllama" className="ml-2 block text-sm text-gray-900">
                    Use Ollama for local AI models
                  </label>
                </div>

                <div>
                  <label htmlFor="ollamaEndpoint" className="block text-sm font-medium text-gray-700">
                    Ollama Endpoint
                  </label>
                  <input
                    type="text"
                    id="ollamaEndpoint"
                    name="ollamaEndpoint" // Add name attribute
                    value={settings.ollamaEndpoint || ''}
                    onChange={handleInputChange}
                    placeholder="http://localhost:11434"
                    disabled={!settings.useOllama}
                    className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!settings.useOllama ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Base URL (e.g., http://localhost:11434). Do not include /api or /v1.
                  </p>
                </div>

                <div>
                  <label htmlFor="ollamaModel" className="block text-sm font-medium text-gray-700">
                    Ollama Model
                  </label>
                  <select
                    id="ollamaModel"
                    name="ollamaModel" // Add name attribute
                    value={settings.ollamaModel || ''}
                    onChange={handleInputChange}
                    disabled={!settings.useOllama || loadingModels || ollamaModels.length === 0}
                    className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${!settings.useOllama ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  >
                    {loadingModels ? (
                      <option value="">Loading models...</option>
                    ) : ollamaModels.length > 0 ? (
                      <>
                        <option value="">Select a model</option>
                        {ollamaModels.map((model) => (
                          <option key={model.name} value={model.name}>
                            {model.name}
                          </option>
                        ))}
                      </>
                    ) : settings.useOllama ? (
                       <option value="">No models found</option>
                    ) : (
                       <option value="">Enable Ollama to select model</option>
                    )}
                  </select>
                  {settings.useOllama && !loadingModels && ollamaModels.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No models found at the specified endpoint. Ensure Ollama is running, the endpoint is correct, and models are installed. Try 'Test Connection'.
                    </p>
                  )}
                   {!settings.useOllama && (
                     <p className="mt-1 text-xs text-gray-500">
                       Enable 'Use Ollama' above to select a local model.
                     </p>
                   )}
                </div>
              </div>
            </div>
          </div>

          {/* Test Result Area */}
          {testResult && (
            <div className={`p-3 rounded-md text-sm ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {testResult.message}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            type="button"
            onClick={testConnection}
            disabled={isTesting || isSaving || (!settings.useOllama && !settings.openRouterApiKey) || (settings.useOllama && !settings.ollamaEndpoint)} // Disable if relevant fields missing
            title={
              (!settings.useOllama && !settings.openRouterApiKey) ? "Enter OpenRouter API Key to test" :
              (settings.useOllama && !settings.ollamaEndpoint) ? "Enter Ollama Endpoint to test" :
              "Test OpenRouter or Ollama connection"
            }
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Test Report AI
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isTesting} // Also disable save while testing
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AISettings;
