"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Send,
  Sparkles,
  User,
  ShieldAlert,
  Code2,
  Trash2,
  Settings,
  XCircle,
  Play,
  RotateCcw,
  CheckCircle,
  Lock,
  PhoneOff
} from "lucide-react";

interface ChatMessage {
  sender: "HR" | "Candidate";
  text: string;
}

export default function LiveInterviewWorkspace() {
  const { id } = useParams();
  const { user, apiFetch, loading } = useAuth();
  const router = useRouter();

  // Role details
  const [role, setRole] = useState<"Candidate" | "HR">("Candidate");
  const [sessionTopic, setSessionTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");

  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  // Media controls
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Collaboration State
  const [code, setCode] = useState("def solve():\n    # Implement solution\n    pass");
  const [chatList, setChatList] = useState<ChatMessage[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  
  // HR Scorecard inputs (HR only)
  const [techScore, setTechScore] = useState(7.0);
  const [commScore, setCommScore] = useState(7.0);
  const [confScore, setConfScore] = useState(7.0);
  const [compScore, setCompScore] = useState(7.0);
  const [hrNotes, setHrNotes] = useState("");
  
  // Real-time AI Assistant cues (HR only)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    "Review candidate's Python skills in lists and immutable tuples.",
    "Observe confidence and behavioral answers under the STAR structure."
  ]);

  const [savingSession, setSavingSession] = useState(false);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // 1. Fetch Session details and configure roles
  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionData = await apiFetch(`/interviews/sessions/${id}`);
        setSessionTopic(sessionData.topic);
        setDifficulty(sessionData.difficulty);

        // Define role: If current user id matches session owner, they are candidate.
        // Otherwise, they are HR interviewer.
        if (sessionData.user_id === user?.id) {
          setRole("Candidate");
        } else {
          setRole("HR");
        }

        // Initialize WebSockets and Media Streams
        startCollaboration();
      } catch (err: any) {
        setError("Failed to fetch session: " + err.message);
      }
    };

    if (user) {
      initSession();
    }

    return () => {
      // Cleanup
      if (wsRef.current) wsRef.current.close();
      if (pcRef.current) pcRef.current.close();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [id, user]);

  // 2. Start WebSocket & WebRTC
  const startCollaboration = async () => {
    try {
      // Request microphone and camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebSockets
      const wsUrl = `ws://localhost:8000/ws/live/${id}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus("Room active");
        // Trigger Peer connection exchange once socket is open
        initWebRTC(ws, stream);
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        if (msg.type === "code") {
          setCode(msg.code);
        } else if (msg.type === "chat") {
          setChatList((prev) => [...prev, { sender: msg.role, text: msg.text }]);
        } else if (msg.type === "signal") {
          // WebRTC Signaling SDP / ICE candidates
          handleSignalingMessage(msg.signal);
        } else if (msg.type === "scores" && role === "Candidate") {
          // Candidates can see HR grading updates in real-time if desired
          // Optional sync
        }
      };

      ws.onclose = () => {
        setConnectionStatus("Disconnected");
      };

      ws.onerror = () => {
        setConnectionStatus("Connection Error");
      };
    } catch (err: any) {
      setError("Camera/Mic access required for live interviews: " + err.message);
      setConnectionStatus("Media Access Blocked");
    }
  };

  // 3. WebRTC Setup
  const initWebRTC = (ws: WebSocket, stream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }] // Free Google STUN server
    });
    pcRef.current = pc;

    // Add local tracks to peer connection
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Send local ICE candidates to remote peer
    pc.onicecandidate = (event) => {
      if (event.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "signal",
          signal: { type: "candidate", candidate: event.candidate }
        }));
      }
    };

    // Render remote media track
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Candidate initiates WebRTC Offer
    pc.onnegotiationneeded = async () => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(JSON.stringify({
            type: "signal",
            signal: { type: "offer", sdp: offer.sdp }
          }));
        }
      } catch (err) {
        console.error("WebRTC Negotiation offer error: ", err);
      }
    };
  };

  const handleSignalingMessage = async (signal: any) => {
    const pc = pcRef.current;
    if (!pc) return;

    try {
      if (signal.type === "offer") {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: signal.sdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "signal",
            signal: { type: "answer", sdp: answer.sdp }
          }));
        }
      } else if (signal.type === "answer") {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: signal.sdp }));
      } else if (signal.type === "candidate") {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      }
    } catch (err) {
      console.error("Signaling error: ", err);
    }
  };

  // 4. Input Sync Helpers
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "code", code: newCode }));
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const chatPayload = {
      type: "chat",
      role: role,
      text: chatMessage
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(chatPayload));
      setChatList((prev) => [...prev, { sender: role, text: chatMessage }]);
      setChatMessage("");
    }
  };

  // 5. Media Control Actions
  const toggleMic = () => {
    if (localStream) {
      const active = !micActive;
      localStream.getAudioTracks().forEach((track) => (track.enabled = active));
      setMicActive(active);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const active = !videoActive;
      localStream.getVideoTracks().forEach((track) => (track.enabled = active));
      setVideoActive(active);
    }
  };

  const toggleScreenShare = async () => {
    const pc = pcRef.current;
    if (!pc) return;

    try {
      if (isScreenSharing) {
        // Stop sharing
        if (screenTrackRef.current) {
          screenTrackRef.current.stop();
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender && localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            sender.replaceTrack(videoTrack);
          }
          setIsScreenSharing(false);
          screenTrackRef.current = null;
        }
      } else {
        // Start screen share
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack);
        }

        screenTrack.onended = () => {
          toggleScreenShare(); // stop sharing when user clicks "Stop Sharing" bubble
        };

        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error("Screen sharing failed: ", err);
    }
  };

  // 6. Complete live interview scoring
  const handleSaveScoring = async () => {
    setSavingSession(true);
    try {
      // In production, we call standard complete endpoint or pass private evaluation
      await apiFetch(`/interviews/sessions/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score_technical: techScore,
          score_communication: commScore,
          score_confidence: confScore,
          score_completeness: compScore,
          feedback: hrNotes || "Evaluation completed by live HR panel.",
          status: "completed"
        })
      });
      router.push(`/interview/${id}/report`);
    } catch (err: any) {
      alert("Failed to submit score evaluations: " + err.message);
    } finally {
      setSavingSession(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 flex flex-col gap-6 flex-1 h-[88vh]">
      
      {/* WORKSPACE HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-4">
        <div>
          <span className={`rounded px-2.5 py-0.5 text-xs font-bold border ${
            role === "HR" ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-primary/10 border-primary/20 text-primary"
          }`}>
            Live Interview Room ({role})
          </span>
          <h1 className="text-2xl font-bold mt-1 tracking-tight">{sessionTopic} ({difficulty})</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-muted">{connectionStatus}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <XCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 items-stretch overflow-hidden">
        
        {/* VIDEOCONFERENCING & CHAT PANEL (Left 1/4) */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* VIDEO FEEDS */}
          <div className="space-y-3">
            {/* Remote Feed */}
            <div className="relative rounded-xl border border-border bg-zinc-950 aspect-video overflow-hidden shadow-inner flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                <User className="h-3 w-3" />
                {role === "HR" ? "Candidate Video" : "Interviewer (HR)"}
              </div>
              {!remoteStream && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted font-bold font-mono">
                  Awaiting remote feed...
                </div>
              )}
            </div>

            {/* Local Feed */}
            <div className="relative rounded-xl border border-border bg-zinc-950 aspect-video overflow-hidden shadow-inner flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-1">
                <User className="h-3 w-3" />
                You ({role})
              </div>
            </div>
          </div>

          {/* MEDIA SWITCH PANEL */}
          <div className="flex justify-center gap-3 border-b border-border/40 pb-4">
            <button
              onClick={toggleMic}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                micActive ? "bg-background border-border hover:bg-secondary text-foreground" : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}
              title={micActive ? "Mute Mic" : "Unmute Mic"}
            >
              {micActive ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={toggleVideo}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                videoActive ? "bg-background border-border hover:bg-secondary text-foreground" : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}
              title={videoActive ? "Stop Camera" : "Start Camera"}
            >
              {videoActive ? <Video className="h-4.5 w-4.5" /> : <VideoOff className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={toggleScreenShare}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                isScreenSharing ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-background border-border hover:bg-secondary text-foreground"
              }`}
              title="Share Screen"
            >
              <Monitor className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* CHAT MESSAGES */}
          <div className="flex-1 flex flex-col justify-between border border-border rounded-xl bg-card p-4 overflow-hidden min-h-[220px]">
            <div className="overflow-y-auto space-y-2 pr-1 max-h-[160px] text-xs">
              {chatList.map((chat, idx) => (
                <div key={idx} className={`rounded p-2 max-w-[85%] leading-relaxed ${
                  chat.sender === role
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-secondary text-foreground mr-auto"
                }`}>
                  <span className="font-bold block text-[8px] uppercase tracking-wide opacity-80">{chat.sender}</span>
                  {chat.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendChat} className="flex gap-2 border-t border-border/40 pt-3 mt-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Send message..."
                className="flex-1 rounded border border-input bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="rounded bg-primary text-primary-foreground p-1.5 hover:bg-primary/95 cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

        </div>

        {/* LIVE COLLABORATIVE EDITOR (Center 2/4) */}
        <div className="lg:col-span-2 flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm min-h-[450px]">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <div className="flex items-center gap-2 font-mono text-sm font-semibold">
                <Code2 className="h-4.5 w-4.5 text-primary" />
                <span>collaborative_sandbox.py</span>
              </div>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold px-2 py-0.5">
                Real-Time Sync Active
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="flex-1 w-full rounded-lg border border-input bg-zinc-950 text-zinc-50 p-4 font-mono text-sm focus:border-primary focus:outline-none placeholder:text-muted h-[400px] resize-none"
              spellCheck={false}
            />
          </div>
        </div>

        {/* SIDEBAR PANEL (HR Grading Sliders or Candidate helper) (Right 1/4) */}
        <div className="lg:col-span-1 flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm overflow-y-auto">
          
          {role === "HR" ? (
            /* HR EVALUATION DASHBOARD */
            <div className="space-y-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold border-b border-border/40 pb-2 flex items-center gap-1.5 text-red-500 uppercase tracking-wider">
                  <ShieldAlert className="h-4.5 w-4.5" /> Live HR Evaluation
                </h3>
                
                {/* Sliders */}
                <div className="space-y-4 mt-4 text-xs font-semibold">
                  <div>
                    <div className="flex justify-between">
                      <span>Technical Accuracy</span>
                      <span className="text-primary">{techScore}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={techScore}
                      onChange={(e) => setTechScore(parseFloat(e.target.value))}
                      className="w-full mt-1.5 accent-primary"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>Communication</span>
                      <span className="text-primary">{commScore}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={commScore}
                      onChange={(e) => setCommScore(parseFloat(e.target.value))}
                      className="w-full mt-1.5 accent-primary"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>Confidence</span>
                      <span className="text-primary">{confScore}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={confScore}
                      onChange={(e) => setConfScore(parseFloat(e.target.value))}
                      className="w-full mt-1.5 accent-primary"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>Completeness</span>
                      <span className="text-primary">{compScore}/10</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={compScore}
                      onChange={(e) => setCompScore(parseFloat(e.target.value))}
                      className="w-full mt-1.5 accent-primary"
                    />
                  </div>
                </div>

                {/* Notes Input */}
                <div className="mt-6">
                  <label className="text-xs font-bold text-muted block mb-1">Private Evaluation Notes</label>
                  <textarea
                    rows={3}
                    value={hrNotes}
                    onChange={(e) => setHrNotes(e.target.value)}
                    placeholder="Type candidate strengths, weaknesses, and final review feedback..."
                    className="w-full rounded border border-input bg-background p-2.5 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Suggestions Panel */}
              <div className="border-t border-border/40 pt-4 mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" /> AI Helper Cues
                </h4>
                <div className="space-y-2 text-[11px] leading-relaxed text-muted">
                  {aiSuggestions.map((s, idx) => (
                    <div key={idx} className="bg-primary/5 border border-primary/10 rounded p-2">
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="border-t border-border/40 pt-4 mt-6">
                <button
                  onClick={handleSaveScoring}
                  disabled={savingSession}
                  className="w-full flex items-center justify-center gap-2 rounded bg-red-500 py-2.5 text-xs font-bold text-white hover:bg-red-600 shadow-md shadow-red-500/10 cursor-pointer disabled:opacity-50"
                >
                  <PhoneOff className="h-4 w-4" />
                  {savingSession ? "Submitting score..." : "Submit Grades & End Call"}
                </button>
              </div>
            </div>
          ) : (
            /* CANDIDATE INSTRUCTIONS & MOCK CUES */
            <div className="space-y-5 flex-grow flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold border-b border-border/40 pb-2 flex items-center gap-1.5 text-primary uppercase tracking-wider">
                  <User className="h-4.5 w-4.5" /> Candidate Console
                </h3>
                <div className="mt-4 text-xs space-y-4 leading-relaxed text-muted">
                  <p>You are now connected to a live HR Interview. Please communicate clearly, and present your code using the collaborative editor.</p>
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 flex gap-2">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Double-check your microphone settings. You can toggle mute on the webcam grid at any time.</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/40 pt-4 text-xs font-bold text-muted flex gap-2 items-center justify-center">
                <Lock className="h-4 w-4" />
                <span>End-to-End P2P Secure Call</span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
