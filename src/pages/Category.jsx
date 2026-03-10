import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';

const Category = () => {
  const { name } = useParams();

  return (
    <div className="category-page">
      <div className="page-header">
        <Link to="/" className="back-btn">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <h1 className="category-title">{name}</h1>
      </div>

      <div className="empty-state">
        <BookOpen size={48} color="#6366f1" style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2>No posts in {name} yet</h2>
        <p>Looks like this category is currently empty. Posts belonging to the {name} directory will automatically appear here once added.</p>
      </div>
    </div>
  );
};

export default Category;
