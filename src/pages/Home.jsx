import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, 
  MonitorPlay, 
  Briefcase, 
  CloudRain, 
  Database, 
  Activity, 
  Cpu, 
  Wrench 
} from 'lucide-react';

const categories = [
  { name: 'BE', icon: Server, color: '#3b82f6', posts: 12 },
  { name: 'FE', icon: MonitorPlay, color: '#10b981', posts: 15 },
  { name: 'CS', icon: Cpu, color: '#8b5cf6', posts: 8 },
  { name: 'Cloud', icon: CloudRain, color: '#0ea5e9', posts: 5 },
  { name: 'Database', icon: Database, color: '#f59e0b', posts: 10 },
  { name: 'DevOps', icon: Activity, color: '#ef4444', posts: 7 },
  { name: 'Career', icon: Briefcase, color: '#eab308', posts: 4 },
  { name: 'Tools', icon: Wrench, color: '#64748b', posts: 6 },
];

const Home = () => {
  return (
    <div className="home-container">
      <section className="hero">
        <h1>Welcome to PenGejeen's Blog</h1>
        <p>A place where I share my thoughts, learnings, and experiences in software engineering.</p>
      </section>

      <section>
        <div className="categories-grid">
          {categories.map((cat, index) => {
            const IconComponent = cat.icon;
            return (
              <Link 
                to={`/category/${cat.name}`} 
                key={cat.name} 
                className="category-card"
              >
                <IconComponent className="category-icon" style={{ color: cat.color }} />
                <h3 className="category-name">{cat.name}</h3>
                <span className="category-count">{cat.posts} Posts</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;
