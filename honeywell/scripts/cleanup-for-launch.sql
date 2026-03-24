-- ============================================================
-- 生产数据库上线清理脚本
-- 保留用户: ID=4 (3876543226), ID=5 (3045661502)
-- 删除: 其余所有用户及关联业务数据
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

-- === 第一步：删除关联业务数据 ===

-- 社区（user_id）
DELETE FROM community_likes WHERE user_id NOT IN (4, 5);
DELETE FROM community_comments WHERE user_id NOT IN (4, 5);
DELETE FROM community_posts WHERE user_id NOT IN (4, 5);

-- 礼品码（user_id）
DELETE FROM gift_code_claims WHERE user_id NOT IN (4, 5);

-- 转盘（user_id）
DELETE FROM spin_records WHERE user_id NOT IN (4, 5);
DELETE FROM spin_chances WHERE user_id NOT IN (4, 5);

-- 奖池/周薪/SVIP（user_id）
DELETE FROM prize_pool_claims WHERE user_id NOT IN (4, 5);
DELETE FROM weekly_salary_claims WHERE user_id NOT IN (4, 5);
DELETE FROM svip_reward_records WHERE user_id NOT IN (4, 5);

-- 活动奖励（userId）
DELETE FROM activity_rewards WHERE userId NOT IN (4, 5);

-- 签到（userId）
DELETE FROM sign_in_records WHERE userId NOT IN (4, 5);

-- 收益记录（userId）
DELETE FROM income_records WHERE userId NOT IN (4, 5);

-- 持仓（userId）
DELETE FROM position_orders WHERE userId NOT IN (4, 5);

-- 购买记录（userId）
DELETE FROM user_product_purchases WHERE userId NOT IN (4, 5);

-- 返佣（receiverId/sourceUserId）
DELETE FROM commission_records WHERE receiverId NOT IN (4, 5) OR sourceUserId NOT IN (4, 5);

-- 有效邀请（inviterId/inviteeId）
DELETE FROM valid_invitations WHERE inviterId NOT IN (4, 5) OR inviteeId NOT IN (4, 5);

-- 充值/提现（userId）
DELETE FROM withdraw_orders WHERE userId NOT IN (4, 5);
DELETE FROM recharge_orders WHERE userId NOT IN (4, 5);

-- 流水（userId）
DELETE FROM transactions WHERE userId NOT IN (4, 5);

-- 通知（userId）
DELETE FROM notifications WHERE userId NOT IN (4, 5);

-- 公告已读（userId）
DELETE FROM announcement_reads WHERE userId NOT IN (4, 5);

-- 在线状态（userId）
DELETE FROM user_online_statuses WHERE userId NOT IN (4, 5);

-- 银行卡（userId）
DELETE FROM bank_cards WHERE userId NOT IN (4, 5);

-- 登录日志（userId）
DELETE FROM userloginlog WHERE userId NOT IN (4, 5);

-- 手机绑定（userId）
DELETE FROM account_phone_binds WHERE userId NOT IN (4, 5);

-- 营销渠道（userId）
DELETE FROM marketing_channels WHERE userId NOT IN (4, 5);

-- === 第二步：清理保留用户的悬空引用 ===
UPDATE user SET inviterId = NULL WHERE id IN (4, 5) AND inviterId IS NOT NULL AND inviterId NOT IN (4, 5);
UPDATE user SET level2InviterId = NULL WHERE id IN (4, 5) AND level2InviterId IS NOT NULL AND level2InviterId NOT IN (4, 5);
UPDATE user SET level3InviterId = NULL WHERE id IN (4, 5) AND level3InviterId IS NOT NULL AND level3InviterId NOT IN (4, 5);

-- === 第三步：删除非保留用户 ===
DELETE FROM user WHERE id NOT IN (4, 5);

-- === 第四步：清理统计数据 ===
DELETE FROM daily_stats;
DELETE FROM online_stat_snapshots;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
