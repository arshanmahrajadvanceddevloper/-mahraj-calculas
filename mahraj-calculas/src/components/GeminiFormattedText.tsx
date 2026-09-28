import React, { useState } from 'react';
import { Copy, Check, Code2, Sparkles, Terminal, BookOpen, CheckCircle2 } from 'lucide-react';

interface GeminiFormattedTextProps {
  content: string;
  isUser?: boolean;
}

export function GeminiFormattedText({ content, isUser = false }: GeminiFormattedTextProps) {
  if (isUser) {
    return <div className="whitespace-pre-wrap font-sans text-black font-semibold text-xs leading-relaxed">{content}</div>;
  }

  // Pre-process and clean unnecessary raw symbols ($$, stray asterisks)
  const cleanedContent = preprocessContent(content);
  const blocks = parseBlocks(cleanedContent);

  return (
    <div className="space-y-2.5 text-xs leading-relaxed font-sans text-zinc-200">
      {blocks.map((block, idx) => (
        <BlockRenderer key={idx} block={block} />
      ))}
    </div>
  );
}

// Clean stray LaTeX dollar signs from plain numbers or words like "$5$", "$$100$$", "$x$"
function preprocessContent(text: string): string {
  if (!text) return '';

  return text
    // Replace $$formula$$ on dedicated lines or clean lone $$ signs around numbers
    .replace(/\$\$\s*([\d\w\s+\-*\/=<>^().]+?)\s*\$\$/g, '$1')
    .replace(/\$\s*([\d\w\s+\-*\/=<>^().]+?)\s*\$/g, '$1')
    // Remove isolated single $ before numbers like $ 50 -> 50
    .replace(/\$\s*(\d+)/g, '$1')
    // Remove dangling empty asterisks or dollar signs
    .replace(/\*{4,}/g, '**')
    .trim();
}

interface Block {
  type: 'paragraph' | 'heading' | 'code' | 'formula' | 'bullet_list' | 'numbered_list' | 'callout' | 'final_answer';
  level?: number;
  language?: string;
  content?: string;
  items?: string[];
}

function parseBlocks(rawText: string): Block[] {
  const lines = rawText.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Code Blocks (```lang ... ```)
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || 'code';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++; // skip closing ```
      }
      blocks.push({
        type: 'code',
        language,
        content: codeLines.join('\n')
      });
      continue;
    }

    // 2. Final Answer Highlight / Result Card
    if (/^(Final Answer|Answer|Result|Conclusion):/i.test(trimmed)) {
      blocks.push({
        type: 'final_answer',
        content: trimmed
      });
      i++;
      continue;
    }

    // 3. Headings (#, ##, ###, ####)
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2]
      });
      i++;
      continue;
    }

    // 4. Blockquotes / Callouts (> text)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({
        type: 'callout',
        content: quoteLines.join(' ')
      });
      continue;
    }

    // 5. Numbered Lists (1. , 2. )
    const numMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numMatch) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const itemMatch = lines[i].trim().match(/^(\d+)[\.\)]\s+(.+)$/);
        if (itemMatch) {
          listItems.push(itemMatch[2]);
          i++;
        } else if (lines[i].trim().startsWith('   ') || lines[i].trim().startsWith('\t')) {
          // continuation line
          if (listItems.length > 0) {
            listItems[listItems.length - 1] += ' ' + lines[i].trim();
          }
          i++;
        } else {
          break;
        }
      }
      blocks.push({
        type: 'numbered_list',
        items: listItems
      });
      continue;
    }

    // 6. Bullet Lists (- , * , • )
    if (/^[\-\*•]\s+/.test(trimmed)) {
      const bulletItems: string[] = [];
      while (i < lines.length) {
        const currentTrim = lines[i].trim();
        if (/^[\-\*•]\s+/.test(currentTrim)) {
          bulletItems.push(currentTrim.replace(/^[\-\*•]\s+/, ''));
          i++;
        } else if (currentTrim.startsWith('  ') && bulletItems.length > 0) {
          bulletItems[bulletItems.length - 1] += ' ' + currentTrim;
          i++;
        } else {
          break;
        }
      }
      blocks.push({
        type: 'bullet_list',
        items: bulletItems
      });
      continue;
    }

    // 7. Regular Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !/^[\-\*•]\s+/.test(lines[i].trim()) &&
      !/^\d+[\.\)]\s+/.test(lines[i].trim()) &&
      !/^(Final Answer|Answer|Result):/i.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        content: paraLines.join('\n')
      });
    }
  }

  return blocks;
}

