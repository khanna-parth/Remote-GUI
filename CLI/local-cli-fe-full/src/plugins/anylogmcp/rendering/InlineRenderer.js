import React, { useEffect, useState, useRef } from 'react'

const InlineRenderer = ({ rawHTML, rawHTMLUrl, style }) => {
  const [renderData, setRenderData] = useState('');
  if (!rawHTML && !rawHTMLUrl) {
    throw new Error('Either rawHTML or rawHTMLUrl must be provided');
  }

  if (rawHTML && rawHTMLUrl) {
    throw new Error('Both rawHTML and rawHTMLUrl cannot be provided');
  }
  
  useEffect(() => {
    if (rawHTML) {
      setRenderData(rawHTML)
      console.log(`Rendering HTML`);
    } else {
      setRenderData(rawHTMLUrl)
      console.log(`Rendering HTML URL`);
    }

  }, [rawHTML, rawHTMLUrl])

  return (
    <div>
      {renderData.length === 0 ? (
        <h1>No render data</h1>
      ) : rawHTML ? (
        <iframe
          style={{ border: "none", ...style }}
          sandbox="allow-scripts allow-same-origin"
          title="dynamic-html"
          srcDoc={renderData}
        />
      ) : (
        <iframe
          style={{ border: "none", ...style }}
          sandbox="allow-scripts allow-same-origin"
          title="dynamic-html"
          src={renderData}
        />
      )}
    </div>
  );

}

export default InlineRenderer;