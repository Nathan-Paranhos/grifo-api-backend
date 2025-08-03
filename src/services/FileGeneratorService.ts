import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { AppError } from '../errors/AppError';

class FileGeneratorService {
  public async generateFile(format: string, data: Record<string, unknown>[], filename: string, title: string): Promise<string> {
    switch (format) {
      case 'excel':
        return this.createExcelFile(data, filename, title);
      case 'pdf':
        return this.createPDFFile(data, filename, title);
      case 'csv':
        return this.createCSVFile(data, filename);
      default:
        throw new AppError('Formato de arquivo inválido', 400);
    }
  }

  private async createExcelFile(data: Record<string, unknown>[], filename: string, sheetName: string): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.addRow(headers);
      data.forEach(row => {
        const values = headers.map(header => row[header]);
        worksheet.addRow(values);
      });
      worksheet.getRow(1).font = { bold: true };
    }

    const filePath = path.join(process.cwd(), 'exports', filename);
    const exportDir = path.dirname(filePath);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    await workbook.xlsx.writeFile(filePath);
    return filePath;
  }

  private createPDFFile(data: Record<string, unknown>[], filename: string, title: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const filePath = path.join(process.cwd(), 'exports', filename);
      const exportDir = path.dirname(filePath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(16).text(title, { align: 'center' });
      doc.moveDown();

      if (data.length > 0) {
        // Implement PDF table generation logic here
      }

      doc.end();
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }

  private async createCSVFile(data: Record<string, unknown>[], filename: string): Promise<string> {
    const filePath = path.join(process.cwd(), 'exports', filename);
    const exportDir = path.dirname(filePath);
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      data.forEach(row => {
        const values = headers.map(header => JSON.stringify(row[header] || ''));
        csvRows.push(values.join(','));
      });
      fs.writeFileSync(filePath, csvRows.join('\n'));
    } else {
      fs.writeFileSync(filePath, '');
    }

    return filePath;
  }
}

export const fileGeneratorService = new FileGeneratorService();