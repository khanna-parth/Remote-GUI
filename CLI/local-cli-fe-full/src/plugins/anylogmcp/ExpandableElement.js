import { useState } from "react";
import { RiArrowRightBoxLine, RiArrowRightLine } from "react-icons/ri";

const ExpandableElement = ({ title, innerElement }) => {
    const [showElement, setShowElement] = useState(true);
    return (
        <div>
            <button onClick={ () => {setShowElement(!showElement); console.log(`Toggled element`) }} style={{ display: 'flex', flexDirection: 'row', border: '1px solid gray', borderRadius: 8, background: 'none', color: 'black', paddingLeft: 4, paddingRight: 4, paddingTop: 1, paddingBottom: 1, width: '100%', height: '10%', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{fontSize: '14px'}}>{title}</h1>
                {
                    showElement ? (
                        <RiArrowRightLine size={30} style={{ transform: showElement ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                    ) : (
                        <RiArrowRightLine size={30} />
                    )
                }
            </button>
            <div style={{ paddingTop: 6, paddingBottom: 6 }}>
                {innerElement && showElement && innerElement}
            </div>
        </div>
    )
}

export default ExpandableElement;