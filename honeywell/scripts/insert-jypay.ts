/**
 * JYPAY 通道数据插入脚本
 * 使用与 channel.service.ts 完全相同的 AES-256-CBC 加密逻辑
 *
 * 运行: npx tsx scripts/insert-jypay.ts
 */
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 与 channel.service.ts 保持一致的加密参数
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
  // ============ 商户配置 ============
  const merchantId = '802090006080591';

  // HmacSHA256 密钥 → paySecretKey
  const hmacKey = '4910A4DC7D7F6F6B11195E0E16089C1AF0832C3A2ECBBCCB37F85FA7E8CD4A1B';

  // RSA 私钥 → transferSecretKey
  const rsaPrivateKey = 'MIICdgIBADANBgkqhkiG9w0BAQEFAASCAmAwggJcAgEAAoGBAIKRbmFhEmhGCXee2fT30TW4sAfO+DWV2gau6+oQ2LT8RBTXs/lAqMFJQrxrf8J6QzaWUYKk2a3mUEXGhSrLevAx60bo6re+hWcqPX3kgImJDv7XxxYKlXl98U1DCbsbjLYaH2GMWZH76+sexzk+EIUD/z00XrFOw3nPBaSDwUBzAgMBAAECgYBViVzcorFiam+NVB3JpAgEv6dili55PGCG/FVFFCBEAPfBB8a5xahIZ+w2b95U06/wtO1VPxX0HOv9qh5XeNJiVBfmdf+c3IV0syd8VqlE+prVuDTbNCDemFrH6VCXfDpCXMQEeJrvzUyxIwV3Gsggx512uDNPD0n2E0u7ZFMX4QJBAMrsgpME+8Yw+FT7VGnY6TqCzz0RPmHdMXKpJn5xvAL/v/VLSY5mOrnlNGNhZ6hQ8vmtA9LihvBEAjn11p6GoQkCQQCkuBUeNLXT5WzWf2ClBAaB2ezH4T31ze70deg7MAn9n/eFZauQSgkDxfgGTwpoTj9EutGb6CQzQDIDvc1Mf8CbAkEAlUYaX7BgzdCkPU+NLzgDialEbfXLYA5pG6HW0Vk1JzefrAAwIfKN7MXxHdI/gI/bzVM65t0AyqocwSpZMNB0kQJAN3Um3wmeIl5/G2S9dDF7w2JM3ysNwmF4T2QXMT5GTtb57jbB4Y2bpWKU1ALunRmjIY/InLY24e5+KFZR9ayZewJAfCIVgU/E0T69E/d4Y/ESwXgNOgFhvd+o3gdloyJra16Q+YkAzG1QTWvH3TsgvY5K9kpgUPdRvGIYaDjSrJeF4g==';

  // RSA 公钥 → extraConfig.rsaPublicKey
  const rsaPublicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCCkW5hYRJoRgl3ntn099E1uLAHzvg1ldoGruvqENi0/EQU17P5QKjBSUK8a3/CekM2llGCpNmt5lBFxoUqy3rwMetG6Oq3voVnKj195ICJiQ7+18cWCpV5ffFNQwm7G4y2Gh9hjFmR++vrHsc5PhCFA/89NF6xTsN5zwWkg8FAcwIDAQAB';

  // ============ 加密密钥 ============
  const encryptedPayKey = encrypt(hmacKey);
  const encryptedTransferKey = encrypt(rsaPrivateKey);

  console.log('加密完成:');
  console.log('  paySecretKey (HmacSHA256):', encryptedPayKey.substring(0, 40) + '...');
  console.log('  transferSecretKey (RSA私钥):', encryptedTransferKey.substring(0, 40) + '...');

  // ============ 检查是否已存在 ============
  const existing = await prisma.paymentChannel.findFirst({
    where: { code: 'JYPAY' },
  });

  if (existing) {
    console.log(`\nJYPAY 通道已存在 (id=${existing.id})，执行更新...`);
    await prisma.paymentChannel.update({
      where: { id: existing.id },
      data: {
        merchantId,
        paySecretKey: encryptedPayKey,
        transferSecretKey: encryptedTransferKey,
        gatewayUrl: 'https://nkhbz.jytpz.com',
        bankCode: '118001',
        payType: '219001',
        payFeeRate: 7.20,
        transferFeeRate: 4.00,
        payEnabled: true,
        transferEnabled: false,
        channelStatus: 'NORMAL',
        extraConfig: {
          transferGatewayUrl: 'https://twerf.jytpz.com',
          rsaPublicKey,
        },
      },
    });
    console.log('✅ JYPAY 通道更新成功');
  } else {
    console.log('\n创建新 JYPAY 通道...');
    const channel = await prisma.paymentChannel.create({
      data: {
        code: 'JYPAY',
        name: 'JYPAY通道',
        merchantId,
        paySecretKey: encryptedPayKey,
        transferSecretKey: encryptedTransferKey,
        gatewayUrl: 'https://nkhbz.jytpz.com',
        bankCode: '118001',
        payType: '219001',
        payFeeRate: 7.20,
        transferFeeRate: 4.00,
        payEnabled: true,
        transferEnabled: false,
        channelStatus: 'NORMAL',
        consecutiveFailures: 0,
        todayRecharge: 0,
        todayWithdraw: 0,
        yesterdayRecharge: 0,
        yesterdayWithdraw: 0,
        totalRecharge: 0,
        totalWithdraw: 0,
        sortOrder: 3,
        extraConfig: {
          transferGatewayUrl: 'https://twerf.jytpz.com',
          rsaPublicKey,
        },
      },
    });
    console.log(`✅ JYPAY 通道创建成功 (id=${channel.id})`);
  }

  // ============ 验证插入结果 ============
  const verify = await prisma.paymentChannel.findFirst({
    where: { code: 'JYPAY' },
    select: {
      id: true,
      code: true,
      name: true,
      merchantId: true,
      gatewayUrl: true,
      bankCode: true,
      payType: true,
      payFeeRate: true,
      transferFeeRate: true,
      payEnabled: true,
      transferEnabled: true,
      channelStatus: true,
      extraConfig: true,
    },
  });
  console.log('\n验证结果:');
  console.log(JSON.stringify(verify, null, 2));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ 插入失败:', err);
  prisma.$disconnect();
  process.exit(1);
});
