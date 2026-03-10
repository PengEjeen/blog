import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Github, Twitter, Mail } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <Terminal size={28} color="#a855f7" />
          <span>PenGejeen's Blog</span>
        </Link>
        <nav className="nav-links">
          <a href="#" className="nav-link">About</a>
          <a href="#" className="nav-link">Projects</a>
          <div style={{ display: 'flex', gap: '1rem', marginLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '2rem' }}>
            <a href="#" className="nav-link"><Github size={20} /></a>
            <a href="#" className="nav-link"><Twitter size={20} /></a>
            <a href="#" className="nav-link"><Mail size={20} /></a>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
