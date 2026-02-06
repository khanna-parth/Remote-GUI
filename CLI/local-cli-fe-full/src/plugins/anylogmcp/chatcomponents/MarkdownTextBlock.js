import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownTextBlock = ({ text, extraStyles = {} }) => {
  return (
    <div style={{ fontSize: extraStyles.fontSize || 12, ...extraStyles.container }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, children }) {
            return inline ? (
              <code
                style={{
                  ...styles.inlineCode,
                  ...extraStyles.inlineCode,
                }}
              >
                {children}
              </code>
            ) : (
              <pre
                style={{
                  ...styles.codeBlock,
                  ...extraStyles.codeBlock,
                }}
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

const styles = {
    inlineCode: {
        background: "rgba(0,0,0,0.1)",
        padding: "2px 4px",
        borderRadius: "4px",
        fontSize: "0.9em",
    },
    codeBlock: {
        background: "#1e1e1e",
        color: "#f8f8f2",
        padding: "10px",
        borderRadius: "8px",
        overflowX: "auto",
        fontSize: "13px",
        marginTop: "8px",
    }
}

export default MarkdownTextBlock;