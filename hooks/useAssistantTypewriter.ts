import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

const DEFAULT_CHAR_DELAY_MS = 20;

type StreamableMessage = {
  id: string;
  role: 'gemini';
  text: string;
  isStreaming?: boolean;
};

type UseAssistantTypewriterOptions = {
  charDelayMs?: number;
  onTick?: () => void;
};

export function useAssistantTypewriter<T extends StreamableMessage>(
  setMessages: Dispatch<SetStateAction<T[]>>,
  options: UseAssistantTypewriterOptions = {},
) {
  const { charDelayMs = DEFAULT_CHAR_DELAY_MS, onTick } = options;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishStreaming = useCallback(() => {
    clearTimer();
    streamingMessageIdRef.current = null;
    setStreamingMessageId(null);
  }, [clearTimer]);

  const cancelStream = useCallback(() => {
    const activeId = streamingMessageIdRef.current;
    clearTimer();

    if (activeId) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === activeId ? ({ ...message, isStreaming: false } as T) : message,
        ),
      );
    }

    streamingMessageIdRef.current = null;
    setStreamingMessageId(null);
  }, [clearTimer, setMessages]);

  const streamReply = useCallback(
    (messageId: string, fullText: string) => {
      clearTimer();

      streamingMessageIdRef.current = messageId;
      setStreamingMessageId(messageId);
      setMessages((prev) => [
        ...prev,
        { id: messageId, role: 'gemini', text: '', isStreaming: true } as T,
      ]);
      onTick?.();

      let index = 0;

      timerRef.current = setInterval(() => {
        if (streamingMessageIdRef.current !== messageId) {
          clearTimer();
          return;
        }

        index += 1;
        const partial = fullText.slice(0, index);
        const isComplete = index >= fullText.length;

        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId
              ? ({ ...message, text: partial, isStreaming: !isComplete } as T)
              : message,
          ),
        );
        onTick?.();

        if (isComplete) {
          finishStreaming();
        }
      }, charDelayMs);
    },
    [charDelayMs, clearTimer, finishStreaming, onTick, setMessages],
  );

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    streamReply,
    streamingMessageId,
    isStreaming: streamingMessageId !== null,
    cancelStream,
  };
}
