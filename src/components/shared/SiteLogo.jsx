import React from 'react';
import { Link } from 'react-router-dom';

export default function SiteLogo({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center shrink-0 ${className}`}>
      <img
        src="https://media.base44.com/images/public/69c3f3171ffea17f779ab7ec/7f0d63852_logo1.png"
        alt="Open Minds Studios"
        style={{ height: '52px', width: 'auto', maxHeight: '52px' }}
        className="transition-transform duration-200 hover:scale-105 object-contain"
      />
    </Link>
  );
}