import React from 'react';

interface RichNarrativeProps {
  text: string;
}

/**
 * Renders narrative paragraphs with **bold** and *italic* Markdown syntax
 * styled for optimal dark-mode literary reading (measure 65-75ch, 1.65 line height).
 */
export const RichNarrative: React.FC<RichNarrativeProps> = ({ text }) => {
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);

  const renderFormattedInline = (paragraph: string) => {
    // Match **bold** or *italic*
    const tokens = paragraph.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return tokens.map((token, idx) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        return (
          <strong key={idx} className="font-semibold text-amber-100">
            {token.slice(2, -2)}
          </strong>
        );
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        return (
          <em key={idx} className="italic text-slate-200 font-display">
            {token.slice(1, -1)}
          </em>
        );
      }
      return <React.Fragment key={idx}>{token}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-5 text-[16px] leading-[1.72] text-slate-200 max-w-[70ch]">
      {paragraphs.map((p, index) => (
        <p key={index} className="tracking-[0.01em]">
          {renderFormattedInline(p)}
        </p>
      ))}
    </div>
  );
};
