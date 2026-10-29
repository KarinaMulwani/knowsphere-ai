'use client';

import { useState, useEffect, useCallback } from 'react';
import TopNav from '@/components/TopNav';
import Sidebar from '@/components/Sidebar';
import ChatWorkspace from '@/components/ChatWorkspace';
import SourcesPanel from '@/components/SourcesPanel';
import { DEFAULT_MODEL_ID } from '@/lib/config';
import type { Source } from '@/lib/types';

export default function HomePage() {
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL_ID);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  const [chatKey, setChatKey] = useState(0);
  const [relatedQuestion, setRelatedQuestion] = useState<string | undefined>();
  // Dynamic counts are managed reactively by Sidebar via getDashboardStats()
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryConvId = urlParams.get('c');
      if (queryConvId) {
        setConversationId(queryConvId);
      }
    }
  }, []);

  const handleNewChat = () => {
    setChatKey((k) => k + 1);
    setConversationId(null);
    setSources([]);
    setRelatedQuestions([]);
    setRelatedQuestion(undefined);
  };

  const handleSourcesUpdate = useCallback((s: Source[], r: string[]) => {
    setSources(s);
    setRelatedQuestions(r);
  }, []);

  const handleRelatedQuestion = (q: string) => {
    setRelatedQuestion(q);
  };

  return (
    <div className="app-shell">
      <TopNav selectedModel={selectedModel} onModelSelect={setSelectedModel} />
      <div className="app-body">
        <Sidebar onNewChat={handleNewChat} />
        <ChatWorkspace
          key={chatKey}
          conversationId={conversationId}
          onConversationStart={setConversationId}
          onSourcesUpdate={handleSourcesUpdate}
          selectedModel={selectedModel}
          onModelSelect={setSelectedModel}
          onRelatedQuestion={handleRelatedQuestion}
          initialQuestion={relatedQuestion}
        />
        <SourcesPanel
          sources={sources}
          relatedQuestions={relatedQuestions}
          onRelatedQuestion={handleRelatedQuestion}
        />
      </div>
    </div>
  );
}
