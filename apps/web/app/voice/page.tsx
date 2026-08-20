"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Volume2,
  VolumeX,
  RotateCcw,
  Square,
  Mic,
} from "lucide-react";

import { ChatShell } from "@/components/chat/ChatShell";
import { ComingSoon } from "@/components/ui/ComingSoon";
import {
  VoiceOrb,
  type VoiceSessionState,
} from "@/components/voice/VoiceOrb";
import { Waveform } from "@/components/voice/Waveform";
import { useChatStore } from "@/stores/chat.store";
import { useSpeechRecognition } from "@/lib/voice/useSpeechRecognition";
import { useSpeechSynthesis } from "@/lib/voice/useSpeechSynthesis";
import { useMicWaveform } from "@/lib/voice/useMicWaveform";

export default function VoiceChatPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionState, setSessionState] =
    useState<VoiceSessionState>("idle");
  const [muted, setMuted] = useState(false);

  const lastSpokenIdRef = useRef<string | null>(null);

  const createConversation = useChatStore(
    (state) => state.createConversation
  );

  const sendMessage = useChatStore(
    (state) => state.sendMessage
  );

  const generating = useChatStore(
    (state) => state.generating
  );

  const lastError = useChatStore(
    (state) => state.lastError
  );

  const messages = useChatStore((state) =>
    conversationId
      ? state.messagesByConversation[conversationId] || []
      : []
  );

  const waveform = useMicWaveform();

  const {
    speak,
    cancel: cancelSpeech,
    supported: ttsSupported,
  } = useSpeechSynthesis(() => {
    setSessionState("idle");
  });

  const handleFinalTranscript = async (text: string) => {
    const finalText = text.trim();

    if (!finalText) {
      waveform.stop();
      setSessionState("idle");
      return;
    }

    try {
      waveform.stop();
      setSessionState("processing");

      let activeConversationId = conversationId;

      if (!activeConversationId) {
        const conversation = await createConversation();

        activeConversationId = conversation.id;
        setConversationId(conversation.id);
      }

      sendMessage(activeConversationId, finalText);
    } catch {
      waveform.stop();
      setSessionState("error");

      window.setTimeout(() => {
        setSessionState("idle");
      }, 2000);
    }
  };

  const {
    supported: sttSupported,
    listening,
    interimTranscript,
    error: sttError,
    start: startListening,
    stop: stopListening,
  } = useSpeechRecognition(handleFinalTranscript);

  // Keep listening state synced
  useEffect(() => {
    if (listening) {
      setSessionState("listening");
    }
  }, [listening]);

  // If AI starts generating, show thinking
  useEffect(() => {
    if (generating) {
      setSessionState("processing");
    }
  }, [generating]);

  // If an AI error occurs, stop thinking
  useEffect(() => {
    if (!lastError) return;

    waveform.stop();
    setSessionState("error");

    const timeout = window.setTimeout(() => {
      setSessionState("idle");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [lastError, waveform]);

  // Speak completed assistant response
  useEffect(() => {
    if (generating) return;
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage.role !== "assistant" ||
      lastMessage.status !== "complete"
    ) {
      return;
    }

    if (lastSpokenIdRef.current === lastMessage.id) {
      return;
    }

    lastSpokenIdRef.current = lastMessage.id;

    if (muted || !ttsSupported) {
      setSessionState("idle");
      return;
    }

    if (!lastMessage.content.trim()) {
      setSessionState("idle");
      return;
    }

    setSessionState("speaking");
    speak(lastMessage.content);
  }, [
    generating,
    messages,
    muted,
    ttsSupported,
    speak,
  ]);

  // Important: if generation ends but there is no completed
  // assistant response, don't stay stuck on "Nova is thinking..."
  useEffect(() => {
    if (generating) return;

    const hasStreamingMessage = messages.some(
      (message) => message.status === "streaming"
    );

    const lastMessage = messages[messages.length - 1];

    if (
      !hasStreamingMessage &&
      sessionState === "processing" &&
      (!lastMessage ||
        lastMessage.role !== "assistant" ||
        lastMessage.status !== "complete")
    ) {
      setSessionState("idle");
    }
  }, [generating, messages, sessionState]);

  function handleMicClick() {
    if (sessionState === "processing" || sessionState === "speaking") {
      return;
    }

    if (sessionState === "listening") {
      stopListening();
      waveform.stop();

      // The final transcript callback will switch to processing.
      // If no speech was detected, return to idle.
      window.setTimeout(() => {
        setSessionState((current) =>
          current === "listening" ? "idle" : current
        );
      }, 500);

      return;
    }

    cancelSpeech();
    waveform.start();
    setSessionState("listening");

    try {
      startListening();
    } catch {
      waveform.stop();
      setSessionState("error");

      window.setTimeout(() => {
        setSessionState("idle");
      }, 2000);
    }
  }

  function handleEnd() {
    stopListening();
    cancelSpeech();
    waveform.stop();

    setConversationId(null);
    setSessionState("idle");

    lastSpokenIdRef.current = null;
  }

  if (!sttSupported) {
    return (
      <ChatShell>
        <ComingSoon
          icon={Mic}
          title="Voice Chat"
          description="Voice chat uses your browser's built-in speech recognition. Please use the latest version of Chrome, Edge, or Safari."
        />
      </ChatShell>
    );
  }

  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  return (
    <ChatShell>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex h-14 flex-none items-center justify-between border-b border-border px-4 sm:px-6">
          <h1 className="text-sm font-medium text-text">
            Voice Chat
          </h1>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (!muted && sessionState === "speaking") {
                  cancelSpeech();
                  setSessionState("idle");
                }

                setMuted((value) => !value);
              }}
              aria-label={muted ? "Unmute" : "Mute"}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-text"
            >
              {muted ? (
                <VolumeX size={16} />
              ) : (
                <Volume2 size={16} />
              )}
            </button>

            <button
              type="button"
              onClick={handleEnd}
              aria-label="End conversation"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-text"
            >
              <Square size={14} />
            </button>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-6 py-10">
          <Waveform
            levels={waveform.levels}
            active={sessionState === "listening"}
          />

          <div className="mt-8">
            <VoiceOrb
              state={sessionState}
              muted={muted}
              onClick={handleMicClick}
            />
          </div>

          <p className="mt-5 text-sm text-text-secondary">
            {sessionState === "idle" && "Tap to speak"}
            {sessionState === "listening" && "Listening..."}
            {sessionState === "processing" && "Nova is thinking..."}
            {sessionState === "speaking" && "Nova is speaking..."}
            {sessionState === "error" &&
              "Something went wrong. Please try again."}
          </p>

          {waveform.permission === "denied" && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-error">
              <AlertCircle size={12} />
              Microphone access was denied. Please allow microphone
              permission in your browser.
            </p>
          )}

          {sttError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-error">
              <AlertCircle size={12} />
              {sttError}
            </p>
          )}

          {lastError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-error">
              <AlertCircle size={12} />
              {lastError}
            </p>
          )}

          {(interimTranscript || lastUserMessage) && (
            <div className="mt-10 w-full rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                You
              </p>

              <p className="mt-1.5 text-sm text-text">
                {interimTranscript ||
                  lastUserMessage?.content}
              </p>
            </div>
          )}

          {lastAssistantMessage && (
            <div className="mt-3 w-full rounded-lg border border-border bg-accent-soft/20 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Nova
              </p>

              <p className="mt-1.5 whitespace-pre-wrap text-sm text-text">
                {lastAssistantMessage.content ||
                  "Thinking..."}
              </p>
            </div>
          )}

          {conversationId && (
            <button
              type="button"
              onClick={handleEnd}
              className="mt-8 flex items-center gap-1.5 text-xs text-muted hover:text-text"
            >
              <RotateCcw size={12} />
              Restart conversation
            </button>
          )}
        </div>
      </div>
    </ChatShell>
  );
}