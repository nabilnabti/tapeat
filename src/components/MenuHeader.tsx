import React from 'react';
import { ChevronLeft, Search } from 'lucide-react';

export default function MenuHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold">Le Bistrot Parisien</h1>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un plat..."
            className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>
    </header>
  );
}