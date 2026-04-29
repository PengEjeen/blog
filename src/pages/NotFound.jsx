import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home as HomeIcon } from 'lucide-react';
import { usePageTitle } from '../utils/usePageTitle';

const NotFound = () => {
  usePageTitle('404 — 페이지 없음');
  return (
    <div className="notfound">
      <Compass size={56} className="notfound-icon" strokeWidth={1.5} />
      <h1 className="notfound-code">404</h1>
      <p className="notfound-msg">길을 잃으셨네요. 이 경로엔 아무 것도 없어요.</p>
      <Link to="/" className="notfound-cta">
        <HomeIcon size={15} /> 홈으로
      </Link>
    </div>
  );
};

export default NotFound;
