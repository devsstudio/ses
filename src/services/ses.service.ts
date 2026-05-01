import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { SESConfig } from '../dto/data/ses-config';
import { SESEmailAttachment } from '../dto/type/ses-email-attachment.type';
import { Base64Util } from '../util/base64.util';

export class SESService {
    protected sesClient: SESClient;

    constructor(private readonly config: SESConfig | null = null) {
        this.sesClient = new SESClient(config || {});
    }

    private buildRawMime(
        from: string,
        to: string,
        subject: string,
        html: string,
        alt_text: string,
        attachments: SESEmailAttachment[]
    ): Uint8Array {
        const boundaryMixed = `mixed_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const boundaryAlt = `alt_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        const headers = [
            `From: ${from}`,
            `To: ${to}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            `Content-Type: multipart/mixed; boundary="${boundaryMixed}"`,
            '',
            '',
        ].join('\r\n');

        const bodyAlt = [
            `--${boundaryMixed}`,
            `Content-Type: multipart/alternative; boundary="${boundaryAlt}"`,
            '',
            `--${boundaryAlt}`,
            'Content-Type: text/plain; charset="UTF-8"',
            'Content-Transfer-Encoding: base64',
            '',
            Base64Util.toBase64(alt_text),
            '',
            `--${boundaryAlt}`,
            'Content-Type: text/html; charset="UTF-8"',
            'Content-Transfer-Encoding: base64',
            '',
            Base64Util.toBase64(html),
            '',
            `--${boundaryAlt}--`,
            '',
        ].join('\r\n');

        const attachmentParts = attachments
            .map((a) => {
                return [
                    `--${boundaryMixed}`,
                    `Content-Type: ${a.contentType}; name="${a.filename}"`,
                    'Content-Transfer-Encoding: base64',
                    `Content-Disposition: attachment; filename="${a.filename}"`,
                    '',
                    Base64Util.toBase64(a.content),
                    '',
                ].join('\r\n');
            })
            .join('');

        const closing = [`--${boundaryMixed}--`, ''].join('\r\n');

        const raw = headers + bodyAlt + attachmentParts + closing;
        return Uint8Array.from(Buffer.from(raw, 'utf8'));
    }

    async send(
        from: string,
        to: string | string[],
        subject: string,
        html: string,
        alt_text: string,
        attachments: SESEmailAttachment[]
    ) {

        const toHeader = Array.isArray(to) ? to.join(', ') : to;

        const raw = this.buildRawMime(
            from,
            toHeader,
            subject,
            html,
            alt_text,
            attachments,
        );

        await this.sesClient.send(
            new SendRawEmailCommand({
                RawMessage: { Data: raw },
            }),
        );

        return { success: true };
    }
}