/**
 * 插入 HTPAY 支付通道记录
 * 运行: npx tsx scripts/insert-htpay.ts
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.CHANNEL_ENCRYPTION_KEY || 'honeywell-channel-secret-key-32!';
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

async function main() {
  // 检查是否已存在
  const existing = await prisma.paymentChannel.findUnique({
    where: { code: 'HTPAY' },
  });

  if (existing) {
    console.log('HTPAY 通道已存在，ID:', existing.id);
    return;
  }

  const secret = 'ef8adbb0b01a74fd4f34a76c5222e32ce7788c0c';
  const encryptedSecret = encrypt(secret);

  const channel = await prisma.paymentChannel.create({
    data: {
      code: 'HTPAY',
      name: 'HTPAY通道',
      merchantId: '25779199',
      paySecretKey: encryptedSecret,
      transferSecretKey: encryptedSecret, // 代收代付用同一密钥
      gatewayUrl: 'https://per.hypaysup.org',
      bankCode: null,
      payType: null,
      payFeeRate: 0,
      transferFeeRate: 0,
      payEnabled: true,
      transferEnabled: true,
      channelStatus: 'NORMAL',
      sortOrder: 4,
      remark: 'HTPAY通道 - 商户号25779199',
      extraConfig: undefined,
    },
  });

  console.log('HTPAY 通道创建成功:', {
    id: channel.id,
    code: channel.code,
    name: channel.name,
    merchantId: channel.merchantId,
    gatewayUrl: channel.gatewayUrl,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
