export default function RevealHeadline({ children, className = "" }) {
  const text = String(children);
  const words = text.split(" ");

  return (
    <span className={`reveal-headline ${className}`} aria-label={text}>
      {words.map((word, wordIndex) => (
        <span
          className="reveal-word"
          key={`${word}-${wordIndex}`}
          aria-hidden="true"
        >
          {Array.from(word).map((letter, letterIndex) => (
            <span
              className="reveal-letter"
              key={`${letter}-${letterIndex}`}
              style={{
                animationDelay: `${wordIndex * 90 + letterIndex * 28}ms`,
              }}
            >
              {letter}
            </span>
          ))}
          {wordIndex < words.length - 1 && (
            <span className="reveal-space">&nbsp;</span>
          )}
        </span>
      ))}
    </span>
  );
}
