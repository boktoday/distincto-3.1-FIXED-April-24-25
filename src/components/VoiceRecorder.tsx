import React, { useState, useRef, useEffect } from 'react';
import transcriptionService from '../services/transcriptionService';

interface VoiceRecorderProps {
  onTranscriptionComplete?: (text: string) => void;
  fieldName?: string;
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onTranscriptionComplete, 
  fieldName,
  disabled = false 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTimerAndRecording();
    };
  }, []);

  // Separate effect to handle recording state changes
  useEffect(() => {
    if (!isRecording) {
      stopTimerAndRecording();
    }
  }, [isRecording]);

  const stopTimerAndRecording = () => {
    // Clear the timer
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Stop the media recorder if it's active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping media recorder:', err);
      }
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      console.log('Microphone access granted');
      
      const options = { mimeType: 'audio/webm' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio data chunk received, size:', event.data.size);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        // Process the recorded audio
        if (audioChunksRef.current.length > 0) {
          console.log('Creating audio blob from', audioChunksRef.current.length, 'chunks');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('Audio blob created, size:', audioBlob.size);
          await transcribeAudio(audioBlob);
        } else {
          console.error('No audio data collected during recording');
          setError('No audio data collected. Please try again.');
        }
      };
      
      // Start recording
      mediaRecorderRef.current.start(1000); // Collect data every second
      console.log('Recording started');
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        console.log('Stopping recording...');
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      } catch (err) {
        console.error('Error stopping recording:', err);
        setError('Error stopping recording. Please try again.');
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);
      setError(null);
      
      console.log('Starting transcription for audio blob:', audioBlob.size, 'bytes');
      const { text } = await transcriptionService.transcribeAudio(audioBlob, fieldName || '');
      console.log('Transcription completed:', text);
      
      // Call the callback with the transcribed text
      if (onTranscriptionComplete) {
        onTranscriptionComplete(text);
      }
      
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Failed to transcribe audio. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          disabled={disabled}
        >
          <span className="mr-2 h-2 w-2 bg-white rounded-full animate-pulse"></span>
          {formatTime(recordingTime)}
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-700"
          disabled={isTranscribing || disabled}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Record
        </button>
      )}
      
      {isTranscribing && (
        <span className="text-sm text-gray-500 flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Transcribing...
        </span>
      )}
      
      {error && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  );
};

export default VoiceRecorder;
