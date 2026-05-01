export type SESEmailAttachment = {
    filename: string;
    contentType: string;
    content: Buffer | Uint8Array | string;
};