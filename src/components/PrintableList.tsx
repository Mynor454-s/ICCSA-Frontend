import React from 'react';

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

interface PrintableListProps {
  title: string;
  data: any[];
  columns: Column[];
  showCounter?: boolean;
  customSummary?: React.ReactNode;
}

const PrintableList: React.FC<PrintableListProps> = ({
  title,
  data,
  columns,
  showCounter = true,
  customSummary
}) => {
  const formatDate = () => {
    return new Date().toLocaleDateString('es-GT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
        <h1 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold' }}>
          {title.toUpperCase()}
        </h1>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
          Reporte generado el: {formatDate()}
        </p>
      </div>

      {/* Estadísticas */}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div>
          <strong>Total de registros: {data.length}</strong>
        </div>
      </div>

      {/* Tabla */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa' }}>
            {showCounter && (
              <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>
                #
              </th>
            )}
            {columns.map((column, index) => (
              <th 
                key={index}
                style={{ 
                  border: '1px solid #ddd', 
                  padding: '12px', 
                  textAlign: column.align || 'left' 
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={item.id || index}>
                {showCounter && (
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                    {index + 1}
                  </td>
                )}
                {columns.map((column, colIndex) => (
                  <td 
                    key={colIndex}
                    style={{ 
                      border: '1px solid #ddd', 
                      padding: '8px', 
                      textAlign: column.align || 'left' 
                    }}
                  >
                    {column.format ? column.format(item[column.key]) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td 
                colSpan={columns.length + (showCounter ? 1 : 0)} 
                style={{ border: '1px solid #ddd', padding: '20px', textAlign: 'center', color: '#666' }}
              >
                No hay registros disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Resumen personalizado o por defecto */}
      {data.length > 0 && (
        <div style={{ marginTop: '30px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
              {customSummary || (
                <p style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                  <strong>Total de registros: {data.length}</strong>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pie de página */}
      <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '10px', color: '#666' }}>
        <p>Este reporte fue generado automáticamente por el Sistema de Gestión</p>
        <p>Fecha de impresión: {formatDate()}</p>
      </div>
    </div>
  );
};

export default PrintableList;