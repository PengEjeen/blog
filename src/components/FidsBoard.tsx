import { useEffect, useState } from 'react';

interface Props {
  travelHref: string;
}

const FLIGHTS = [
  { destination: 'Seoul → Jeju', code: 'PJ 0401', time: '09:25', status: 'DEPARTED', gate: 'B3' },
  { destination: 'Seoul → Tokyo', code: 'PJ 1109', time: '11:00', status: 'ON TIME', gate: 'A7' },
  { destination: 'Seoul → Barcelona', code: 'PJ 2203', time: '14:40', status: 'BOARDING', gate: 'C12' },
  { destination: 'Seoul → New York', code: 'PJ 0077', time: '18:55', status: 'ON TIME', gate: 'D2' },
  { destination: 'Seoul → London', code: 'PJ 3301', time: '22:10', status: 'SCHEDULED', gate: 'E9' },
];

const STATUS_CLASS: Record<string, string> = {
  DEPARTED: 'fids-status--grey',
  'ON TIME': 'fids-status--green',
  BOARDING: 'fids-status--amber',
  SCHEDULED: 'fids-status--blue',
};

const FidsBoard = ({ travelHref }: Props) => {
  const [tick, setTick] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => !t), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <a href={travelHref} className="fids-link">
      <div className="fids-board">
        <div className="fids-header">
          <span className="fids-header-left">
            <span className="fids-dot" style={{ opacity: tick ? 1 : 0.3 }} />
            DEPARTURES
          </span>
          <span className="fids-header-right">✈ Travel 기록</span>
        </div>

        <div className="fids-col-header">
          <span>DESTINATION</span>
          <span>FLIGHT</span>
          <span>TIME</span>
          <span>GATE</span>
          <span>STATUS</span>
        </div>

        {FLIGHTS.map((f, i) => (
          <div key={f.code} className={`fids-row${i === 2 ? ' fids-row--active' : ''}`}>
            <span className="fids-dest">{f.destination}</span>
            <span className="fids-code">{f.code}</span>
            <span className="fids-time">{f.time}</span>
            <span className="fids-gate">{f.gate}</span>
            <span className={`fids-status ${STATUS_CLASS[f.status] ?? ''}`}>{f.status}</span>
          </div>
        ))}
      </div>
    </a>
  );
};

export default FidsBoard;
