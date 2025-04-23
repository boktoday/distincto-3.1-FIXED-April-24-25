import fileSystemService from './fileSystem';
import aiService from './aiService'; // Import aiService to access settings

// AssemblyAI API configuration
const ASSEMBLY_AI_API_URL = 'https://api.assemblyai.com/v2';
// REMOVED: const ASSEMBLY_AI_API_KEY = '...'; // No longer hardcoded

export class TranscriptionService {

  private getApiKey(): string | null {
    return aiService.getSettings().assemblyAiApiKey;
  }

  private async uploadAudioFile(audioBlob: Blob): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('AssemblyAI API Key is not configured in settings.');
    }

    try {
      console.log('Starting audio upload to AssemblyAI');

      // First, we need to get an upload URL from AssemblyAI
      const uploadResponse = await fetch(`${ASSEMBLY_AI_API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey // Use the key from settings
        },
        body: audioBlob
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        console.error('AssemblyAI upload URL error:', errorData);
        throw new Error(`Failed to get upload URL: ${errorData.error || uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      const uploadUrl = uploadData.upload_url;

      console.log('Successfully obtained upload URL:', uploadUrl);
      return uploadUrl;
    } catch (error) {
      console.error('Error uploading audio to AssemblyAI:', error);
      throw new Error('Failed to upload audio for transcription. Please try again.');
    }
  }

  private async requestTranscription(audioUrl: string): Promise<string> {
     const apiKey = this.getApiKey();
     if (!apiKey) {
       throw new Error('AssemblyAI API Key is not configured in settings.');
     }

    try {
      console.log('Requesting transcription for audio URL:', audioUrl);

      const response = await fetch(`${ASSEMBLY_AI_API_URL}/transcript`, {
        method: 'POST',
        headers: {
          'Authorization': apiKey, // Use the key from settings
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: 'en_us' // Ensure this matches your expected language
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AssemblyAI transcription request error:', errorData);
        throw new Error(`Failed to request transcription: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Transcription requested successfully, ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error requesting transcription:', error);
      throw new Error('Failed to request transcription. Please try again.');
    }
  }

  private async pollTranscriptionStatus(transcriptId: string): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('AssemblyAI API Key is not configured in settings.');
    }

    try {
      let transcriptionComplete = false;
      let transcriptText = '';
      let attempts = 0;
      const maxAttempts = 30; // Limit polling to prevent infinite loops (approx 1 minute)

      console.log('Starting to poll for transcription status, ID:', transcriptId);

      while (!transcriptionComplete && attempts < maxAttempts) {
        attempts++;

        // Wait for 2 seconds between polling
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check transcription status
        const response = await fetch(`${ASSEMBLY_AI_API_URL}/transcript/${transcriptId}`, {
          method: 'GET',
          headers: {
            'Authorization': apiKey // Use the key from settings
          }
        });

        if (!response.ok) {
          // Handle potential rate limits or temporary server issues gracefully
          if (response.status === 429 || response.status >= 500) {
             console.warn(`AssemblyAI status check temporary error: ${response.status}. Retrying...`);
             continue; // Retry after the delay
          }
          const errorData = await response.json();
          console.error('AssemblyAI status check error:', errorData);
          throw new Error(`Failed to check transcription status: ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        console.log(`Polling attempt ${attempts}, status: ${data.status}`);

        if (data.status === 'completed') {
          transcriptionComplete = true;
          transcriptText = data.text || '';
          console.log('Transcription completed:', transcriptText);
        } else if (data.status === 'error') {
          console.error('Transcription error from API:', data.error);
          throw new Error(`Transcription failed: ${data.error}`);
        } else if (data.status !== 'queued' && data.status !== 'processing') {
           // Handle unexpected statuses
           console.warn(`Unexpected transcription status: ${data.status}`);
           // Depending on the API, you might want to treat this as an error or continue polling
        }
        // Continue polling if status is 'queued' or 'processing'
      }

      if (!transcriptionComplete) {
        console.error('Transcription polling timed out after', maxAttempts * 2, 'seconds');
        throw new Error('Transcription timed out. The audio might be too long or the service is busy.');
      }

      return transcriptText;
    } catch (error) {
      console.error('Error polling transcription status:', error);
      // Ensure the error message passed up is helpful
      throw new Error(`Failed to retrieve transcription result: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Save audio recording to file system
  private async saveRecording(audioBlob: Blob, fieldName: string): Promise<string> {
    const timestamp = Date.now();
    // Ensure fieldName is filesystem-friendly (replace spaces, etc.)
    const safeFieldName = fieldName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `recording_${safeFieldName}_${timestamp}.webm`;
    const childName = 'recordings'; // Use a dedicated folder for recordings

    try {
      // Save the recording using the saveFile method
      const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });

      console.log(`Attempting to save recording: ${fileName} in folder: ${childName}`);
      const savedPath = await fileSystemService.saveFile(childName, fileName, audioFile);

      console.log('Recording saved successfully to file system:', savedPath);
      // Return the path, which includes the childName folder
      return savedPath;
    } catch (error: any) {
      console.error(`Error saving recording "${fileName}" to file system:`, error);
      // Throw a more informative error message
      throw new Error(`Failed to save recording locally: ${error.message || 'Unknown file system error'}. Please try again.`);
    }
  }

  // Main method to transcribe audio
  async transcribeAudio(audioBlob: Blob, fieldName: string): Promise<{ text: string, fileName: string }> {
    if (!audioBlob || audioBlob.size === 0) {
      console.error('Transcription attempted with empty audio blob.');
      throw new Error('Cannot transcribe empty recording.');
    }
    // Check if transcription is configured via aiService
    if (!aiService.isTranscriptionConfigured()) {
       console.error('AssemblyAI API Key is missing in settings.');
       throw new Error('Transcription service is not configured. Please add your AssemblyAI API key in the AI Settings.');
    }

    let savedFileName = ''; // Keep track of the saved file name

    try {
      console.log('Starting transcription process for field:', fieldName, 'Audio blob size:', audioBlob.size, 'bytes');

      // Save the recording locally first
      savedFileName = await this.saveRecording(audioBlob, fieldName);
      console.log('Recording saved locally as:', savedFileName);

      // Upload audio file to AssemblyAI
      const audioUrl = await this.uploadAudioFile(audioBlob);

      // Request transcription
      const transcriptId = await this.requestTranscription(audioUrl);

      // Poll for transcription result
      const transcriptText = await this.pollTranscriptionStatus(transcriptId);

      return {
        text: transcriptText || 'Transcription completed, but no text was returned.', // Provide clearer feedback
        fileName: savedFileName // Return the actual saved path/filename
      };
    } catch (error) {
      console.error('Error in transcription process:', error);
      // Re-throw the error so it's caught by the VoiceRecorder component
      throw error;
    }
  }
}

// Create and export a singleton instance
const transcriptionService = new TranscriptionService();
export default transcriptionService;
