import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  X,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [copiedGit, setCopiedGit] = useState(false);
  const appUrl = window.location.origin;

  useEffect(() => {
    // Detect standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleDownloadZip = async () => {
    setDownloadState('downloading');
    try {
      const res = await fetch('/ai-ielts-speaking-coach.zip');
      if (!res.ok) throw new Error('Download request failed');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'ai-ielts-speaking-coach.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      setDownloadState('success');
      setTimeout(() => setDownloadState('idle'), 4000);
    } catch (err) {
      console.warn('Blob download fallback:', err);
      // Fallback
      window.location.href = '/ai-ielts-speaking-coach.zip';
      setDownloadState('idle');
    }
  };

  const handleCopyGitCommands = () => {
    const text = `git init\ngit add .\ngit commit -m "Deploy AI IELTS Speaking Coach"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/ai-ielts-speaking-coach.git\ngit push -u origin main`;
    navigator.clipboard.writeText(text);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2500);
  };

  if (!isOpen) return null;

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    }
  };

  const pwabuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-zinc-100 flex flex-col space-y-5 overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Android App & APK</h3>
              <p className="text-xs text-zinc-400">মোবাইলে নেটিভ অ্যাপের মতো ইনস্টল করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/80 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Method 1: Instant Direct Install (PWA) */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>পদ্ধতি ১: সরাসরি ১-ক্লিকে ইনস্টল (PWA)</span>
            </span>
            <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
              সবচেয়ে সহজ
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-['Noto_Sans_Bengali',sans-serif]">
            কোনো আলাদা APK ফাইল ডাউনলোড বা ইনস্টলেশন পারমিশন ছাড়াই আপনার ফোনে সরাসরি অ্যাপ হিসেবে ইনস্টল হবে। হোমস্ক্রিনে গোল্ডেন আইকন তৈরি হবে এবং ফুলস্ক্রিনে চলবে।
          </p>

          {deferredPrompt ? (
            <button
              onClick={handleInstallPWA}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4" />
              <span>মোবাইলে এখনই Install করুন</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-['Noto_Sans_Bengali',sans-serif] space-y-1.5">
              <p className="font-semibold text-amber-300">ক্রোম ব্রাউজারে থাকলে:</p>
              <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px]">
                <li>ব্রাউজারের উপরে ডানপাশের <strong>তিনটি ডট (⋮)</strong> মেনুতে চাপ দিন।</li>
                <li><strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong>-এ ট্যাপ করুন।</li>
                <li>ব্যস! আপনার ফোনের হোম স্ক্রিনে অ্যাপটি ইনস্টল হয়ে যাবে।</li>
              </ol>
            </div>
          )}
        </div>

        {/* Method 2: Generate Signed APK via PWABuilder */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>পদ্ধতি ২: অফিসিয়াল APK ফাইল তৈরি করুন</span>
            </span>
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
              PWABuilder
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-['Noto_Sans_Bengali',sans-serif]">
            মাইক্রোসফটের অফিশিয়াল <strong>PWABuilder</strong> দিয়ে আমাদের লাইভ ইউআরএল থেকে সরাসরি সাইনড <strong>.apk</strong> ফাইল জেনারেট করে ডাউনলোড করতে পারবেন:
          </p>

          <a
            href={pwabuilderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
          >
            <span>PWABuilder-এ APK প্যাকেজ তৈরি করুন</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="text-[11px] text-zinc-400 font-mono break-all p-2 bg-zinc-900 rounded-lg">
            URL: {appUrl}
          </div>
        </div>

        {/* Method 3: Direct Download Source Code Zip for GitHub */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span>পদ্ধতি ৩: সম্পূর্ণ প্রজেক্ট জিপ (.zip) ডাউনলোড</span>
            </span>
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full font-bold">
              GitHub Ready
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed font-['Noto_Sans_Bengali',sans-serif]">
            সমস্ত সোর্স কোড, GitHub Actions (APK Auto-build & Pages Deploy) এবং ফাইল সরাসরি ১-ক্লিকে ডাউনলোড করুন:
          </p>

          <button
            onClick={handleDownloadZip}
            disabled={downloadState === 'downloading'}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98"
          >
            {downloadState === 'downloading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>ডাউনলোড তৈরি হচ্ছে...</span>
              </>
            ) : downloadState === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>সফলভাবে ডাউনলোড শুরু হয়েছে!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>সরাসরি ZIP ডাউনলোড করুন (ai-ielts-speaking-coach.zip)</span>
              </>
            )}
          </button>

          {/* GitHub Quick Copy Commands */}
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 font-semibold font-['Noto_Sans_Bengali',sans-serif]">GitHub কমান্ড:</span>
              <button
                onClick={handleCopyGitCommands}
                className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-medium transition"
              >
                {copiedGit ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedGit ? 'কপি হয়েছে!' : 'কমান্ড কপি করুন'}</span>
              </button>
            </div>
            <pre className="text-[10px] font-mono text-zinc-400 overflow-x-auto whitespace-pre p-1.5 bg-black/60 rounded">
git init && git add . && git commit -m "Deploy AI IELTS Coach"
            </pre>
          </div>

          <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
            <span>বিকল্প লিঙ্ক:</span>
            <a
              href="/ai-ielts-speaking-coach.zip"
              download="ai-ielts-speaking-coach.zip"
              className="text-amber-400 hover:underline"
            >
              সরাসরি ফাইল লিঙ্ক
            </a>
          </div>
        </div>

        {/* Direct Link Share */}
        <div className="p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px]">নিরাপদ ও সরাসরি গুগল ক্লাউডে হোস্ট করা</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
