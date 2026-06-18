import { IFileParser } from './parser.interface';
import * as XLSX from 'xlsx';

export class ExcelParser implements IFileParser {
  async parse(rawPayload: string | Buffer): Promise<{ isStructured: boolean; schema: string[]; preview: any[] }> {
    try {
      // XLSX parses buffer optimally
      const buffer = Buffer.isBuffer(rawPayload) ? rawPayload : Buffer.from(rawPayload);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet);

      const firstRow = jsonRows[0] || {};
      return {
        isStructured: true,
        schema: Object.keys(firstRow),
        preview: jsonRows.slice(0, 500)
      };
    } catch (e) {
      return { isStructured: false, schema: ['file_blob'], preview: [] };
    }
  }
}
