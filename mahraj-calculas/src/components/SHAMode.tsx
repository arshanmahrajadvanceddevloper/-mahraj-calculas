import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import { Hash, Copy, Check, Key, FileText, Terminal, Info, RefreshCw, FileUp, Sparkles, ShieldCheck } from 'lucide-react';

export function SHAMode() {
  const [inputText, setInputText] = useState('');
  const [selectedAlgo, setSelectedAlgo] = useState<'SHA-256' | 'SHA-1' | 'SHA-512'>('SHA-256');
  const [outputFormat, setOutputFormat] = useState<'hex' | 'base64'>('hex');
  const [hashedOutput, setHashedOutput] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // File hashing state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState('');
  const [isFileHashing, setIsFileHashing] = useState(false);
  const [fileHashAlgo, setFileHashAlgo] = useState<'SHA-256' | 'SHA-1'>('SHA-256');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom key copy feedbacks
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Hash calculation logic for live string text
  useEffect(() => {
    const computeHash = async () => {
      if (!inputText) {
        setHashedOutput('');
        return;
      }
      setIsHashing(true);
      try {
        const msgBuffer = new TextEncoder().encode(inputText);
        const hashBuffer = await crypto.subtle.digest(selectedAlgo, msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));

        if (outputFormat === 'hex') {
          const hexString = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          setHashedOutput(hexString);
        } else {
          // base64 encoding
          const binaryString = String.fromCharCode(...hashArray);
          setHashedOutput(btoa(binaryString));
        }
      } catch (err) {
        setHashedOutput('Hashing error');
      } finally {
        setIsHashing(false);
      }
    };

    const timeoutId = setTimeout(computeHash, 150);
    return () => clearTimeout(timeoutId);
  }, [inputText, selectedAlgo, outputFormat]);

  // File Hashing handler
  const handleFileHash = async (file: File) => {
    setSelectedFile(file);
    setIsFileHashing(true);
    setFileHash('');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest(fileHashAlgo, arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hexString = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setFileHash(hexString);
    } catch (err) {
      setFileHash('Error computing file checksum');
    } finally {
      setIsFileHashing(false);
    }
  };

  useEffect(() => {
    if (selectedFile) {
      handleFileHash(selectedFile);
    }
  }, [fileHashAlgo]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileHash(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileHash(e.target.files[0]);
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  const handleCopyCommand = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFileHash('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Commands for the SHA helpers
  const commands = {
    macLinux: 'keytool -list -v -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android',
    windows: 'keytool -list -v -alias androiddebugkey -keystore %USERPROFILE%\\.android\\debug.keystore -storepass android',
    gradle: './gradlew signingReport'
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-1 pb-4 custom-scrollbar">
      
      {/* Intro Banner */}
      <div className="bg-zinc-950/40 rounded-2xl border border-zinc-800/60 p-4 shrink-0 flex items-start gap-3">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0 mt-0.5">
          <Key size={18} />
        </div>
        <div>
          <h3 className="text-zinc-200 font-bold text-sm">Security Fingerprints & SHA Keys</h3>
          <p className="text-xs text-zinc-400 leading-relaxed mt-1">
            Compute instantly standard cryptographic hashes, or access developer command lines to generate production and testing SHA-1/SHA-256 keys for Firebase/Google app registrations.
          </p>
        </div>
      </div>

      {/* Grid for Hashing and Commands */}
      <div className="space-y-4">
        
        {/* String Key generator */}
        <div className="bg-zinc-900/60 border border-indigo-500/15 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Hash size={14} /> String Hash Generator
            </span>
            <div className="flex items-center gap-3">
              <div className="bg-black/40 border border-zinc-800 rounded-lg p-0.5 flex gap-1 text-[10px]">
                {(['hex', 'base64'] as const).map(fmt => (
                  <button
                    key={'format-' + fmt}
                    onClick={() => setOutputFormat(fmt)}
                    className={`px-2 py-0.5 rounded capitalize transition-colors ${
                      outputFormat === fmt ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-zinc-500'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
              
              <div className="bg-black/40 border border-zinc-800 rounded-lg p-0.5 flex gap-1 text-[10px]">
                {(['SHA-256', 'SHA-1', 'SHA-512'] as const).map(algo => (
                  <button
                    key={'algo-' + algo}
                    onClick={() => setSelectedAlgo(algo)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      selectedAlgo === algo ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-zinc-500'
                    }`}
                  >
                    {algo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <textarea
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 placeholder:text-zinc-650 focus:border-indigo-500 focus:outline-none transition-colors custom-scrollbar"
              rows={3}
              placeholder="Enter text or string to register/hash (e.g., passwords, client certificates, credentials...)"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>

          {hashedOutput && (
            <div className="bg-black/70 border border-zinc-800/80 rounded-xl p-3 flex flex-col gap-2 relative overflow-hidden">
              <div className="flex justify-between items-center text-[10px] text-zinc-500">
                <span className="font-mono tracking-wide">{selectedAlgo} ({outputFormat.toUpperCase()}) Result:</span>
                <button
                  onClick={() => handleCopy(hashedOutput, 'string')}
                  className="flex items-center gap-1 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2 py-0.5 rounded transition-colors text-[10px]"
                >
                  {copiedText === 'string' ? (
                    <>
                      <Check size={10} className="text-emerald-400 font-bold" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={10} />
                      <span>Copy SHA Key</span>
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-xs text-zinc-300 break-all select-all leading-relaxed whitespace-pre-wrap">
                {hashedOutput}
              </div>
            </div>
          )}
        </div>

        {/* File Checksum Hasher Container */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} /> File Checksum Checker
            </span>
            <div className="bg-black/40 border border-zinc-800 rounded-lg p-0.5 flex gap-1 text-[10px]">
              {(['SHA-256', 'SHA-1'] as const).map(algo => (
                <button
                  key={'file-algo-' + algo}
                  onClick={() => setFileHashAlgo(algo)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    fileHashAlgo === algo ? 'bg-indigo-600/30 text-indigo-300 font-bold' : 'text-zinc-500'
                  }`}
                >
                  {algo}
                </button>
              ))}
            </div>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed transition-all p-5 flex flex-col items-center justify-center text-center gap-2 ${
              isDragOver 
                ? 'border-indigo-500 bg-indigo-500/5' 
                : selectedFile 
                  ? 'border-zinc-800 bg-black/10' 
                  : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/10'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile ? (
              <>
                <FileCheckIcon size={24} className="text-indigo-400" />
                <div className="text-xs text-zinc-300 font-medium truncate max-w-full px-4">
                  {selectedFile.name}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              </>
            ) : (
              <>
                <FileUp size={24} className="text-zinc-500" />
                <div className="text-xs text-zinc-400 font-medium">
                  Drag & Drop file or <span className="text-indigo-400 font-semibold underline">browse</span>
                </div>
                <div className="text-[9px] text-zinc-600 font-mono">
                  Computes secure SHA certificate integrity locally
                </div>
              </>
            )}
          </div>

          {selectedFile && (
            <div className="bg-black/60 border border-zinc-800/80 rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center text-[10px] text-zinc-500">
                <span className="font-mono">File Checksum Hash ({fileHashAlgo}):</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(fileHash, 'file')}
                    className="flex items-center gap-1 hover:text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px]"
                  >
                    {copiedText === 'file' ? (
                      <>
                        <Check size={10} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={10} />
                        <span>Copy Checksum</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearFile}
                    className="text-[10px] text-red-400 hover:text-red-300 hover:underline px-1"
                  >
                    Clear File
                  </button>
                </div>
              </div>
              <div className="font-mono text-xs text-zinc-300 break-all select-all leading-relaxed bg-zinc-950 p-2.5 rounded-lg border border-zinc-900/60">
                {isFileHashing ? (
                  <span className="text-zinc-500 italic flex items-center gap-1.5">
                    <RefreshCw size={10} className="animate-spin" /> Calculating hash...
                  </span>
                ) : (
                  fileHash || 'Calculating bytes...'
                )}
              </div>
            </div>
          )}
        </div>

        {/* Developer Keystore & Fingerprints Guides */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-start gap-1.5">
            <Terminal size={15} className="text-indigo-400 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Command Line SHA Key Grabber
              </span>
              <p className="text-[11px] text-zinc-400">
                Run this keytool code inside your machine's terminal window to extract your credential signatures.
              </p>
            </div>
          </div>

          {/* Android Debug keys block */}
          <div className="space-y-3">
            {[
              {
                title: 'macOS & Linux Terminal',
                desc: 'Generate SHA signatures for local debug keystore',
                shell: commands.macLinux,
                id: 'mac'
              },
              {
                title: 'Windows PowerShell / cmd',
                desc: 'Generate SHA signatures for local debug keystore',
                shell: commands.windows,
                id: 'win'
              },
              {
                title: 'Android Gradle Signings',
                desc: 'View all signature profiles directly in Android Studio Terminal',
                shell: commands.gradle,
                id: 'gradle'
              }
            ].map((cmd, idx) => (
              <div key={'cmd-' + idx} className="bg-black/50 border border-zinc-900/80 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs text-zinc-300 font-semibold">{cmd.title}</h4>
                    <span className="text-[10px] text-zinc-500 leading-snug">{cmd.desc}</span>
                  </div>
                  <button
                    onClick={() => handleCopyCommand(cmd.shell, cmd.id)}
                    className="flex items-center gap-1 hover:text-white bg-zinc-900 border border-zinc-800 px-2 py-0.7 rounded text-[10px]"
                  >
                    {copiedKey === cmd.id ? (
                      <>
                        <Check size={9} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied Command</span>
                      </>
                    ) : (
                      <>
                        <Copy size={9} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-zinc-950 px-2.5 py-2 rounded-lg border border-zinc-800/50 font-mono text-[11px] text-zinc-400 overflow-x-auto select-all whitespace-pre-wrap break-all pr-2">
                  {cmd.shell}
                </div>
              </div>
            ))}
          </div>

          {/* Configuration step info block */}
          <div className="bg-indigo-950/20 rounded-xl border border-indigo-500/10 p-3 flex gap-2">
            <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-[10px] text-zinc-400 leading-relaxed">
              <span className="font-semibold text-zinc-300">How to configure inside Firebase Console:</span>
              <ul className="list-decimal list-inside space-y-1 mt-1 font-sans">
                <li>Copy the generated <span className="text-indigo-300">SHA-1</span> or <span className="text-indigo-300">SHA-256</span> fingerprint block from your terminal output list.</li>
                <li>Go to <span className="font-semibold text-zinc-300">Firebase Console &gt; Project Settings &gt; General</span>.</li>
                <li>Scroll to <span className="font-semibold text-zinc-300">Your Apps</span> and choose your SDK target (e.g., Android or Web).</li>
                <li>Click <span className="font-semibold text-zinc-300 font-mono text-[9px] bg-zinc-800 px-1 py-0.5 rounded">Add Fingerprint</span> and paste the SHA credentials.</li>
              </ul>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

function FileCheckIcon({ size, className }: { size?: number, className?: string }) {
  return (
    <div className={`p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center ${className}`}>
      <ShieldCheck size={size || 20} className="text-emerald-400" />
    </div>
  );
}
