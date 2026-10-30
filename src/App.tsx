import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { SpeakingScreen } from './components/SpeakingScreen';
import { CoachCard } from './components/CoachCard';
import { ProgressScreen } from './components/ProgressScreen';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MockTestSummaryModal } from './components/MockTestSummaryModal';
import { InstallModal } from './components/InstallModal';
import { AudioStreamer } from './utils/audioStreamer';
import { speechSynthesizer } from './utils/speechSynthesizer';
import {
  PART_1_TOPICS,
  PART_2_CUE_CARDS,
  FREE_TALK_TOPICS,
  Part2CueCard,
} from './data/ieltsTopics';
import {
  loadUserSessions,
  saveUserSession,
  loadMemoryProfile,
  getStoredApiKey,
  PracticeSessionRecord,
  UserMemoryProfile,
} from './utils/sessionMemory';
import { AnswerEvaluation, calculateOverallBand } from './utils/ieltsScoring';
import { evaluateDirectlyWithGemini } from './utils/geminiDirect';
import { AlertCircle, X } from 'lucide-react';

type AppView = 'home' | 'speaking' | 'progress';
type SessionMode = 'ielts_practice' | 'free_talk' | 'mock_test';
type IeltsPart = 'part1' | 'part2' | 'part3' | 'free_talk';

