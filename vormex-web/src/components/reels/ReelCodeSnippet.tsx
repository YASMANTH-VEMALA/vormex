'use client';

import { useState } from 'react';
import { Copy, Check, FileCode } from 'lucide-react';

interface ReelCodeSnippetProps {
  code: string;
  language?: string | null;
  fileName?: string | null;
}

export function ReelCodeSnippet({ code, language, fileName }: ReelCodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getLanguageColor = (lang: string | null | undefined): string => {
    const colors: Record<string, string> = {
      javascript: 'text-yellow-400',
      typescript: 'text-blue-400',
      python: 'text-green-400',
      java: 'text-red-400',
      kotlin: 'text-purple-400',
      swift: 'text-orange-400',
      rust: 'text-orange-500',
      go: 'text-cyan-400',
      cpp: 'text-blue-500',
      c: 'text-blue-600',
      csharp: 'text-purple-500',
      ruby: 'text-red-500',
      php: 'text-indigo-400',
      html: 'text-orange-400',
      css: 'text-blue-400',
      sql: 'text-yellow-500',
      shell: 'text-green-500',
      bash: 'text-green-500',
    };
    return lang ? colors[lang.toLowerCase()] || 'text-gray-400' : 'text-gray-400';
  };

  return (
    <div className="bg-black/80 backdrop-blur-md rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileCode className={`w-4 h-4 ${getLanguageColor(language)}`} />
          {fileName && (
            <span className="text-white/70 text-sm font-mono">{fileName}</span>
          )}
          {language && !fileName && (
            <span className="text-white/70 text-sm">{language}</span>
          )}
        </div>
        
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-white/60 hover:text-white text-sm transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-white/90 whitespace-pre-wrap break-words">
          {code}
        </code>
      </pre>
    </div>
  );
}
