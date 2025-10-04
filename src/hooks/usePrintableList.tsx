import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';

export const usePrintableList = (documentTitle: string) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${documentTitle}_${new Date().toISOString().split('T')[0]}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
        }
      }
    `
  });

  return { printRef, handlePrint };
};