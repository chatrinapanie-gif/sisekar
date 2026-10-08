import React from 'react';

export default function KuisionerCard({ item }) {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold text-lg text-gray-900">
        {item.aspek}
      </h3>

      {/* Render HTML string agar tag <b> berfungsi */}
      <p 
        className="text-gray-700 mt-2"
        dangerouslySetInnerHTML={{ __html: item.uraian }} 
      />
    </div>
  );
}
