import { useEffect, useRef } from 'react';
import { useAnalysisStore } from '../stores/analysisStore';
import { useRecommendationsStore } from '../stores/recommendationsStore';

export function useAnalysisPolling(analysisId: string | null) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const updateStep = useAnalysisStore((s) => s.updateStep);
  const updateStats = useAnalysisStore((s) => s.updateStats);
  const fetchAnalysis = useAnalysisStore((s) => s.fetchAnalysis);
  const setError = useAnalysisStore((s) => s.setError);
  const setRecommendations = useRecommendationsStore((s) => s.setRecommendations);

  useEffect(() => {
    if (!analysisId) return;

    const es = new EventSource(`/api/analyses/${analysisId}/events`);
    eventSourceRef.current = es;

    es.addEventListener('step_update', (e) => {
      const data = JSON.parse(e.data);
      updateStep(data.step, data.status);
    });

    es.addEventListener('stats_update', (e) => {
      const data = JSON.parse(e.data);
      updateStats(data.stats);
    });

    es.addEventListener('recommendations_ready', (e) => {
      const data = JSON.parse(e.data);
      setRecommendations(data.recommendations);
      fetchAnalysis(analysisId);
      es.close();
    });

    es.addEventListener('error', (e) => {
      if (e instanceof MessageEvent) {
        const data = JSON.parse(e.data);
        setError(data.error);
      }
      es.close();
    });

    es.onerror = () => {
      // EventSource auto-reconnects, but close if analysis is done
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [analysisId, updateStep, updateStats, fetchAnalysis, setError, setRecommendations]);
}
