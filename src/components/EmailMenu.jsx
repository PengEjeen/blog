import React, { useEffect, useRef, useState } from 'react';
import { Mail, Send, Copy, Check } from 'lucide-react';

const ADDRESS = 'chony5093@gmail.com';
const GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${ADDRESS}`;

const EmailMenu = ({ variant = 'icon' }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const Trigger = variant === 'icon' ? (
    <button
      ref={triggerRef}
      type="button"
      className="nav-link email-menu-trigger"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-haspopup="menu"
      title={`Email (${ADDRESS})`}
      aria-label="Email 메뉴 열기"
    >
      <Mail size={18} />
    </button>
  ) : (
    <button
      ref={triggerRef}
      type="button"
      className="footer-link email-menu-trigger"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-label="Email 메뉴 열기"
    >
      <Mail size={15} />
      Email
    </button>
  );

  return (
    <span className="email-menu" ref={wrapRef}>
      {Trigger}
      {open && (
        <div className={`email-menu-popup email-menu-popup--${variant}`} role="menu">
          <a
            href={GMAIL_URL}
            target="_blank"
            rel="noreferrer"
            className="email-menu-item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Send size={14} />
            <span className="email-menu-item-label">Gmail로 작성</span>
          </a>
          <button
            type="button"
            className="email-menu-item"
            role="menuitem"
            onClick={handleCopy}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span className="email-menu-item-label">{copied ? '복사됨' : '주소 복사'}</span>
            <span className="email-menu-item-hint">{ADDRESS}</span>
          </button>
        </div>
      )}
    </span>
  );
};

export default EmailMenu;
