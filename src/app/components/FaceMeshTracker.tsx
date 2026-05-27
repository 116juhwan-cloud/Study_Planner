import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X, Volume2, VolumeX, Eye, Play, Pause, Activity, Smile, UserCheck, AlertTriangle } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import confetti from "canvas-confetti";

interface FaceMeshTrackerProps {
  onClose: () => void;
}

export function FaceMeshTracker({ onClose }: FaceMeshTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(true);
  const [focusState, setFocusState] = useState<"perfect" | "distracted" | "sleepy" | "absent">("absent");
  const [focusScore, setFocusScore] = useState(100);
  const [focusHistory, setFocusHistory] = useState<{ time: string; score: number }[]>([]);
  
  // Timer States
  const [focusTime, setFocusTime] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);
  
  // Sound controls
  const [isMuted, setIsMuted] = useState(false);
  const drowsinessCounterRef = useRef(0);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // MediaPipe References
  const cameraRef = useRef<any>(null);
  const faceMeshRef = useRef<any>(null);

  // 1. Web Audio API alarm synthesizer
  const triggerAlarm = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime); // High urgent frequency
      osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.error("Web Audio API not supported or blocked by browser policy.", e);
    }
  };

  // 2. Play synthesized "Focus Alert" sound
  const triggerDistractionAlert = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Gentle alert
      osc.frequency.setValueAtTime(660, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  // Distance calculator for EAR & Gaze
  const getDistance = (p1: any, p2: any) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z || 0;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  // 3. Initialize Focus History Chart Data
  useEffect(() => {
    const initialData = Array.from({ length: 15 }, (_, i) => ({
      time: `${i}s`,
      score: 100,
    }));
    setFocusHistory(initialData);
  }, []);

  // 4. Update timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && focusState !== "absent") {
      interval = setInterval(() => {
        setFocusTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, focusState]);

  // 5. Update focus scores chart periodically
  useEffect(() => {
    const chartInterval = setInterval(() => {
      let currentScore = 100;
      if (focusState === "perfect") currentScore = 100 - Math.random() * 5;
      else if (focusState === "distracted") currentScore = 40 + Math.random() * 20;
      else if (focusState === "sleepy") currentScore = 10 + Math.random() * 15;
      else currentScore = 0;

      setFocusScore(Math.round(currentScore));
      
      setFocusHistory((prev) => {
        const next = [...prev.slice(1), { time: "", score: Math.round(currentScore) }];
        return next;
      });
    }, 2000);

    return () => clearInterval(chartInterval);
  }, [focusState]);

  // 6. MediaPipe Integration
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    // Check if CDN scripts loaded
    const FaceMeshClass = (window as any).FaceMesh;
    const CameraClass = (window as any).Camera;

    if (!FaceMeshClass || !CameraClass) {
      setModelError("MediaPipe 라이브러리가 로드되지 않았습니다. CDN 연결을 확인해 주세요.");
      return;
    }

    try {
      const faceMesh = new FaceMeshClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      // Canvas dimensions
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d")!;

      faceMesh.onResults((results: any) => {
        setIsModelLoaded(true);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw webcam preview inside overlay canvas to align landmarks
        if (results.image) {
          ctx.save();
          ctx.scale(-1, 1); // Flip horizontally for mirror effect
          ctx.drawImage(results.image, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();
        }

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];

          // Drowsiness Detection (EAR: Eye Aspect Ratio)
          const leftEAR = getDistance(landmarks[159], landmarks[145]) / getDistance(landmarks[33], landmarks[133]);
          const rightEAR = getDistance(landmarks[386], landmarks[374]) / getDistance(landmarks[362], landmarks[263]);
          const avgEAR = (leftEAR + rightEAR) / 2;

          // Face Orientation Tracking (Ratio of center-nose to outer edge of face)
          // 4 = nose tip, 234 = left face bound, 454 = right face bound
          const noseToLeft = getDistance(landmarks[4], landmarks[234]);
          const noseToRight = getDistance(landmarks[4], landmarks[454]);
          const faceRatio = noseToLeft / noseToRight;

          let currentState: "perfect" | "distracted" | "sleepy" | "absent" = "perfect";

          // Threshold check
          if (avgEAR < 0.21) {
            drowsinessCounterRef.current += 1;
            if (drowsinessCounterRef.current > 15) { // ~1.5 seconds at 10-15 fps
              currentState = "sleepy";
              triggerAlarm();
            }
          } else {
            drowsinessCounterRef.current = 0;
            // Gaze check (Looking away horizontally)
            if (faceRatio < 0.55 || faceRatio > 1.85) {
              currentState = "distracted";
              // Triggers light alert
              if (Math.random() < 0.05) triggerDistractionAlert();
            } else {
              currentState = "perfect";
            }
          }

          setFocusState(currentState);

          // 7. RENDERFuturistic Glowing 3D Mesh
          ctx.fillStyle = "rgba(0, 245, 255, 0.85)"; // Glowing Cyan
          ctx.strokeStyle = "rgba(180, 0, 255, 0.4)"; // Neon Purple
          ctx.lineWidth = 1;

          // Helper to draw connection contours
          const drawPath = (indices: number[], closePath = false) => {
            ctx.beginPath();
            indices.forEach((idx, i) => {
              const lm = landmarks[idx];
              // Mirror coordinates to match mirrored canvas preview
              const x = (1 - lm.x) * canvas.width;
              const y = lm.y * canvas.height;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            if (closePath) ctx.closePath();
            ctx.stroke();
          };

          // Draw neon structure lines
          drawPath([33, 160, 158, 133, 153, 144], true); // Left Eye
          drawPath([362, 385, 387, 263, 373, 380], true); // Right Eye
          drawPath([78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191], true); // Lips
          drawPath([10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109], true); // Silhouette

          // Render high-tech dotted tracking points
          for (let i = 0; i < landmarks.length; i += 5) {
            const lm = landmarks[i];
            const x = (1 - lm.x) * canvas.width;
            const y = lm.y * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
            ctx.fill();
          }

          // Special center forehead highlight
          const centerF = landmarks[10];
          ctx.fillStyle = "rgba(255, 0, 128, 0.9)";
          ctx.beginPath();
          ctx.arc((1 - centerF.x) * canvas.width, centerF.y * canvas.height, 4, 0, 2 * Math.PI);
          ctx.fill();

        } else {
          setFocusState("absent");
        }
      });

      // Initialize Camera utilities
      const videoElement = videoRef.current;
      const camera = new CameraClass(videoElement, {
        onFrame: async () => {
          if (isTracking && videoElement) {
            await faceMesh.send({ image: videoElement });
          }
        },
        width: 480,
        height: 360,
      });

      faceMeshRef.current = faceMesh;
      cameraRef.current = camera;
      camera.start();

    } catch (e) {
      console.error(e);
      setModelError("카메라를 시작하거나 MediaPipe 모델을 로드하는 도중 오류가 발생했습니다. 권한을 확인해주세요.");
    }

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
    };
  }, [isTracking]);

  // 8. Confetti Reward upon closing/finishing focus mode
  const handleFinishSession = () => {
    if (focusTime > 15) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#a855f7", "#ec4899", "#10b981", "#fbbf24"],
      });
    }
    onClose();
  };

  const getStatusDetails = () => {
    switch (focusState) {
      case "perfect":
        return {
          label: "초집중 학습 중",
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          icon: <UserCheck className="w-5 h-5 animate-pulse" />,
        };
      case "distracted":
        return {
          label: "주의 산만 감지",
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20 animate-bounce",
          icon: <AlertTriangle className="w-5 h-5" />,
        };
      case "sleepy":
        return {
          label: "졸음 경보 작동!",
          color: "text-rose-500 bg-rose-500/20 border-rose-500/30 animate-pulse border-2 shadow-lg shadow-rose-500/20",
          icon: <AlertTriangle className="w-5 h-5 animate-bounce" />,
        };
      default:
        return {
          label: "자리 비움 / 분석 중",
          color: "text-slate-400 bg-slate-100/10 border-slate-200/10",
          icon: <Smile className="w-5 h-5" />,
        };
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const status = getStatusDetails();

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 right-0 h-screen w-full sm:w-[400px] z-50 bg-background/80 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col p-6 overflow-y-auto"
    >
      {/* Alert Overlay for Sleepiness */}
      {focusState === "sleepy" && (
        <div className="absolute inset-0 bg-rose-500/15 border-2 border-rose-500/50 pointer-events-none z-50 animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            AI Focus Coach
          </h2>
        </div>
        <button
          onClick={handleFinishSession}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Camera Live Feed & Mesh Container */}
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-primary/20 bg-slate-950/90 shadow-xl mb-5 group">
        
        {/* Hidden video element for MediaPipe stream */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          muted
        />

        {/* Dynamic canvas overlay displaying WebCam and Neon 3D Mesh */}
        <canvas
          ref={canvasRef}
          width={480}
          height={360}
          className="w-full h-full object-cover transform scale-x-1"
        />

        {/* Loading Spinner */}
        {!isModelLoaded && !modelError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/90 text-white p-4 text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-300 font-medium">
              인공지능 분석 모델을 로드하고 있습니다...
            </p>
            <span className="text-xs text-slate-500">카메라 권한을 확인해주세요.</span>
          </div>
        )}

        {/* Error Alert */}
        {modelError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 text-rose-400 p-6 text-center">
            <AlertTriangle className="w-8 h-8 animate-bounce text-rose-500" />
            <p className="text-sm font-semibold">{modelError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-full border border-rose-500/30 transition-all text-xs"
            >
              새로고침
            </button>
          </div>
        )}

        {/* Hover info overlay */}
        {isModelLoaded && (
          <div className="absolute top-3 left-3 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] text-cyan-400 font-mono tracking-wider">
            FACE MESH ACTIVE • FPS 15
          </div>
        )}
      </div>

      {/* Status Panel */}
      <div className="space-y-4 flex-1">
        {/* State Badge */}
        <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${status.color}`}>
          <div className="flex items-center gap-3">
            {status.icon}
            <div>
              <p className="text-xs opacity-75">학습 집중 상태</p>
              <h3 className="font-bold text-sm tracking-tight">{status.label}</h3>
            </div>
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 hover:bg-black/5 rounded-full transition-all"
            title={isMuted ? "음소거 해제" : "음소거"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Timer Box */}
        <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-850/50 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-5 text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
          <p className="text-xs text-muted-foreground mb-1 font-medium">총 집중 학습 시간</p>
          <h1 className="text-3xl font-bold font-mono tracking-wider bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-4">
            {formatTimer(focusTime)}
          </h1>
          
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setIsTimerActive(!isTimerActive)}
              className="p-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg transition-all"
            >
              {isTimerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsTracking(!isTracking)}
              className={`px-4 py-2 border rounded-full text-xs font-semibold shadow-sm transition-all ${
                isTracking
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20"
                  : "bg-slate-200/50 border-slate-300/50 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              {isTracking ? "카메라 켜짐" : "카메라 정지"}
            </button>
          </div>
        </div>

        {/* Real-time Focus Score Gauge & Recharts Chart */}
        <div className="bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-850/50 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-muted-foreground">집중 지수 실시간 추이</span>
            </div>
            <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full dark:bg-purple-950/30 dark:text-purple-400">
              {focusScore}%
            </span>
          </div>

          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusHistory} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFocus)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Decorative Brand footer */}
      <div className="mt-6 border-t border-border pt-4 text-center">
        <p className="text-[10px] text-muted-foreground font-mono">
          STUDY PLANNER AI • POWERED BY MEDIAPIPE
        </p>
      </div>
    </motion.div>
  );
}