function BlockRenderer({ block }: { block: Block }) {
  if (block.type === 'code') {
    return <CodeBlock language={block.language || 'code'} code={block.content || ''} />;
  }

  if (block.type === 'heading') {
    if (block.level === 1 || block.level === 2) {
      return (
        <div className="pt-2 pb-1 border-b border-zinc-800/80">
          <h3 className="text-sm font-bold bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300 bg-clip-text text-transparent flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-400 shrink-0" />
            <span><InlineFormattedText text={block.content || ''} /></span>
          </h3>
        </div>
      );
    }
    return (
      <h4 className="text-xs font-bold text-cyan-300 tracking-wide mt-2 mb-0.5 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
        <span><InlineFormattedText text={block.content || ''} /></span>
      </h4>
    );
  }

  if (block.type === 'final_answer') {
    return (
      <div className="p-3 my-2 rounded-xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-zinc-900 border border-emerald-500/40 shadow-sm flex items-start gap-2.5">
        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-emerald-200 font-medium leading-relaxed">
          <InlineFormattedText text={block.content || ''} />
        </div>
      </div>
    );
  }

  if (block.type === 'callout') {
    return (
      <div className="border-l-2 border-cyan-400 bg-cyan-950/20 pl-3 py-1.5 pr-2 rounded-r-xl my-1.5 text-zinc-300 text-[11px] italic leading-relaxed">
        <InlineFormattedText text={block.content || ''} />
      </div>
    );
  }

  if (block.type === 'bullet_list' && block.items) {
    return (
      <ul className="space-y-1.5 my-1 pl-1">
        {block.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-zinc-200">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            <div className="flex-1 min-w-0">
              <InlineFormattedText text={item} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (block.type === 'numbered_list' && block.items) {
    return (
      <ol className="space-y-2 my-1 pl-0.5">
        {block.items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-zinc-200">
            <span className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0 pt-0.5">
              <InlineFormattedText text={item} />
            </div>
          </li>
        ))}
      </ol>
    );
  }

  // Paragraph
  return (
    <p className="text-zinc-200 leading-relaxed">
      <InlineFormattedText text={block.content || ''} />
    </p>
  );
}

// Inline Formatter for Bold, Inline Code, Formulas, Step Badges, and Clean Math
function InlineFormattedText({ text }: { text: string }) {
  if (!text) return null;

  // Split by code `code`, bold **bold**, math signs
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|Step\s+\d+:|Q\d+:|Solution:|Formula:)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-seg-${partIndex++}`}>
          {text.substring(lastIndex, match.index)}
        </span>
      );
    }

    const matchedStr = match[0];
    const key = `match-elem-${partIndex++}-${match.index}`;

    // 1. Inline Code `code`
    if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      const code = matchedStr.slice(1, -1);
      parts.push(
        <code 
          key={key} 
          className="bg-zinc-800/90 text-cyan-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-zinc-700/60 font-semibold mx-0.5"
        >
          {code}
        </code>
      );
    }
    // 2. Bold **text**
    else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      const boldText = matchedStr.slice(2, -2).trim();
      // Check if it's a step or keyword
      if (/^(Step \d+|Q\d+|Answer|Formula|Solution|Theorem|Important)/i.test(boldText)) {
        parts.push(
          <span 
            key={key} 
            className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 text-[11px]"
          >
            {boldText}
          </span>
        );
      } else {
        parts.push(
          <strong key={key} className="font-bold text-white">
            {boldText}
          </strong>
        );
      }
    }
    // 3. Italic *text*
    else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      const italicText = matchedStr.slice(1, -1);
      parts.push(
        <em key={key} className="text-zinc-300 italic font-medium">
          {italicText}
        </em>
      );
    }
    // 4. Step badges like "Step 1:", "Q1:", "Solution:"
    else if (/^(Step\s+\d+:|Q\d+:|Solution:|Formula:)/i.test(matchedStr)) {
      parts.push(
        <span 
          key={key} 
          className="inline-flex items-center px-2 py-0.5 mx-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[11px]"
        >
          {matchedStr}
        </span>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-tail-${partIndex++}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }

  return <>{parts}</>;
}

// Gemini Studio Code Block with Language Badge & 1-Click Copy
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-zinc-800 bg-[#08090d] shadow-lg">
      {/* Code Header Bar */}
      <div className="px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Terminal size={12} className="text-cyan-400" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300">
            {language || 'CODE'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="h-6 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-medium flex items-center gap-1 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-3.5 overflow-x-auto custom-scrollbar font-mono text-[11px] leading-relaxed text-emerald-300 selection:bg-emerald-500/30">
        <pre className="whitespace-pre">{code}</pre>
      </div>
    </div>
  );
}
