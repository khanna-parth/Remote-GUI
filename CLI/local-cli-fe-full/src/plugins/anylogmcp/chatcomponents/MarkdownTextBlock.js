import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../styles/MarkdownTextBlock.css";

const MarkdownTextBlock = ({ text, extraStyles = {} }) => {
  return (
    <div
      className="markdown-text-block"
      style={extraStyles.fontSize ? { fontSize: extraStyles.fontSize } : undefined}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, children }) {
            return inline ? (
              <code
                className="markdown-text-block__inline-code"
                style={extraStyles.inlineCode}
              >
                {children}
              </code>
            ) : (
              <pre
                className="markdown-text-block__code-block"
                style={extraStyles.codeBlock}
              >
                <code>{children}</code>
              </pre>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownTextBlock;
