import { IFileParser } from './parser.interface';
import * as yaml from 'js-yaml';

export class YamlParser implements IFileParser {
  async parse(rawPayload: string | Buffer): Promise<{ isStructured: boolean; schema: string[]; preview: any[] }> {
    const rawStr = Buffer.isBuffer(rawPayload) ? rawPayload.toString('utf8') : rawPayload;
    try {
      const parsed: any = yaml.load(rawStr);
      const isArray = Array.isArray(parsed);
      const firstRow = isArray ? parsed[0] : parsed;
      const schema = Object.keys(firstRow || {});
      const preview = isArray ? parsed.slice(0, 500) : [parsed];

      return {
        isStructured: true,
        schema,
        preview
      };
    } catch (e) {
      return { isStructured: false, schema: ['file_blob'], preview: [] };
    }
  }
}
