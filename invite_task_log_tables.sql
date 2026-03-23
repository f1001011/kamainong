-- 邀请任务完成记录表
CREATE TABLE `ntp_common_invite_task_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `task_id` int(11) NOT NULL COMMENT '任务配置ID',
  `task_group` tinyint(1) NOT NULL COMMENT '任务组 1=LV2 2=LV1',
  `invite_count` int(11) NOT NULL COMMENT '完成时的邀请人数',
  `reward_amount` decimal(12,2) NOT NULL COMMENT '奖励金额',
  `week_start` date NOT NULL COMMENT '周开始日期',
  `create_time` datetime NOT NULL COMMENT '完成时间',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 1已发放 0待发放',
  PRIMARY KEY (`id`),
  KEY `idx_user_week` (`user_id`,`week_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邀请任务完成记录表';

-- 用户周邀请统计表（用于快速查询进度）
CREATE TABLE `ntp_common_user_invite_week` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `week_start` date NOT NULL COMMENT '周开始日期',
  `lv1_count` int(11) DEFAULT 0 COMMENT 'LV1邀请充值人数',
  `lv2_count` int(11) DEFAULT 0 COMMENT 'LV2邀请充值人数',
  `update_time` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_week` (`user_id`,`week_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户周邀请统计表';
