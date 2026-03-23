-- 邀请任务配置表
CREATE TABLE `ntp_common_invite_task_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_group` tinyint(1) NOT NULL COMMENT '任务组 1=LV2任务 2=LV1任务',
  `required_count` int(11) NOT NULL COMMENT '需要邀请人数',
  `reward_amount` decimal(12,2) NOT NULL COMMENT '奖励金额',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态 1启用 0禁用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='邀请任务配置表';

-- 插入任务组1（LV2邀请）
INSERT INTO `ntp_common_invite_task_config` VALUES (1, 1, 5, 300.00, 1, 1);
INSERT INTO `ntp_common_invite_task_config` VALUES (2, 1, 10, 800.00, 2, 1);
INSERT INTO `ntp_common_invite_task_config` VALUES (3, 1, 15, 1500.00, 3, 1);
INSERT INTO `ntp_common_invite_task_config` VALUES (4, 1, 30, 3000.00, 4, 1);

-- 插入任务组2（LV1邀请）
INSERT INTO `ntp_common_invite_task_config` VALUES (5, 2, 10, 500.00, 1, 1);
INSERT INTO `ntp_common_invite_task_config` VALUES (6, 2, 20, 1000.00, 2, 1);
INSERT INTO `ntp_common_invite_task_config` VALUES (7, 2, 30, 1500.00, 3, 1);
INSERT INTO `ntp_common_invite_task_config` VALUES (8, 2, 60, 3000.00, 4, 1);
