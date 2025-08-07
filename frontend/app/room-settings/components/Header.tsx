import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-500 to-blue-400 text-white py-6 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold">会場管理</h1>
      </div>
    </header>
  );
}; 