import { useState } from "react";
import { RiArrowRightLine } from "react-icons/ri";

const ExpandableElement = ({ title, headerElement, innerElement }) => {
    const [showElement, setShowElement] = useState(true);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            
            <button 
                onClick={() => {
                    setShowElement(!showElement);
                    console.log(`Toggled element`);
                }} 
                style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    border: '1px solid gray', 
                    borderRadius: 8, 
                    background: 'none', 
                    color: 'black', 
                    padding: '4px 12px',
                    width: '100%', 
                    cursor: 'pointer',
                    gap: '12px'
                }}
            >

                <span style={{ 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    flexGrow: 1, 
                    textAlign: 'left' 
                }}>
                    {title}
                </span>

                {headerElement && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {headerElement}
                    </div>
                )}

                <RiArrowRightLine 
                    size={24} 
                    style={{ 
                        transition: 'transform 0.2s',
                        transform: showElement ? 'rotate(90deg)' : 'rotate(0deg)',
                        flexShrink: 0
                    }} 
                />
            </button>

            {showElement && innerElement && (
                <div style={{ padding: '8px 4px' }}>
                    {innerElement}
                </div>
            )}
        </div>
    );
}

export default ExpandableElement;