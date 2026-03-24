-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(20) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `inviteCode` VARCHAR(8) NOT NULL,
    `inviterId` INTEGER NULL,
    `vipLevel` INTEGER NOT NULL DEFAULT 0,
    `svipLevel` INTEGER NOT NULL DEFAULT 0,
    `availableBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `frozenBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `signInWindowStart` DATETIME(3) NULL,
    `signInWindowExpired` BOOLEAN NOT NULL DEFAULT false,
    `signInCurrentStreak` INTEGER NOT NULL DEFAULT 0,
    `signInCompleted` BOOLEAN NOT NULL DEFAULT false,
    `lastSignInAt` DATETIME(3) NULL,
    `hasPurchasedAfterRecharge` BOOLEAN NOT NULL DEFAULT false,
    `firstPurchaseDone` BOOLEAN NOT NULL DEFAULT false,
    `hasPurchasedPo0` BOOLEAN NOT NULL DEFAULT false,
    `hasOtherPurchase` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'BANNED', 'FROZEN') NOT NULL DEFAULT 'ACTIVE',
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `lastActiveAt` DATETIME(3) NULL,
    `registerIp` VARCHAR(45) NULL,
    `registerDevice` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_inviteCode_key`(`inviteCode`),
    INDEX `users_phone_idx`(`phone`),
    INDEX `users_inviteCode_idx`(`inviteCode`),
    INDEX `users_inviterId_idx`(`inviterId`),
    INDEX `users_status_idx`(`status`),
    INDEX `users_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_cards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `bankCode` VARCHAR(20) NOT NULL,
    `bankName` VARCHAR(100) NOT NULL,
    `accountName` VARCHAR(255) NOT NULL,
    `accountNo` VARCHAR(255) NOT NULL,
    `accountNoMask` VARCHAR(20) NOT NULL,
    `documentType` VARCHAR(20) NULL,
    `documentNo` VARCHAR(255) NULL,
    `accountType` VARCHAR(20) NULL,
    `cciCode` VARCHAR(255) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bank_cards_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('TRIAL', 'PAID') NOT NULL,
    `series` ENUM('PO', 'VIP') NOT NULL,
    `price` DECIMAL(15, 2) NOT NULL,
    `dailyIncome` DECIMAL(15, 2) NOT NULL,
    `cycleDays` INTEGER NOT NULL,
    `totalIncome` DECIMAL(15, 2) NOT NULL,
    `annualRate` DECIMAL(5, 2) NOT NULL,
    `requireVipLevel` INTEGER NULL,
    `grantVipLevel` INTEGER NULL,
    `grantSvipLevel` INTEGER NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_code_key`(`code`),
    INDEX `products_type_series_idx`(`type`, `series`),
    INDEX `products_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recharge_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNo` VARCHAR(20) NOT NULL,
    `userId` INTEGER NOT NULL,
    `channelCode` VARCHAR(20) NOT NULL,
    `channelOrderNo` VARCHAR(64) NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `paidAmount` DECIMAL(15, 2) NULL,
    `payUrl` TEXT NULL,
    `status` ENUM('PENDING', 'PAID', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `expireAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `callbackRaw` JSON NULL,
    `clientIp` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `recharge_orders_orderNo_key`(`orderNo`),
    INDEX `recharge_orders_userId_idx`(`userId`),
    INDEX `recharge_orders_orderNo_idx`(`orderNo`),
    INDEX `recharge_orders_status_idx`(`status`),
    INDEX `recharge_orders_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `withdraw_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNo` VARCHAR(20) NOT NULL,
    `userId` INTEGER NOT NULL,
    `bankCardId` INTEGER NOT NULL,
    `channelCode` VARCHAR(20) NULL,
    `channelOrderNo` VARCHAR(64) NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `fee` DECIMAL(15, 2) NOT NULL,
    `actualAmount` DECIMAL(15, 2) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `isAutoApproved` BOOLEAN NOT NULL DEFAULT false,
    `reviewerId` INTEGER NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewRemark` VARCHAR(255) NULL,
    `paidAt` DATETIME(3) NULL,
    `callbackRaw` JSON NULL,
    `rejectReason` VARCHAR(255) NULL,
    `clientIp` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `withdraw_orders_orderNo_key`(`orderNo`),
    INDEX `withdraw_orders_userId_idx`(`userId`),
    INDEX `withdraw_orders_orderNo_idx`(`orderNo`),
    INDEX `withdraw_orders_status_idx`(`status`),
    INDEX `withdraw_orders_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `position_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderNo` VARCHAR(20) NOT NULL,
    `userId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `purchaseAmount` DECIMAL(15, 2) NOT NULL,
    `dailyIncome` DECIMAL(15, 2) NOT NULL,
    `cycleDays` INTEGER NOT NULL,
    `totalIncome` DECIMAL(15, 2) NOT NULL,
    `paidDays` INTEGER NOT NULL DEFAULT 0,
    `earnedIncome` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `startAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endAt` DATETIME(3) NULL,
    `nextSettleAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `position_orders_orderNo_key`(`orderNo`),
    INDEX `position_orders_userId_idx`(`userId`),
    INDEX `position_orders_orderNo_idx`(`orderNo`),
    INDEX `position_orders_status_idx`(`status`),
    INDEX `position_orders_nextSettleAt_idx`(`nextSettleAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `income_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `positionId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `settleSequence` INTEGER NOT NULL,
    `scheduleAt` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'SETTLED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `settledAt` DATETIME(3) NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `lastError` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `income_records_positionId_idx`(`positionId`),
    INDEX `income_records_userId_idx`(`userId`),
    INDEX `income_records_status_scheduleAt_idx`(`status`, `scheduleAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` ENUM('RECHARGE', 'WITHDRAW', 'WITHDRAW_REFUND', 'PURCHASE', 'INCOME', 'COMMISSION', 'REGISTER_BONUS', 'SIGNIN_BONUS', 'ACTIVITY_BONUS', 'ADMIN_ADJUST') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `balanceAfter` DECIMAL(15, 2) NOT NULL,
    `relatedOrderNo` VARCHAR(20) NULL,
    `remark` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `transactions_userId_idx`(`userId`),
    INDEX `transactions_type_idx`(`type`),
    INDEX `transactions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `fromUserId` INTEGER NOT NULL,
    `level` INTEGER NOT NULL,
    `rate` DECIMAL(5, 2) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `sourceAmount` DECIMAL(15, 2) NOT NULL,
    `sourceOrderNo` VARCHAR(20) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `commissions_userId_idx`(`userId`),
    INDEX `commissions_fromUserId_idx`(`fromUserId`),
    INDEX `commissions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_channels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `merchantId` VARCHAR(50) NOT NULL,
    `paySecretKey` VARCHAR(255) NOT NULL,
    `transferSecretKey` VARCHAR(255) NOT NULL,
    `gatewayUrl` VARCHAR(255) NOT NULL,
    `bankCode` VARCHAR(20) NULL,
    `payType` VARCHAR(20) NULL,
    `payEnabled` BOOLEAN NOT NULL DEFAULT false,
    `transferEnabled` BOOLEAN NOT NULL DEFAULT false,
    `minAmount` DECIMAL(15, 2) NULL,
    `maxAmount` DECIMAL(15, 2) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `remark` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_channels_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `global_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'string',
    `group` VARCHAR(50) NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `global_configs_key_key`(`key`),
    INDEX `global_configs_group_idx`(`group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `text_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `description` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `text_configs_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `logoUrl` VARCHAR(255) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `banks_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `banners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `imageUrl` VARCHAR(255) NOT NULL,
    `linkType` VARCHAR(20) NOT NULL DEFAULT 'none',
    `linkUrl` VARCHAR(255) NULL,
    `position` VARCHAR(20) NOT NULL DEFAULT 'home',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `banners_position_isActive_idx`(`position`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(100) NOT NULL,
    `content` TEXT NOT NULL,
    `type` VARCHAR(20) NOT NULL DEFAULT 'popup',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `url` VARCHAR(255) NOT NULL,
    `iconUrl` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `page_configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pageId` VARCHAR(50) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `page_configs_pageId_key`(`pageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `config` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `startAt` DATETIME(3) NULL,
    `endAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `activities_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_rewards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `activityCode` VARCHAR(50) NOT NULL,
    `rewardType` VARCHAR(50) NOT NULL,
    `rewardLevel` INTEGER NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_rewards_userId_activityCode_idx`(`userId`, `activityCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` TEXT NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(50) NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'admin',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `lastLoginIp` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_login_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `userAgent` VARCHAR(255) NULL,
    `status` VARCHAR(20) NOT NULL,
    `failReason` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_login_logs_adminId_idx`(`adminId`),
    INDEX `admin_login_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_login_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `ip` VARCHAR(45) NOT NULL,
    `userAgent` VARCHAR(255) NULL,
    `device` VARCHAR(100) NULL,
    `status` VARCHAR(20) NOT NULL,
    `failReason` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_login_logs_userId_idx`(`userId`),
    INDEX `user_login_logs_ip_idx`(`ip`),
    INDEX `user_login_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operation_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL,
    `module` VARCHAR(50) NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `targetType` VARCHAR(50) NULL,
    `targetId` INTEGER NULL,
    `beforeData` JSON NULL,
    `afterData` JSON NULL,
    `ip` VARCHAR(45) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `operation_logs_adminId_idx`(`adminId`),
    INDEX `operation_logs_module_action_idx`(`module`, `action`),
    INDEX `operation_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blacklists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(20) NOT NULL,
    `value` VARCHAR(100) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `expireAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `blacklists_type_value_key`(`type`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sensitive_words` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `word` VARCHAR(100) NOT NULL,
    `replaceWith` VARCHAR(100) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sensitive_words_word_key`(`word`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scheduled_tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskCode` VARCHAR(50) NOT NULL,
    `taskName` VARCHAR(100) NOT NULL,
    `cronExpression` VARCHAR(50) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `lastRunAt` DATETIME(3) NULL,
    `lastRunStatus` VARCHAR(20) NULL,
    `lastRunDuration` INTEGER NULL,
    `nextRunAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `scheduled_tasks_taskCode_key`(`taskCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_run_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskCode` VARCHAR(50) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NULL,
    `duration` INTEGER NULL,
    `status` VARCHAR(20) NOT NULL,
    `processedCount` INTEGER NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `task_run_logs_taskCode_idx`(`taskCode`),
    INDEX `task_run_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_stats` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `newUsers` INTEGER NOT NULL DEFAULT 0,
    `activeUsers` INTEGER NOT NULL DEFAULT 0,
    `rechargeCount` INTEGER NOT NULL DEFAULT 0,
    `rechargeAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `withdrawCount` INTEGER NOT NULL DEFAULT 0,
    `withdrawAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `purchaseCount` INTEGER NOT NULL DEFAULT 0,
    `purchaseAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `incomeAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `commissionAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `daily_stats_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_inviterId_fkey` FOREIGN KEY (`inviterId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bank_cards` ADD CONSTRAINT `bank_cards_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recharge_orders` ADD CONSTRAINT `recharge_orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `withdraw_orders` ADD CONSTRAINT `withdraw_orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `position_orders` ADD CONSTRAINT `position_orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `position_orders` ADD CONSTRAINT `position_orders_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `income_records` ADD CONSTRAINT `income_records_positionId_fkey` FOREIGN KEY (`positionId`) REFERENCES `position_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commissions` ADD CONSTRAINT `commissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_login_logs` ADD CONSTRAINT `admin_login_logs_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_login_logs` ADD CONSTRAINT `user_login_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operation_logs` ADD CONSTRAINT `operation_logs_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
