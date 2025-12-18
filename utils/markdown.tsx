import React from 'react';

/**
 * Simple Markdown renderer for tooltip explanations
 * Converts **bold** and preserves line breaks
 */
export function renderMarkdown(text: string): React.ReactNode {
  const parts: (string | React.ReactNode)[] = [];
  let currentIndex = 0;
  
  // Match **bold** patterns
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  let lastIndex = 0;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // Add bold text
    parts.push(
      <strong key={`bold-${currentIndex}`} className="font-semibold">
        {match[1]}
      </strong>
    );
    
    lastIndex = match.index + match[0].length;
    currentIndex++;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return <>{parts}</>;
}

