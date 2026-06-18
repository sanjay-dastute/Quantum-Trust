import { IFileParser } from './parser.interface';
// @ts-ignore
import * as parquet from 'parquetjs-lite';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export class ParquetParser implements IFileParser {
  async parse(rawPayload: string | Buffer): Promise<{ isStructured: boolean; schema: string[]; preview: any[] }> {
    // Parquetjs requires reading from a file path rather than a buffer directly
    let tempPath = '';
    let isTempFile = false;
    
    try {
      if (Buffer.isBuffer(rawPayload) || typeof rawPayload === 'string') {
        tempPath = path.join(os.tmpdir(), `qt_parquet_${Date.now()}.parquet`);
        await fs.promises.writeFile(tempPath, rawPayload);
        isTempFile = true;
      }
      
      const reader = await parquet.ParquetReader.openFile(tempPath);
      const schema = reader.getSchema();
      const fields = Object.keys(schema.fields);
      
      const cursor = reader.getCursor();
      const preview: any[] = [];
      let record = null;
      let count = 0;
      
      while ((record = await cursor.next()) && count < 500) {
        preview.push(record);
        count++;
      }
      
      await reader.close();
      
      if (isTempFile) {
        await fs.promises.unlink(tempPath).catch(() => {});
      }
      
      return {
        isStructured: true,
        schema: fields,
        preview
      };
    } catch (e) {
      if (isTempFile && tempPath) {
        await fs.promises.unlink(tempPath).catch(() => {});
      }
      return { isStructured: false, schema: ['file_blob'], preview: [] };
    }
  }
}
