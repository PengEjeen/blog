import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Server, MonitorPlay, Activity, Cpu, Database, CloudRain, Brain, Folder,
  Plane, Wrench, Clock, Hash,
} from 'lucide-react';
import { getPostsIndex, humanize } from '../utils/posts';
import { useSidebar } from '../utils/sidebar';
import SidebarSearch from './SidebarSearch';

const CATEGORY_ICONS = {
  CS: Cpu,
  BE: Server,
  FE: MonitorPlay,
  ML: Brain,
  AI: Brain,
  MLAI: Brain,
  Database: Database,
  DevOps: Activity,
  Cloud: CloudRain,
  Tools: Wrench,
  Travel: Plane,
  기타: Folder,
};

const CATEGORY_LABELS = {
  BE: 'Backend',
  FE: 'Frontend',
  ML: 'Machine Learning',
  AI: 'AI',
  MLAI: 'ML / AI',
};

const Sidebar = () => {
  const location = useLocation();
  const { open, close } = useSidebar();
  const { categories, posts, total } = useMemo(() => getPostsIndex(), []);
  const recents = posts.slice(0, 5);

  const decodedPath = decodeURIComponent(location.pathname);
  const activeCategory = decodedPath.startsWith('/category/')
    ? decodedPath.split('/')[2]
    : null;

  return (
    <>
      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="사이드바 닫기"
          onClick={close}
        />
      )}

      <aside
        id="primary-sidebar"
        className={`sidebar${open ? ' sidebar--open' : ''}`}
        aria-label="사이트 내비게이션"
      >
        <SidebarSearch />

        <div className="sidebar-section">
          <div className="sidebar-stats">
            <div className="sidebar-stat">
              <span className="sidebar-stat-value">{total}</span>
              <span className="sidebar-stat-label">posts</span>
            </div>
            <div className="sidebar-stat">
              <span className="sidebar-stat-value">{categories.length}</span>
              <span className="sidebar-stat-label">categories</span>
            </div>
          </div>
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">
            <Hash size={13} /> Categories
          </h3>
          <ul className="sidebar-list">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.slug] || Folder;
              const label = CATEGORY_LABELS[cat.slug] || humanize(cat.slug);
              const isActive = activeCategory === cat.slug;
              return (
                <li key={cat.slug}>
                  <Link
                    to={`/category/${encodeURIComponent(cat.slug)}`}
                    className={`sidebar-link${isActive ? ' sidebar-link--active' : ''}`}
                  >
                    <span className="sidebar-link-icon"><Icon size={15} strokeWidth={1.6} /></span>
                    <span className="sidebar-link-label">{label}</span>
                    <span className="sidebar-link-count">{cat.count}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {recents.length > 0 && (
          <div className="sidebar-section">
            <h3 className="sidebar-heading">
              <Clock size={13} /> Recent Posts
            </h3>
            <ul className="sidebar-recent-list">
              {recents.map((p) => (
                <li key={`${p.cat}/${p.sub}/${p.slug}`}>
                  <Link
                    to={`/category/${encodeURIComponent(p.cat)}/${encodeURIComponent(p.sub)}/${encodeURIComponent(p.slug)}`}
                    className="sidebar-recent-item"
                  >
                    <span className="sidebar-recent-title">{p.title}</span>
                    <span className="sidebar-recent-meta">
                      {humanize(p.cat)} · {p.dateLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
