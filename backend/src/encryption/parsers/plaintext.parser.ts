import { IFileParser } from './parser.interface';

export class PlaintextParser implements IFileParser {
  async parse(rawPayload: string | Buffer): Promise<{ isStructured: boolean; schema: string[]; preview: any[] }> {
    const rawStr = Buffer.isBuffer(rawPayload) ? rawPayload.toString('utf8') : rawPayload;
    
    // Simple line-by-line regex tokenization
    const lines = rawStr.split('\n').filter(l => l.trim().length > 0);
    const preview = lines.slice(0, 500).map(l => ({ raw_line: l.trim() }));
    
    return {
      isStructured: true,
      schema: ['raw_line'],
      preview
    };
  }
}
