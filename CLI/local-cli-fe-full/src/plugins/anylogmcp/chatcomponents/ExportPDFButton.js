import React from 'react';
import { IoDownloadOutline } from 'react-icons/io5';

const ExportButton = ({ onClick, disabled = false, hint }) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
        }}>
            <IoDownloadOutline
                style={{
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                    margin: 0
                }}
                size={24}
                onClick={disabled ? undefined : onClick}
            />
            <span style={{
                fontSize: 10,
                margin: 0
            }}>{hint}</span>
        </div>
    );
}

export default ExportButton;