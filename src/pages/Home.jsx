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
  Wrench,
  Plane,
  Brain
} from 'lucide-react';

const Home = () => {
  return (
    <div className="home-container">
      <section className="arch-hero">
        <h1>System Architecture</h1>
        <p>Select a component to dive into its engineering details</p>
      </section>

      <div className="content-wrapper">
        <aside className="side-extras left-side">
          <Link to="/category/Travel" className="arch-node special-node travel-node">
            <Plane className="arch-icon" />
            <div className="arch-label">Travel</div>
          </Link>
        </aside>

        <section className="architecture-diagram">
          {/* Top Level: User / FE */}
          <div className="arch-layer">
            <Link to="/category/FE" className="arch-node fe-node">
              <MonitorPlay className="arch-icon" />
              <div className="arch-label">Frontend (FE)</div>
            </Link>
            <div className="arch-line vertical"></div>
          </div>

          {/* Middle Level: BE, DevOps, Tools */}
          <div className="arch-layer middle-layer">
            <Link to="/category/DevOps" className="arch-node devops-node side-node">
              <Activity className="arch-icon" />
              <div className="arch-label">DevOps</div>
            </Link>

            <div className="arch-line horizontal left-line"></div>

            <Link to="/category/BE" className="arch-node core-node">
              <Server className="arch-icon" />
              <div className="arch-label">Backend (BE)</div>
            </Link>

            <div className="arch-line horizontal right-line"></div>

            <Link to="/category/MLAI" className="arch-node mlai-node side-node">
              <Brain className="arch-icon" />
              <div className="arch-label">ML / AI</div>
            </Link>
          </div>

          {/* Bottom Level: DB, Cloud, CS */}
          <div className="arch-layer">
            <div className="arch-line vertical"></div>
            <div className="bottom-nodes">
              <Link to="/category/Database" className="arch-node db-node">
                <Database className="arch-icon" />
                <div className="arch-label">Database</div>
              </Link>
              <Link to="/category/Cloud" className="arch-node cloud-node">
                <CloudRain className="arch-icon" />
                <div className="arch-label">Cloud</div>
              </Link>
              <Link to="/category/CS" className="arch-node cs-node">
                <Cpu className="arch-icon" />
                <div className="arch-label">CS</div>
              </Link>
            </div>
          </div>
        </section>

        <aside className="side-extras right-side">
          {/* <Link to="/category/Career" className="arch-node special-node career-node">
            <Briefcase className="arch-icon" />
            <div className="arch-label">Career</div>
          </Link> */}
          {/* <Link to="/category/Tools" className="arch-node special-node tools-node" style={{ marginTop: '2rem' }}>
            <Wrench className="arch-icon" />
            <div className="arch-label">Tools</div>
          </Link> */}
        </aside>
      </div>
    </div>
  );
};

export default Home;
