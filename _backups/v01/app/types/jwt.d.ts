declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string | string[];
    algorithm?: string;
    header?: object;
    issuer?: string;
    subject?: string;
    jwtid?: string;
    keyid?: string;
    mutatePayload?: boolean;
    noTimestamp?: boolean;
    encoding?: string;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: SignOptions
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: object
  ): any;

  export function decode(
    token: string,
    options?: object
  ): null | { [key: string]: any };
} 