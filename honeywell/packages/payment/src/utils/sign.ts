import crypto from 'crypto';

/**
 * LWPAY 签名（MD5 大写）
 * 规则：ASCII排序 → &key=密钥 → MD5 → 大写
 */
export function lwpaySign(
  params: Record<string, unknown>,
  key: string
): string {
  // 过滤空值，按 ASCII 排序
  const sortedKeys = Object.keys(params)
    .filter(
      (k) =>
        params[k] !== '' &&
        params[k] !== null &&
        params[k] !== undefined &&
        k !== 'sign'
    )
    .sort();

  const signStr =
    sortedKeys.map((k) => `${k}=${params[k]}`).join('&') + `&key=${key}`;

  return crypto.createHash('md5').update(signStr).digest('hex').toUpperCase();
}

/**
 * UZPAY 签名（MD5 小写）
 * 规则：ASCII排序 → &key=密钥 → MD5 → 小写
 */
export function uzpaySign(
  params: Record<string, unknown>,
  key: string
): string {
  // 过滤空值，按 ASCII 排序
  const sortedKeys = Object.keys(params)
    .filter(
      (k) =>
        params[k] !== '' &&
        params[k] !== null &&
        params[k] !== undefined &&
        k !== 'sign'
    )
    .sort();

  const signStr =
    sortedKeys.map((k) => `${k}=${params[k]}`).join('&') + `&key=${key}`;

  return crypto.createHash('md5').update(signStr).digest('hex').toLowerCase();
}

/**
 * JYPAY HmacSHA256 签名
 * 规则：ASCII排序 → key1=value1&key2=value2 → HmacSHA256(密钥) → 小写hex
 */
export function jypaySign(
  params: Record<string, unknown>,
  hmacKey: string
): string {
  const sortedKeys = Object.keys(params)
    .filter(
      (k) =>
        params[k] !== '' &&
        params[k] !== null &&
        params[k] !== undefined &&
        k !== 'sign'
    )
    .sort();

  const signStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');

  return crypto
    .createHmac('sha256', hmacKey)
    .update(signStr)
    .digest('hex');
}

/**
 * JYPAY 代付下单签名（HmacSHA256 + RSA + Base64）
 */
export function jypayTransferSign(
  params: Record<string, unknown>,
  hmacKey: string,
  rsaPrivateKey: string
): string {
  const signA = jypaySign(params, hmacKey);

  const privateKeyPem = rsaPrivateKey.includes('BEGIN')
    ? rsaPrivateKey
    : `-----BEGIN PRIVATE KEY-----\n${rsaPrivateKey}\n-----END PRIVATE KEY-----`;

  const buffer = Buffer.from(signA, 'utf8');
  const encrypted = crypto.privateEncrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );

  return encrypted.toString('base64');
}

/**
 * 验证签名
 */
export function verifySign(
  params: Record<string, unknown>,
  key: string,
  expectedSign: string,
  signFn: typeof lwpaySign | typeof uzpaySign
): boolean {
  const calculatedSign = signFn(params, key);
  return calculatedSign === expectedSign;
}
