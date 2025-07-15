import React from 'react';

interface Column {
  header: string;
  accessor: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  className?: string;
}

const TableComponent: React.FC<TableProps> = ({ columns, data, className = '' }) => {
  return (
    <div className="table-responsive">
      <table className={`table ${className}`}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <td key={colIndex}>
                    {column.render 
                      ? column.render(row[column.accessor], row) 
                      : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center">
                Aucune donnée disponible
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <style jsx>{`
        .table-responsive {
          overflow-x: auto;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .table th, .table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .table th {
          background-color: #f8f9fa;
          font-weight: 600;
          text-align: left;
          color: #495057;
        }
        
        .table tr:hover {
          background-color: #f8f9fa;
        }
        
        .text-center {
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default TableComponent;