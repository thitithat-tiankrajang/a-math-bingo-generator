import React from 'react';

export default function EmptyState() {
  return (
    <div className="text-white text-center py-12">
    <div className="mb-4">
      <div className="inline-flex items-center justify-center p-2 bg-gradient-to-br from-green-800 via-green-700 to-green-600 rounded-xl border border-green-500/30 shadow-md">
        <div className="p-2 bg-green-800/95 backdrop-blur-sm rounded-lg shadow-inner border border-green-600/40">
          <img src="/logoDasc.png" alt="DASC Logo" className="w-32 h-32 mx-auto rounded-md shadow-sm border border-green-400" />
        </div>
      </div>
    </div>
    <h3 className="text-xl font-semibold mb-2 text-white">
      Start generating DS Bingo problems
    </h3>
    <p className="mb-4 text-green-100">
      Press &quot;Generate Problem&quot; to begin
    </p>
    <div className="bg-green-800/50 p-4 rounded-lg border border-green-600 max-w-md mx-auto">
      <p className="text-sm text-green-100 font-medium">DS Bingo</p>
      <p className="text-xs text-green-200 mt-1">
        Is a set of numbers and operators that can be arranged into at
        least one valid equation according to mathematical rules.
      </p>
    </div>
  </div>
  );
}
