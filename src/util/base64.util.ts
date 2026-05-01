export class Base64Util {

    static toBase64(content: Buffer | Uint8Array | string): string {
        if (typeof content === 'string') {
            return Buffer.from(content, 'utf8').toString('base64');
        }

        return Buffer.from(content).toString('base64');
    }
}