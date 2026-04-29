import React from 'react';
import { Github, Rss } from 'lucide-react';
import EmailMenu from './EmailMenu';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <p className="footer-copy">
        © {new Date().getFullYear()} PenGejeen — 놀땐놀고, 공부할땐 공부하자.
      </p>
      <div className="footer-links">
        <a
          className="footer-link"
          href="https://github.com/pengejeen"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
        >
          <Github size={15} />
          GitHub
        </a>
        <EmailMenu variant="footer" />
        <a
          className="footer-link"
          href="/rss.xml"
          aria-label="RSS"
        >
          <Rss size={15} />
          RSS
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
