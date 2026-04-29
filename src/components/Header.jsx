import React from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal, Github, Menu, X, Sun, Moon, Monitor,
} from 'lucide-react';
import { useSidebar } from '../utils/sidebar';
import { useTheme } from '../utils/theme';
import EmailMenu from './EmailMenu';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const next = theme === 'auto' ? 'light' : theme === 'light' ? 'dark' : 'auto';
  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
  const label = theme === 'dark' ? '다크' : theme === 'light' ? '라이트' : '시스템';
  return (
    <button
      type="button"
      className="header-theme-toggle"
      onClick={() => setTheme(next)}
      aria-label={`테마: ${label} (클릭해서 전환)`}
      title={`테마: ${label}`}
    >
      <Icon size={16} />
    </button>
  );
};

const Header = () => {
  const { open, toggle } = useSidebar();
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <button
            type="button"
            className="header-hamburger"
            onClick={toggle}
            aria-label={open ? '사이드바 닫기' : '사이드바 열기'}
            aria-expanded={open}
            aria-controls="primary-sidebar"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link to="/" className="logo">
            <Terminal size={22} color="var(--primary)" />
            <span>PenGejeen&apos;s Blog</span>
          </Link>
        </div>
        <nav className="nav-links" aria-label="외부 링크">
          <ThemeToggle />
          <span className="nav-divider" aria-hidden="true" />
          <a
            href="https://github.com/pengejeen"
            target="_blank"
            rel="noreferrer"
            className="nav-link"
            title="GitHub"
            aria-label="GitHub"
          >
            <Github size={18} />
          </a>
          <EmailMenu variant="icon" />
        </nav>
      </div>
    </header>
  );
};

export default Header;
