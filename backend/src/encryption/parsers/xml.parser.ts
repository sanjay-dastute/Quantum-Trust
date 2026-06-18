import { IFileParser } from './parser.interface';
import * as xml2js from 'xml2js';

export class XmlParser implements IFileParser {
  async parse(rawPayload: string | Buffer): Promise<{ isStructured: boolean; schema: string[]; preview: any[] }> {
    const rawStr = Buffer.isBuffer(rawPayload) ? rawPayload.toString('utf8') : rawPayload;
    
    return new Promise((resolve) => {
      xml2js.parseString(rawStr, { explicitArray: false }, (err, result) => {
        if (err || !result) {
          return resolve({ isStructured: false, schema: ['file_blob'], preview: [] });
        }
        
        // Try to find the root elements. XML usually has one root key.
        const rootKey = Object.keys(result)[0];
        const data = result[rootKey];
        
        // If data has child arrays
        let rows: any[] = [];
        if (Array.isArray(data)) {
          rows = data;
        } else if (typeof data === 'object') {
          // If it's an object of arrays, pick the first one
          const innerKey = Object.keys(data)[0];
          if (Array.isArray(data[innerKey])) {
            rows = data[innerKey];
          } else {
            rows = [data];
          }
        } else {
          rows = [{ value: data }];
        }

        const firstRow = rows[0] || {};
        resolve({
          isStructured: true,
          schema: Object.keys(firstRow),
          preview: rows.slice(0, 500)
        });
      });
    });
  }
}
