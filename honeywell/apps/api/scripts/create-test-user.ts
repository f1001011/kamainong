/**
 * @file 创建测试用户脚本
 * @description 创建一个用于测试的用户
 * @usage pnpm tsx scripts/create-test-user.ts
 */

import { PrismaClient } from '@prisma/client';
import { aesEncrypt } from '@honeywell/utils';

const prisma = new PrismaClient();

async function main() {
  console.log('创建测试用户...');
  
  const phone = '999888777';
  const password = 'test123456';
  // 使用 AES 加密密码（与系统一致）
  const encryptedPassword = aesEncrypt(password);
  
  // 生成邀请码
  const inviteCode = 'TEST0001';
  
  try {
    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        password: encryptedPassword,
      },
      create: {
        phone,
        password: encryptedPassword,
        inviteCode,
        vipLevel: 0,
        svipLevel: 0,
        availableBalance: 100,
        frozenBalance: 0,
        hasPurchasedPo0: false,
        hasPurchasedPaid: false,
        hasPurchasedOther: false,
        signInCompleted: false,
        signInWindowExpired: false,
        signInCurrentStreak: 0,
        firstPurchaseDone: false,
        status: 'ACTIVE',
      },
    });
    
    console.log('✅ 测试用户创建成功！');
    console.log('   手机号:', phone);
    console.log('   密码:', password);
    console.log('   用户ID:', user.id);
    console.log('   邀请码:', user.inviteCode);
  } catch (error) {
    console.error('❌ 创建失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
