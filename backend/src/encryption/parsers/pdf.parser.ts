import { IFileParser } from './parser.interface';
const pdf = require('pdf-parse');

export class PdfParser implements IFileParser {
  async parse(rawPayload: string | Buffer): Promise<{ isStructured: boolean; schema: string[]; preview: any[] }> {
    try {
      const buffer = Buffer.isBuffer(rawPayload) ? rawPayload : Buffer.from(rawPayload);
      const data = await pdf(buffer);
      
      // Treat text lines as semi-structured text preview
      const lines = data.text.split('\n').filter((l: string) => l.trim().length > 0);
      const preview = lines.slice(0, 500).map((l: string) => ({ raw_text: l }));

      return {
        isStructured: true,
        schema: ['raw_text'], // Provide simple single column schema for PDF text
        preview
      };
    } catch (e) {
      return { isStructured: false, schema: ['file_blob'], preview: [] };
    }
  }
}
