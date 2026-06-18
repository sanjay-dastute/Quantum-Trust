import { IFileParser } from './parser.interface';
import * as Papa from 'papaparse';

export class CsvParser implements IFileParser {
  async parse(rawPayload: string | Buffer): Promise<{ isStructured: boolean; schema: string[]; preview: any[] }> {
    const rawStr = Buffer.isBuffer(rawPayload) ? rawPayload.toString('utf8') : rawPayload;
    
    return new Promise((resolve) => {
      Papa.parse(rawStr, {
        header: true,
        skipEmptyLines: true,
        preview: 500,
        complete: (results) => {
          resolve({
            isStructured: true,
            schema: results.meta.fields || [],
            preview: results.data
          });
        },
        error: () => {
          resolve({ isStructured: false, schema: ['file_blob'], preview: [] });
        }
      });
    });
  }
}
