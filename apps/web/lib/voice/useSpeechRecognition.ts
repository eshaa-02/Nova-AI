"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionResult {
  supported: boolean;
  listening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition(
  onFinalResult: (text: string) => void
): UseSpeechRecognitionResult {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const shouldSendResultRef = useRef(false);
  const onFinalResultRef = useRef(onFinalResult);

  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      setError(
        "Speech recognition is not supported in this browser. Please use Chrome or Edge."
      );
      return;
    }

    setSupported(true);

    const recognition = new SpeechRecognitionCtor();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result = event.results[i];
        const text = result[0]?.transcript || "";

        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      if (finalText.trim()) {
        finalTranscriptRef.current = (
          finalTranscriptRef.current +
          " " +
          finalText
        ).trim();

        setTranscript(finalTranscriptRef.current);
        shouldSendResultRef.current = true;
      }

      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      setListening(false);

      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
        case "permission-denied":
          setError(
            "Microphone permission was denied. Please allow microphone access in your browser."
          );
          break;

        case "no-speech":
          // Don't show an error if the user simply didn't speak.
          setError(null);
          break;

        case "aborted":
          // User intentionally stopped the microphone.
          setError(null);
          break;

        case "network":
          setError(
            "Speech recognition needs an internet connection."
          );
          break;

        default:
          setError(
            "Speech recognition failed. Please try again."
          );
      }
    };

    recognition.onend = () => {
      setListening(false);
      setInterimTranscript("");

      if (
        shouldSendResultRef.current &&
        finalTranscriptRef.current.trim()
      ) {
        const text = finalTranscriptRef.current.trim();

        shouldSendResultRef.current = false;
        finalTranscriptRef.current = "";

        setTranscript("");

        onFinalResultRef.current(text);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch { }

      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;

      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    if (!recognitionRef.current) {
      setError(
        "Speech recognition is not available. Please use Chrome or Edge."
      );
      return;
    }

    if (listening) return;

    finalTranscriptRef.current = "";
    shouldSendResultRef.current = false;

    setTranscript("");
    setInterimTranscript("");
    setError(null);

    try {
      recognitionRef.current.start();
    } catch (err: any) {
      if (err?.name !== "InvalidStateError") {
        setError("Could not start microphone. Please try again.");
      }
    }
  }, [listening]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch { }
  }, []);

  return {
    supported,
    listening,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
  };
}