'use client';

import React from 'react';
import Link from 'next/link';

interface FormattedContentProps {
  content: string;
  className?: string;
}

/**
 * Renders formatted post content with support for:
 * - **bold** text
 * - *italic* text
 * - `code` inline
 * - @mentions (clickable links)
 * - [color:red]colored text[/color]
 * - URLs (auto-linked)
 * - Line breaks
 */
export function FormattedContent({ content, className = '' }: FormattedContentProps) {
  if (!content) return null;

  const renderFormattedText = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Check for color tags: [color:red], [color:#22c55e], [color: #hex] (optional space)
      const colorMatch = remaining.match(/^\[color:\s*([a-zA-Z]+|#[0-9a-fA-F]{3,8})\]([\s\S]*?)\[\/color\]/i);
      if (colorMatch) {
        const [fullMatch, color, innerText] = colorMatch;
        const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(color) || /^[a-zA-Z]+$/.test(color) ? color : '#000';
        elements.push(
          <span key={key++} style={{ color: safeColor }}>
            {renderFormattedText(innerText)}
          </span>
        );
        remaining = remaining.slice(fullMatch.length);
        continue;
      }

      // Check for bold: [b]text[/b] (BBCode style)
      const bbBoldMatch = remaining.match(/^\[b\]([\s\S]*?)\[\/b\]/i);
      if (bbBoldMatch) {
        const [fullMatch, innerText] = bbBoldMatch;
        elements.push(
          <strong key={key++} className="font-bold">
            {renderFormattedText(innerText)}
          </strong>
        );
        remaining = remaining.slice(fullMatch.length);
        continue;
      }

      // Check for bold: **text**
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        const [fullMatch, innerText] = boldMatch;
        elements.push(
          <strong key={key++} className="font-bold">
            {renderFormattedText(innerText)}
          </strong>
        );
        remaining = remaining.slice(fullMatch.length);
        continue;
      }

      // Check for italic: *text* (but not **)
      const italicMatch = remaining.match(/^\*([^*]+?)\*/);
      if (italicMatch) {
        const [fullMatch, innerText] = italicMatch;
        elements.push(
          <em key={key++} className="italic">
            {renderFormattedText(innerText)}
          </em>
        );
        remaining = remaining.slice(fullMatch.length);
        continue;
      }

      // Check for inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+?)`/);
      if (codeMatch) {
        const [fullMatch, innerText] = codeMatch;
        elements.push(
          <code 
            key={key++} 
            className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-neutral-800 text-pink-600 dark:text-pink-400 font-mono text-sm"
          >
            {innerText}
          </code>
        );
        remaining = remaining.slice(fullMatch.length);
        continue;
      }

      // Check for mentions: @username
      const mentionMatch = remaining.match(/^@([a-zA-Z0-9_]+)/);
      if (mentionMatch) {
        const [fullMatch, username] = mentionMatch;
        elements.push(
          <Link 
            key={key++}
            href={`/profile/${username}`}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            @{username}
          </Link>
        );
        remaining = remaining.slice(fullMatch.length);
        continue;
      }

      // Check for URLs
      const urlMatch = remaining.match(/^(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const [fullMatch] = urlMatch;
        elements.push(
          <a 
            key={key++}
            href={fullMatch}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {fullMatch}
          </a>
        );
        remaining = remaining.slice(fullMatch.length);
        continue;
      }

      // Check for line breaks
      if (remaining.startsWith('\n')) {
        elements.push(<br key={key++} />);
        remaining = remaining.slice(1);
        continue;
      }

      // Find next special character or take the rest
      const nextSpecialIndex = remaining.search(/[\*`@\[\n]|https?:\/\//);
      if (nextSpecialIndex === -1) {
        // No more special chars, add rest as plain text
        elements.push(<span key={key++}>{remaining}</span>);
        break;
      } else if (nextSpecialIndex === 0) {
        // Special char at start but didn't match pattern - add single char
        elements.push(<span key={key++}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      } else {
        // Add text before special char
        elements.push(<span key={key++}>{remaining.slice(0, nextSpecialIndex)}</span>);
        remaining = remaining.slice(nextSpecialIndex);
      }
    }

    return elements;
  };

  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {renderFormattedText(content)}
    </div>
  );
}

// Color presets for the color picker
export const COLOR_PRESETS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
];
