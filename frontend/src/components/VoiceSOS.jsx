import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';

const DANGER_KEYWORDS = [
  'help me', 'help', 'sos', 'emergency', 'save me',
  'leave me alone', 'stop it', 'let me go', 'call police',
  'someone help', 'i need help', 'please help', 'danger',
  'fire', 'attack',
];

export default function VoiceSOS({ onTrigger, disabled }) {
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [error, setError]         = useState('');

  // Use refs so callbacks always read the latest values without re-creating
  const recognitionRef  = useRef(null);
  const triggeredRef    = useRef(false);   // cooldown flag — avoids stale closure bug
  const onTriggerRef    = useRef(onTrigger);
  const shouldRunRef    = useRef(false);   // tracks whether we want recognition active

  // Keep onTriggerRef current without re-creating startListening
  useEffect(() => { onTriggerRef.current = onTrigger; }, [onTrigger]);

  const stopListening = useCallback(() => {
    shouldRunRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError('');
    triggeredRef.current = false;
    shouldRunRef.current = true;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice recognition is not supported. Use Chrome or Edge.');
      return;
    }

    // Don't create a second instance if already running
    if (recognitionRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = 'en-IN';
    recognition.maxAlternatives = 3;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        setLastHeard(transcript);

        // Also check all alternative transcripts for better accuracy
        for (let a = 0; a < event.results[i].length; a++) {
          const alt = event.results[i][a].transcript.toLowerCase().trim();
          const matched = DANGER_KEYWORDS.find((kw) => alt.includes(kw));
          if (matched && !triggeredRef.current) {
            triggeredRef.current = true;
            setLastHeard(`Keyword detected: "${matched}"`);
            onTriggerRef.current(matched);
            // Reset cooldown after 10 seconds
            setTimeout(() => { triggeredRef.current = false; }, 10000);
            break;
          }
        }
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech') return;       // normal silence — ignore
      if (e.error === 'aborted') return;          // we called abort() ourselves — ignore
      if (e.error === 'not-allowed') {
        setError('Microphone access denied. Allow mic access in browser settings.');
        shouldRunRef.current = false;
        setListening(false);
        return;
      }
      console.warn('[VoiceSOS] speech error:', e.error);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      // Auto-restart only if we still want recognition running
      if (shouldRunRef.current) {
        setTimeout(() => {
          if (shouldRunRef.current) startListening();
        }, 600);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      recognitionRef.current = null;
      setError('Could not start voice recognition: ' + err.message);
    }
  }, []); // stable — no deps that change

  const toggle = () => {
    if (listening) { stopListening(); } else { startListening(); }
  };

  // Auto-start on mount, stop on unmount
  useEffect(() => {
    startListening();
    return () => stopListening();
  }, [startListening, stopListening]);

  return (
    <div style={{
      padding: 14,
      background: 'var(--neutral-50)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--r-lg)',
    }}>
      <div className="row-between" style={{ marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mic size={15} strokeWidth={2} color="var(--text-muted)" />
            Live voice monitoring
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Monitors for keywords to trigger automated SOS
          </div>
        </div>
        <button
          type="button"
          className={`btn btn-sm ${listening ? 'btn-danger' : 'btn-secondary'}`}
          onClick={toggle}
          disabled={disabled}
          aria-label={listening ? 'Stop voice monitoring' : 'Start voice monitoring'}
        >
          {listening
            ? <><MicOff size={13} strokeWidth={2} /> Stop</>
            : <><Mic size={13} strokeWidth={2} /> Start mic</>}
        </button>
      </div>

      {listening && (
        <div className="voice-indicator listening">
          <div className="voice-dot pulsing" aria-hidden="true" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-600)' }}>Listening…</div>
            {lastHeard && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                Heard: "{lastHeard}"
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="msg msg-error" style={{ marginTop: 8 }}>
          <AlertCircle size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Keywords:</strong>{' '}
        {DANGER_KEYWORDS.join(', ')}
      </div>
    </div>
  );
}
