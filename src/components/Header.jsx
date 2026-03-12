import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Github, Mail } from 'lucide-react';

const Header = () => (
  <header className="header">
    <div className="header-content">
      <Link to="/" className="logo">
        <Terminal size={22} color="#3b82f6" />
        <span>PenGejeen's Blog</span>
      </Link>
      <nav className="nav-links">
        <a href="#" className="nav-link">About</a>
        <a href="#" className="nav-link">Projects</a>
        <span className="nav-divider" />
        <a href="https://github.com/pengejeen" target="_blank" rel="noreferrer" className="nav-link" title="GitHub">
          <Github size={18} />
        </a>
        <a href="mailto:example@email.com" className="nav-link" title="Email">
          <Mail size={18} />
        </a>
      </nav>
    </div>
  </header>
);

export default Header;
