import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const usePDFExport = () => {
  const exportRenderToPDF = useCallback(async (containerRef, filename = 'export') => {
    const container = containerRef.current;
    if (!container) {
      console.warn('No container element found for PDF export');
      return false;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const contentWidth = pdfWidth - (margin * 2);
      
      let currentY = margin;
      let isFirstPage = true;

      const messageElements = Array.from(container.children);

      for (let i = 0; i < messageElements.length; i++) {
        const messageElement = messageElements[i];
        
        const canvas = await html2canvas(messageElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: 'transparent',
          width: 1000,
          windowWidth: 1200,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        if (currentY + imgHeight > pdfHeight - margin) {
          if (!isFirstPage) {
            pdf.addPage();
          }
          currentY = margin;
          isFirstPage = false;
        }

        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 15;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`${filename}_${timestamp}.pdf`);
      
      return true;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      return false;
    }
  }, []);

  const exportToPDFLog = useCallback(async (containerRef, filename = 'export') => {
    const container = containerRef.current;
    if (!container) {
      console.warn('No container element found for PDF export');
      return false;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - (margin * 2);
      
      let currentY = margin;

      const messageElements = Array.from(container.children);
      
      for (let i = 0; i < messageElements.length; i++) {
        const messageElement = messageElements[i];
        
        const isUser = messageElement.querySelector('[style*="flex-end"]') !== null;
        
        const chatMessageDiv = messageElement.querySelector('div > div');
        const textContent = chatMessageDiv?.innerText || chatMessageDiv?.textContent || '';
        
        const visualizationContainer = messageElement.querySelector('[style*="position: relative"]');
        
        if (textContent.trim()) {
          pdf.setFontSize(10);
          
          if (isUser) {
            pdf.setTextColor(0, 0, 255);
          } else {
            pdf.setTextColor(0, 0, 0);
          }
          
          pdf.setFont(undefined, 'bold');
          const senderLabel = isUser ? 'You:' : 'AnyLog AI:';
          pdf.text(senderLabel, margin, currentY);
          currentY += 7;
          
          pdf.setFont(undefined, 'normal');
          const lines = pdf.splitTextToSize(textContent.trim(), contentWidth);
          const textHeight = lines.length * 5;
          
          if (currentY + textHeight > pdfHeight - margin) {
            pdf.addPage();
            currentY = margin;
          }
          
          pdf.text(lines, margin, currentY);
          currentY += textHeight + 5;
        }
        
        if (visualizationContainer) {
          const visualizations = visualizationContainer.children;
          
          for (let j = 0; j < visualizations.length; j++) {
            const viz = visualizations[j];
            
            const canvas = await html2canvas(viz, {
              scale: 2,
              useCORS: false,
              logging: false,
              backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * contentWidth) / canvas.width;
            
            if (currentY + imgHeight > pdfHeight - margin) {
              pdf.addPage();
              currentY = margin;
            }
            
            pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 5;
          }
        }
        
        currentY += 10;

        if (i < messageElements.length - 1) {
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.1);
          pdf.line(margin, currentY, pdfWidth - margin, currentY);
          currentY += 5;
        }
      }

      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`${filename}_${timestamp}.pdf`);
      
      return true;
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      return false;
    }
  }, []);

  return { exportRenderToPDF, exportToPDFLog };
};