export default function App() {
  // Navigation & Modal State
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [sessionMode, setSessionMode] = useState<SessionMode>('ielts_practice');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [completedSession, setCompletedSession] = useState<PracticeSessionRecord | null>(null);

  // User Memory & History State
  const [sessions, setSessions] = useState<PracticeSessionRecord[]>([]);
  const [memoryProfile, setMemoryProfile] = useState<UserMemoryProfile>(loadMemoryProfile());
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [globalError, setGlobalError] = useState<{ message: string; code?: string } | null>(null);

  // Speaking Session State
  const [currentPart, setCurrentPart] = useState<IeltsPart>('part1');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentCueCard, setCurrentCueCard] = useState<Part2CueCard | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionEvaluations, setSessionEvaluations] = useState<any[]>([]);

  // Real-time audio & transcription
  const [isListening, setIsListening] = useState(false);
  const [isExaminerSpeaking, setIsExaminerSpeaking] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [volumeRms, setVolumeRms] = useState(0);
  const [silenceSeconds, setSilenceSeconds] = useState(0);

  // Coach Card Evaluation
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);

  // Refs for audio streaming and silence detection
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const liveWsRef = useRef<WebSocket | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');

  finalTranscriptRef.current = finalTranscript;
  interimTranscriptRef.current = interimTranscript;

  // Always-fresh pointer to the latest finish handler (fixes stale question/part on silence auto-submit)
  const handleFinishRef = useRef<() => void>(() => {});
  const evaluatingRef = useRef(false);

  // Initial load
  useEffect(() => {
    const key = getStoredApiKey();
    setUserApiKey(key);
    setSessions(loadUserSessions());
    setMemoryProfile(loadMemoryProfile());

    // Check if user has no key and server has no env key
    fetch('/api/key-status')
      .then((res) => res.json())
      .then((data) => {
        if (!key && !data.hasServerKey) {
          setIsApiKeyModalOpen(true);
        }
      })
      .catch(() => {
        if (!key) setIsApiKeyModalOpen(true);
      });
  }, []);

  // Initialize AudioStreamer
  const initAudio = async () => {
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stopMicrophone();
    }

    const streamer = new AudioStreamer({
      onInterimTranscript: (text) => {
        setInterimTranscript(text);
      },
      onFinalTranscript: (text) => {
        setFinalTranscript((prev) => (prev ? `${prev} ${text}` : text));
        setInterimTranscript('');
      },
      onVolumeChange: (rms) => {
        setVolumeRms(rms);
        if (rms < 0.015) {
          setSilenceSeconds((prev) => Math.min(2.0, prev + 0.1));
        } else {
          setSilenceSeconds(0);
        }
      },
      onSilenceDetected: () => {
        // Enforce The Golden Rule: 2.0s of continuous silence detected
        handleFinishRef.current();
      },
      onError: (err) => {
        console.warn('Audio streamer notice:', err);
      },
    });

    audioStreamerRef.current = streamer;
    const ok = await streamer.startMicrophone();
    setIsListening(ok);
  };

  // Connect WebSocket to Gemini Live API
  const connectLiveWs = (mode: string) => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live-ws?mode=${mode}&apiKey=${encodeURIComponent(
        userApiKey
      )}&voice=Zephyr`;
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'interim_transcript') {
            setInterimTranscript(msg.text);
          } else if (msg.type === 'input_transcript') {
            setFinalTranscript((prev) => (prev ? `${prev} ${msg.text}` : msg.text));
            setInterimTranscript('');
          } else if (msg.type === 'audio' && msg.audio) {
            setIsExaminerSpeaking(true);
            audioStreamerRef.current?.playPcmChunk(msg.audio);
          } else if (msg.type === 'turn_complete') {
            setIsExaminerSpeaking(false);
          } else if (msg.type === 'error') {
            if (msg.code === 'API_KEY_REQUIRED') {
              setIsApiKeyModalOpen(true);
            }
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onerror = (e) => {
        console.warn('Live WebSocket fallback to REST:', e);
      };

      liveWsRef.current = ws;
    } catch (err) {
      console.warn('WebSocket connection attempt:', err);
    }
  };

  // Speak Examiner Question aloud (Native British Voice with automatic zero-error fallback)
  const speakExaminerText = async (text: string) => {
    if (!text || isMuted) return;
    setIsExaminerSpeaking(true);
    try {
      await speechSynthesizer.speakExaminer(text, {
        isMuted,
        apiKey: userApiKey,
        preferCloud: false, // Default to instant, unlimited, free British IELTS voice
        playWavAudio: async (base64) => {
          if (audioStreamerRef.current) {
            await audioStreamerRef.current.playWavAudio(base64);
          }
        },
        onStart: () => setIsExaminerSpeaking(true),
        onEnd: () => setIsExaminerSpeaking(false),
      });
    } catch (err) {
      console.warn('TTS speech note:', err);
    } finally {
      setIsExaminerSpeaking(false);
    }
  };

  // Start IELTS Practice Session
  const handleStartIeltsPractice = async () => {
    setSessionMode('ielts_practice');
    setCurrentPart('part1');
    setQuestionIndex(0);
    setSessionEvaluations([]);
    setCurrentEvaluation(null);
    setGlobalError(null);

    const part1Set = PART_1_TOPICS[Math.floor(Math.random() * PART_1_TOPICS.length)];
    const q1 = part1Set.questions[0];
    setCurrentQuestion(q1);

    const cue = PART_2_CUE_CARDS[Math.floor(Math.random() * PART_2_CUE_CARDS.length)];
    setCurrentCueCard(cue);

    setCurrentView('speaking');
    setFinalTranscript('');
    setInterimTranscript('');
    setSilenceSeconds(0);

    await initAudio();
    speakExaminerText(q1);
  };

  // Start Free Talk Session
  const handleStartFreeTalk = async () => {
    setSessionMode('free_talk');
    setCurrentPart('free_talk');
    setQuestionIndex(0);
    setSessionEvaluations([]);
    setCurrentEvaluation(null);
    setGlobalError(null);

    const topic = FREE_TALK_TOPICS[Math.floor(Math.random() * FREE_TALK_TOPICS.length)];
    setCurrentQuestion(topic.starter);
    setCurrentCueCard(null);

    setCurrentView('speaking');
    setFinalTranscript('');
    setInterimTranscript('');
    setSilenceSeconds(0);

    await initAudio();
    speakExaminerText(topic.starter);
  };

  // Start Full Mock Test
  const handleStartMockTest = async () => {
    setSessionMode('mock_test');
    setCurrentPart('part1');
    setQuestionIndex(0);
    setSessionEvaluations([]);
    setCurrentEvaluation(null);
    setGlobalError(null);

    const part1Set = PART_1_TOPICS[0];
    const q1 = part1Set.questions[0];
    setCurrentQuestion(q1);

    const cue = PART_2_CUE_CARDS[0];
    setCurrentCueCard(cue);

    setCurrentView('speaking');
    setFinalTranscript('');
    setInterimTranscript('');
    setSilenceSeconds(0);

    await initAudio();
    speakExaminerText(q1);
  };

  // Toggle Microphone
  const handleToggleMic = async () => {
    if (isListening) {
      audioStreamerRef.current?.stopMicrophone();
      setIsListening(false);
    } else {
      await initAudio();
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    if (audioStreamerRef.current) {
      const muted = audioStreamerRef.current.toggleMute();
      setIsMuted(muted);
      if (muted) {
        speechSynthesizer.stop();
        setIsExaminerSpeaking(false);
      }
    } else {
      setIsMuted((prev) => {
        const next = !prev;
        if (next) {
          speechSynthesizer.stop();
          setIsExaminerSpeaking(false);
        }
        return next;
      });
    }
  };

  // THE GOLDEN RULE: Complete Answer (Triggered by "I'm done" OR 2s sustained silence)
  const handleUserFinishedAnswer = async () => {
    if (isEvaluating || evaluatingRef.current) return;

    const answer = (finalTranscriptRef.current + ' ' + interimTranscriptRef.current).trim();
    if (!answer || answer.length < 3) {
      return;
    }

    // Pause recording during evaluation
    audioStreamerRef.current?.resetSilenceTracker();
    setSilenceSeconds(0);
    setIsEvaluating(true);
    evaluatingRef.current = true;

    let evaluation: AnswerEvaluation | null = null;

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': userApiKey,
        },
        body: JSON.stringify({
          question: currentQuestion,
          userAnswer: answer,
          part: currentPart,
          mode: sessionMode,
          pastWeaknesses: memoryProfile.recurringWeaknesses,
        }),
      });

      if (res.ok) {
        evaluation = await res.json();
      } else if ((res.status === 404 || res.status === 405) && userApiKey) {
        // Static GitHub Pages deployment: call Gemini REST directly
        evaluation = await evaluateDirectlyWithGemini(
          currentQuestion,
          answer,
          userApiKey,
          currentPart
        );
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401 || errorData.code === 'API_KEY_REQUIRED') {
          setIsApiKeyModalOpen(true);
        } else if (res.status === 429) {
          setGlobalError({
            message: 'Gemini API quota exceeded. Please wait a moment before trying again.',
            code: 'QUOTA_EXCEEDED',
          });
        } else {
          setGlobalError({ message: errorData.error || 'Evaluation failed. Please try again.' });
        }
        evaluatingRef.current = false;
        setIsEvaluating(false);
        return;
      }
    } catch (err) {
      if (userApiKey) {
        try {
          evaluation = await evaluateDirectlyWithGemini(
            currentQuestion,
            answer,
            userApiKey,
            currentPart
          );
        } catch {
          setGlobalError({ message: 'Evaluation failed. Please verify your API key in Settings.' });
        }
      } else {
        setGlobalError({ message: 'Network error evaluating response. Please retry.' });
      }
    }

    if (!evaluation) {
      evaluatingRef.current = false;
      setIsEvaluating(false);
      return;
    }

    try {
      setCurrentEvaluation(evaluation);

      // Record this answer in session history
      const evalRecord = {
        question: currentQuestion,
        userAnswer: answer,
        band: evaluation.estimatedBand,
        criteria: evaluation.criteria,
        feedback: evaluation.oneSentenceFeedback,
        grammarHighlights: evaluation.grammarCorrections?.map((c) => c.improved) || [],
      };
      setSessionEvaluations((prev) => [...prev, evalRecord]);

      // Spoken examiner reaction
      const reaction = evaluation.oneSentenceFeedback;
      if (reaction && !isMuted) {
        speakExaminerText(reaction);
      }
    } finally {
      evaluatingRef.current = false;
      setIsEvaluating(false);
    }
  };
  handleFinishRef.current = handleUserFinishedAnswer;

  // Progress to Next Question in Flow
  const handleNextQuestion = async () => {
    setCurrentEvaluation(null);
    setFinalTranscript('');
    setInterimTranscript('');
    setSilenceSeconds(0);
    audioStreamerRef.current?.resetSilenceTracker();

    if (sessionMode === 'free_talk') {
      // Dynamic follow-up question in Free Talk
      try {
        const res = await fetch('/api/next-question', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-api-key': userApiKey,
          },
          body: JSON.stringify({
            mode: 'free_talk',
            currentPart: 'free_talk',
            previousQuestions: [currentQuestion],
            previousAnswers: [finalTranscriptRef.current],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const nextQ = data.nextQuestion || 'What are your thoughts on that?';
          setCurrentQuestion(nextQ);
          speakExaminerText(nextQ);
        }
      } catch {
        const nextTopic = FREE_TALK_TOPICS[(questionIndex + 1) % FREE_TALK_TOPICS.length];
        setCurrentQuestion(nextTopic.starter);
        speakExaminerText(nextTopic.starter);
      }
      setQuestionIndex((prev) => prev + 1);
      return;
    }

    // IELTS Practice & Mock Test Transitions: Part 1 -> Part 2 -> Part 3
    const nextIdx = questionIndex + 1;
    setQuestionIndex(nextIdx);

    if (currentPart === 'part1') {
      if (nextIdx < 3) {
        // Dynamic or set follow-up for Part 1
        try {
          const res = await fetch('/api/next-question', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-gemini-api-key': userApiKey,
            },
            body: JSON.stringify({
              mode: 'ielts_practice',
              currentPart: 'part1',
              previousQuestions: [currentQuestion],
              previousAnswers: [finalTranscriptRef.current],
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const nextQ = data.nextQuestion || PART_1_TOPICS[0].questions[nextIdx];
            setCurrentQuestion(nextQ);
            speakExaminerText(nextQ);
            return;
          }
        } catch {}
        const fallbackQ = PART_1_TOPICS[0].questions[nextIdx % PART_1_TOPICS[0].questions.length];
        setCurrentQuestion(fallbackQ);
        speakExaminerText(fallbackQ);
      } else {
        // Move to Part 2 (Long Turn / Cue Card)
        setCurrentPart('part2');
        const intro =
          "Now, in Part 2, I am going to give you a topic and I would like you to talk about it for one to two minutes. Before you talk, you have one minute to think about what you are going to say.";
        setCurrentQuestion(intro);
        speakExaminerText(intro);
      }
    } else if (currentPart === 'part2') {
      // Move to Part 3 (In-depth discussion)
      setCurrentPart('part3');
      const p3Questions =
        currentCueCard?.part3Questions || [
          'In what ways do modern lifestyles differ from those of past generations?',
          'Do you think technology brings people closer together or isolates them?',
        ];
      const p3q1 = p3Questions[0];
      setCurrentQuestion(p3q1);
      speakExaminerText(p3q1);
    } else if (currentPart === 'part3') {
      if (nextIdx < 6) {
        // More challenging Part 3 follow-up question
        try {
          const res = await fetch('/api/next-question', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-gemini-api-key': userApiKey,
            },
            body: JSON.stringify({
              mode: 'ielts_practice',
              currentPart: 'part3',
              previousQuestions: [currentQuestion],
              previousAnswers: [finalTranscriptRef.current],
            }),
          });
          if (res.ok) {
            const data = await res.json();
            const nextQ = data.nextQuestion || 'How do you anticipate this will evolve in the next twenty years?';
            setCurrentQuestion(nextQ);
            speakExaminerText(nextQ);
            return;
          }
        } catch {}
        const p3Questions = currentCueCard?.part3Questions || [];
        const fallbackQ = p3Questions[1] || 'Could you compare how this affects young people versus older generations?';
        setCurrentQuestion(fallbackQ);
        speakExaminerText(fallbackQ);
      } else {
        // Session complete!
        handleEndSession();
      }
    }
  };

  // End Session & Save to Storage
  const handleEndSession = () => {
    // Stop audio
    speechSynthesizer.stop();
    audioStreamerRef.current?.stopMicrophone();
    audioStreamerRef.current?.stopPlayback();
    setIsListening(false);
    setIsExaminerSpeaking(false);

    if (liveWsRef.current) {
      try {
        liveWsRef.current.close();
      } catch {}
    }

    if (sessionEvaluations.length > 0) {
      // Calculate overall band from evaluations
      const avgBand =
        sessionEvaluations.reduce((sum, e) => sum + e.band, 0) / sessionEvaluations.length;
      const avgOf = (key: 'fluency' | 'vocabulary' | 'grammar' | 'pronunciation'): number => {
        const vals = sessionEvaluations
          .map((e) => e.criteria?.[key])
          .filter((v): v is number => typeof v === 'number');
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : avgBand;
      };
      const criteriaAvg = {
        fluency: avgOf('fluency'),
        vocabulary: avgOf('vocabulary'),
        grammar: avgOf('grammar'),
        pronunciation: avgOf('pronunciation'),
      };
      const roundedBand = calculateOverallBand(criteriaAvg);
      const half = (n: number) => Math.round(n * 2) / 2;

      const record: PracticeSessionRecord = {
        id: `sess-${Date.now()}`,
        timestamp: Date.now(),
        mode: sessionMode,
        overallBand: roundedBand,
        criteria: {
          fluency: half(criteriaAvg.fluency),
          vocabulary: half(criteriaAvg.vocabulary),
          grammar: half(criteriaAvg.grammar),
          pronunciation: half(criteriaAvg.pronunciation),
        },
        questionCount: sessionEvaluations.length,
        evaluations: sessionEvaluations,
        notedWeaknesses: currentEvaluation?.recurringHabitsNoticed || [],
      };

      saveUserSession(record);
      setSessions(loadUserSessions());
      setMemoryProfile(loadMemoryProfile());
      setCompletedSession(record);
      setIsSummaryModalOpen(true);
    }

    setCurrentView('home');
  };

  // Fallback for typing text answers
  const handleSubmitTextAnswer = (text: string) => {
    setFinalTranscript(text);
    setInterimTranscript('');
    finalTranscriptRef.current = text;
    setTimeout(() => {
      handleUserFinishedAnswer();
    }, 100);
  };

  const currentOverallBand = sessions.length > 0 ? sessions[0].overallBand : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-black">
      {/* Global Error Banner */}
      {globalError && (
        <div className="bg-rose-950/90 border-b border-rose-800 text-rose-200 text-xs px-4 py-2.5 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{globalError.message}</span>
          </div>
          <button
            onClick={() => setGlobalError(null)}
            className="text-rose-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (currentView === 'speaking') {
            audioStreamerRef.current?.stopMicrophone();
            setIsListening(false);
          }
          setCurrentView(view);
        }}
        onOpenSettings={() => setIsApiKeyModalOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        hasCustomKey={Boolean(userApiKey)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {currentView === 'home' && (
          <HomeScreen
            onStartIeltsPractice={handleStartIeltsPractice}
            onStartFreeTalk={handleStartFreeTalk}
            onStartMockTest={handleStartMockTest}
            onViewProgress={() => setCurrentView('progress')}
            onOpenInstall={() => setIsInstallModalOpen(true)}
            currentBand={currentOverallBand}
            memoryProfile={memoryProfile}
          />
        )}

        {currentView === 'speaking' && (
          <SpeakingScreen
            mode={sessionMode}
            currentPart={currentPart}
            currentQuestion={currentQuestion}
            cueCard={currentCueCard}
            interimTranscript={interimTranscript}
            finalTranscript={finalTranscript}
            isListening={isListening}
            isExaminerSpeaking={isExaminerSpeaking}
            isEvaluating={isEvaluating}
            volumeRms={volumeRms}
            silenceSeconds={silenceSeconds}
            onToggleMic={handleToggleMic}
            onFinishAnswer={handleUserFinishedAnswer}
            onRepeatQuestion={() => speakExaminerText(currentQuestion)}
            onEndSession={handleEndSession}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onSubmitTextAnswer={handleSubmitTextAnswer}
          />
        )}

        {currentView === 'progress' && (
          <ProgressScreen
            sessions={sessions}
            memoryProfile={memoryProfile}
            onBack={() => setCurrentView('home')}
            onStartPractice={handleStartIeltsPractice}
          />
        )}
      </main>

      {/* Sliding Coach Card (Triggered after each answer) */}
      <CoachCard
        evaluation={currentEvaluation}
        isLoading={isEvaluating}
        onNextQuestion={handleNextQuestion}
        partName={currentPart.toUpperCase()}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeySaved={(key) => {
          setUserApiKey(key);
          setGlobalError(null);
        }}
        canDismiss={Boolean(userApiKey)}
      />

      {/* Mock Test & Session Summary Modal */}
      <MockTestSummaryModal
        session={completedSession}
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        onViewProgress={() => setCurrentView('progress')}
      />

      {/* Android & APK Install Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
