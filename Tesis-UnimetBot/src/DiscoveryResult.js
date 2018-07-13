import React from 'react';
import './DiscoveryResult.css';

function DiscoveryResult(props) {

  return (
    <div className="result">
      <div className="result__title">{props.title}</div>
      <div className="result__preview">{props.preview}</div>
    </div>
  );
}

export default DiscoveryResult;