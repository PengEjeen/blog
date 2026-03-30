import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Server, MonitorPlay, Activity, Cpu, Database, CloudRain, Brain,
} from 'lucide-react';

/* ─ Bento Cards ──────────────────────────────────────────────────────── */
const CATEGORIES = [
  { slug: 'CS', label: 'CS', desc: '알고리즘 · 네트워크 · 자료구조', icon: Cpu, size: 'big' },
  { slug: 'BE', label: 'Backend', desc: 'API 설계와 서버 개발', icon: Server, size: 'normal' },
  { slug: 'FE', label: 'Frontend', desc: '웹 UI 개발', icon: MonitorPlay, size: 'normal' },
  { slug: 'MLAI', label: 'ML / AI', desc: '머신러닝 · 딥러닝 · AI 모델', icon: Brain, size: 'big' },
  { slug: 'Database', label: 'Database', desc: 'SQL · NoSQL · 데이터 설계', icon: Database, size: 'normal' },
  { slug: 'DevOps', label: 'DevOps', desc: 'CI/CD · 인프라 · 배포 자동화', icon: Activity, size: 'normal' },
  { slug: 'Cloud', label: 'Cloud', desc: 'AWS · GCP · 클라우드 아키텍처', icon: CloudRain, size: 'normal' },
];

/* ─ FIDS: Airport Departure Board ───────────────────────────────────── */
const FLIGHTS = [
  { destination: 'Seoul → Jeju', code: 'PJ 0401', time: '09:25', status: 'DEPARTED', gate: 'B3' },
  { destination: 'Seoul → Tokyo', code: 'PJ 1109', time: '11:00', status: 'ON TIME', gate: 'A7' },
  { destination: 'Seoul → Barcelona', code: 'PJ 2203', time: '14:40', status: 'BOARDING', gate: 'C12' },
  { destination: 'Seoul → New York', code: 'PJ 0077', time: '18:55', status: 'ON TIME', gate: 'D2' },
  { destination: 'Seoul → London', code: 'PJ 3301', time: '22:10', status: 'SCHEDULED', gate: 'E9' },
];

const STATUS_CLASS = {
  DEPARTED: 'fids-status--grey',
  'ON TIME': 'fids-status--green',
  BOARDING: 'fids-status--amber',
  SCHEDULED: 'fids-status--blue',
};

const FIDSBoard = () => {
  const [tick, setTick] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setTick(t => !t), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <Link to="/category/Travel" className="fids-link">
      <div className="fids-board">
        {/* Header */}
        <div className="fids-header">
          <span className="fids-header-left">
            <span className="fids-dot" style={{ opacity: tick ? 1 : 0.3 }} />
            DEPARTURES
          </span>
          <span className="fids-header-right">✈ Travel 기록</span>
        </div>

        {/* Column Headers */}
        <div className="fids-col-header">
          <span>DESTINATION</span>
          <span>FLIGHT</span>
          <span>TIME</span>
          <span>GATE</span>
          <span>STATUS</span>
        </div>

        {/* Rows */}
        {FLIGHTS.map((f, i) => (
          <div key={i} className={`fids-row${i === 2 ? ' fids-row--active' : ''}`}>
            <span className="fids-dest">{f.destination}</span>
            <span className="fids-code">{f.code}</span>
            <span className="fids-time">{f.time}</span>
            <span className="fids-gate">{f.gate}</span>
            <span className={`fids-status ${STATUS_CLASS[f.status] ?? ''}`}>{f.status}</span>
          </div>
        ))}
      </div>
    </Link>
  );
};

/* ─ Home Page ────────────────────────────────────────────────────────── */
const Home = () => (
  <div className="home-container">
    {/* Hero */}
    <div className="bento-hero">
      <div className="bento-hero-text">
        <p className="bento-hero-eyebrow">조남영 · PengEJeen</p>
        <h1 className="bento-hero-title">놀땐놀고,<br />공부할땐 공부하자.</h1>
      </div>
      <div className="bento-hero-meta">
        <p className="bento-hero-desc">
          개발 공부 중 배운 것들을 정리하고<br />
          경험을 아카이빙하는 개인 블로그입니다.<br />
          (현재 notion 이전공사중...)<br />
          https://friendly-seaplane-a4d.notion.site/Tech-1ae31c6367a38076b55af14913b99826
        </p>
      </div>
    </div>

    {/* Category Bento Grid — dev content first */}
    <div className="bento-grid">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <Link
            key={cat.slug}
            to={`/category/${encodeURIComponent(cat.slug)}`}
            className={`bento-card${cat.size === 'big' ? ' bento-card--big' : ''}`}
          >
            <div className="bento-card-top">
              <span className="bento-card-icon"><Icon size={20} strokeWidth={1.5} /></span>
              <span className="bento-card-label">{cat.label}</span>
            </div>
            <p className="bento-card-desc">{cat.desc}</p>
            <span className="bento-card-arrow">→</span>
          </Link>
        );
      })}
    </div>

    {/* Travel — separate from dev content */}
    <div className="travel-section">
      <FIDSBoard />
    </div>
  </div>
);

export default Home;