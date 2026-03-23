/*
 Navicat Premium Dump SQL

 Source Server         : 127.0.0.1
 Source Server Type    : MySQL
 Source Server Version : 50726 (5.7.26)
 Source Host           : localhost:3306
 Source Schema         : newv1

 Target Server Type    : MySQL
 Target Server Version : 50726 (5.7.26)
 File Encoding         : 65001

 Date: 23/03/2026 11:03:15
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for ntp_common_admin
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_admin`;
CREATE TABLE `ntp_common_admin`  (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '管理员账号',
  `pwd` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '密码',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `role` int(2) NULL DEFAULT 1 COMMENT '角色',
  `market_level` int(11) NULL DEFAULT NULL COMMENT '市场部级别',
  `remarks` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '0' COMMENT '备注',
  `phone` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '0' COMMENT '手机号码',
  `invitation_code` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '0' COMMENT '邀请码',
  `market_uid` int(11) NULL DEFAULT NULL,
  `operate_pwd` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '用户余额变更使用的操作密码',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '后台管理员表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_admin
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_admin_token
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_admin_token`;
CREATE TABLE `ntp_common_admin_token`  (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '登陆凭证',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `admin_uid` int(10) NULL DEFAULT NULL COMMENT '管理员ID',
  `type` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '后台确定单点登陆' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_admin_token
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_ads
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_ads`;
CREATE TABLE `ntp_common_ads`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `add_time` datetime NULL DEFAULT NULL,
  `status` tinyint(1) NULL DEFAULT 1 COMMENT '是否显示 1是 ',
  `img` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '图片地址',
  `sort` int(11) NULL DEFAULT NULL COMMENT '排序',
  `type` tinyint(1) NOT NULL DEFAULT 1 COMMENT '轮播图',
  `is_type` tinyint(1) NOT NULL DEFAULT 0 COMMENT '类型：0：图片；1：文章',
  `url` varchar(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NULL DEFAULT NULL,
  `content` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '文章内容',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 30 CHARACTER SET = utf8 COLLATE = utf8_unicode_ci COMMENT = '轮播图' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ntp_common_ads
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_agent_path
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_agent_path`;
CREATE TABLE `ntp_common_agent_path`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL COMMENT '用户id',
  `path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户所有上一级',
  `agent_id` int(11) NOT NULL COMMENT '直属代理ID',
  `times` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '用户所有上一级' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ntp_common_agent_path
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_email
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_email`;
CREATE TABLE `ntp_common_email`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL DEFAULT 0,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `content` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `is_send` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0 未发送 1 已发送',
  `is_read` tinyint(4) NOT NULL DEFAULT 0 COMMENT '0 未读 1 已读',
  `send_time` datetime NULL DEFAULT NULL COMMENT '发送时间',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '变化时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '邮件发送表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_email
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_goods
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_goods`;
CREATE TABLE `ntp_common_goods`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `goods_type_id` int(12) NOT NULL COMMENT '商品分类',
  `goods_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '商品名称',
  `goods_money` decimal(20, 2) NOT NULL COMMENT '投注价格，最低价格，起投金额',
  `project_scale` decimal(20, 2) NOT NULL DEFAULT 0.00 COMMENT '万元 项目规模',
  `day_red` decimal(12, 2) NOT NULL DEFAULT 0.00 COMMENT '每日分红',
  `period` int(12) NOT NULL DEFAULT 0 COMMENT '投资周期',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 上架，2即将推出，0下架上架',
  `red_way` int(12) NOT NULL DEFAULT 1 COMMENT '1 到期还本还息  2 每日返息到期还本',
  `warrant` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '担保公司',
  `create_time` datetime NOT NULL,
  `head_img` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '封面图，顶部图',
  `bottom_img` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '详情下图',
  `is_examine` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 是新手体验产品',
  `sort` int(12) NOT NULL DEFAULT 0 COMMENT '商品排序',
  `is_coupon` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否可用优惠卷，0 不可用。1可用',
  `del` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 正常，1 删除',
  `progress_rate` decimal(20, 2) NOT NULL DEFAULT 0.00 COMMENT '投资进度',
  `goods_agent_1` decimal(12, 2) NOT NULL DEFAULT 0.00 COMMENT '一级返佣',
  `goods_agent_2` decimal(12, 2) NOT NULL DEFAULT 0.00,
  `goods_agent_3` decimal(12, 2) NOT NULL DEFAULT 0.00,
  `buy_num` int(11) NOT NULL DEFAULT 0 COMMENT '0无限次 可以购买次数',
  `level_vip` int(11) NOT NULL DEFAULT 0 COMMENT '可购买等级  0 随便购买',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '项目表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_goods
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_goods_order
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_goods_order`;
CREATE TABLE `ntp_common_goods_order`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `goods_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `goods_id` int(11) NOT NULL,
  `day_id` int(11) NOT NULL,
  `goods_type_id` int(11) NOT NULL,
  `goods_money` decimal(12, 2) NOT NULL COMMENT '商品价格',
  `goods_type_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `total_red_money` decimal(20, 2) NOT NULL COMMENT '全部应该获得的分红金额',
  `already_red_money` decimal(20, 2) NOT NULL COMMENT '已经获得的分红金额',
  `surplus_red_money` decimal(20, 2) NOT NULL COMMENT '剩余应该获得的分红',
  `red_day` int(12) NOT NULL DEFAULT 0 COMMENT '总分红天数',
  `already_red_day` int(11) NOT NULL COMMENT '已经分红的天数',
  `surplus_red_day` int(11) NOT NULL COMMENT '剩余分红的天数',
  `next_red_date` datetime NOT NULL COMMENT '下次分红日期',
  `last_red_date` datetime NOT NULL COMMENT '上次分红时间，默认是创建时间',
  `order_money` decimal(20, 2) NOT NULL COMMENT '订单金额',
  `order_number` int(11) NOT NULL DEFAULT 0 COMMENT '商品数量',
  `create_time` datetime NOT NULL COMMENT '创建时间',
  `update_time` datetime NOT NULL COMMENT '更新时间',
  `is_coupon` tinyint(1) NOT NULL DEFAULT 0 COMMENT ' 使用优惠卷的优惠卷 ID  0表示没使用优惠卷',
  `coupon_money` decimal(20, 2) NOT NULL DEFAULT 0.00 COMMENT '使用优惠卷时优惠卷金额',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0正常 1 返佣完成，正在分红中，2 分红完成利息返回完成  3 本金返回完成 -1删除',
  `order_no` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '订单号',
  `one_money` decimal(20, 0) NOT NULL DEFAULT 0 COMMENT '商品单价 单件商品价',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '商品订单表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_goods_order
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_home_token
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_home_token`;
CREATE TABLE `ntp_common_home_token`  (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '登陆凭证',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `user_id` int(10) NULL DEFAULT NULL COMMENT '管理员ID',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '前台token' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_home_token
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_pay_cash
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_pay_cash`;
CREATE TABLE `ntp_common_pay_cash`  (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `create_time` datetime NULL DEFAULT NULL COMMENT '提现时间',
  `success_time` datetime NULL DEFAULT NULL COMMENT '到账时间（审核时间）',
  `money` decimal(20, 2) NULL DEFAULT NULL COMMENT '提现金额',
  `money_before` decimal(20, 2) NULL DEFAULT NULL COMMENT '用户开始金额',
  `money_end` decimal(20, 2) NULL DEFAULT NULL COMMENT '用户结束金额，余额',
  `money_fee` decimal(20, 2) NULL DEFAULT NULL COMMENT '手续费',
  `money_actual` decimal(20, 2) NULL DEFAULT NULL COMMENT '实际到账金额',
  `msg` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  `u_id` int(10) NOT NULL COMMENT '用户ID',
  `u_ip` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '用户IP',
  `u_city` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '用户地区',
  `admin_uid` int(10) NULL DEFAULT NULL COMMENT '管理员ID',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '状态 0申请提现。1打款成功。 2拒绝',
  `pay_type` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '支付方式',
  `u_bank_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '用户收款银行名',
  `u_back_card` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '用户收款账号',
  `u_back_user_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '用户收款名',
  `market_uid` int(10) NULL DEFAULT 0 COMMENT '业务员ID',
  `trilateral_order` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '三方订单号',
  `order_on` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '订单号',
  `is_status` tinyint(255) NOT NULL DEFAULT 0 COMMENT '1 提交到平台',
  `channel_id` int(11) NULL DEFAULT NULL COMMENT '支付渠道id',
  `channel_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '支付渠道名称',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '提现表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_pay_cash
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_pay_channel
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_pay_channel`;
CREATE TABLE `ntp_common_pay_channel`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `json_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '支付信息内容',
  `type` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1 充值渠道   2 提现渠道',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '通道名称',
  `status` tinyint(4) NOT NULL DEFAULT 1 COMMENT '1 上架  0 下架',
  `create_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'z支付渠道表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_pay_channel
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_pay_coupon
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_pay_coupon`;
CREATE TABLE `ntp_common_pay_coupon`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `money` decimal(10, 2) NOT NULL COMMENT '优惠卷价值',
  `type` tinyint(4) NOT NULL COMMENT '1 支付优惠卷',
  `uid` int(11) NOT NULL COMMENT '用户id',
  `create_time` datetime NULL DEFAULT NULL,
  `use_time` datetime NULL DEFAULT NULL COMMENT '使用时间',
  `status` tinyint(4) NOT NULL COMMENT '1 使用了  2未使用',
  `exp_time` datetime NOT NULL COMMENT '过期时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '付款优惠卷' ROW_FORMAT = Fixed;

-- ----------------------------
-- Records of ntp_common_pay_coupon
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_pay_money_log
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_pay_money_log`;
CREATE TABLE `ntp_common_pay_money_log`  (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `create_time` datetime NULL DEFAULT NULL COMMENT '时间',
  `type` tinyint(1) NOT NULL COMMENT '类型 1收入 2支出',
  `status` int(3) NOT NULL COMMENT '详细类型 101充值  102 签到 103 用户每日收益 104 代理返佣  110 购买商品消费金额  111 购买商品消耗积分 201 提现',
  `money_type` tinyint(2) NOT NULL COMMENT '1余额 2积分',
  `money_before` decimal(30, 2) NULL DEFAULT 0.00 COMMENT '变化前金额',
  `money_end` decimal(30, 2) NULL DEFAULT 0.00 COMMENT '变化后金额',
  `money` decimal(30, 2) NOT NULL COMMENT '变化金额',
  `uid` int(10) NOT NULL COMMENT '用户ID',
  `source_id` int(10) NULL DEFAULT NULL COMMENT '源头ID',
  `market_uid` int(10) NULL DEFAULT 0 COMMENT '业务员ID',
  `rmark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `sel`(`type`, `status`, `uid`, `money_type`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '资金流水表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_pay_money_log
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_pay_recharge
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_pay_recharge`;
CREATE TABLE `ntp_common_pay_recharge`  (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `create_time` datetime NULL DEFAULT NULL COMMENT '充值时间',
  `success_time` datetime NULL DEFAULT NULL COMMENT '到账时间(审核时间)',
  `money` decimal(20, 2) NULL DEFAULT NULL COMMENT '充值金额',
  `admin_uid` int(10) NULL DEFAULT NULL COMMENT '管理员ID',
  `uid` int(10) NULL DEFAULT NULL COMMENT '用户ID',
  `u_ip` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '用户ip',
  `u_city` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '地区',
  `sys_bank_id` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '收款账号',
  `u_bank_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '打款银行名',
  `u_bank_user_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '打款用户名',
  `u_bank_card` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '打款银行卡号',
  `market_uid` int(10) NULL DEFAULT 0 COMMENT '业务员ID',
  `order_no` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '充值订单编号',
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '充值订单状态 0创建订单  1待支付  2支付成功 3支付失败，拒绝支付',
  `trilateral_order` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '三方订单号',
  `money_end` decimal(20, 2) NULL DEFAULT NULL,
  `money_before` decimal(20, 2) NULL DEFAULT NULL,
  `channel_id` int(11) NULL DEFAULT NULL COMMENT '支付渠道id',
  `channel_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '支付渠道名称',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '充值表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_pay_recharge
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_sys_config
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_sys_config`;
CREATE TABLE `ntp_common_sys_config`  (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '配置中文名称',
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '约束条件',
  `mark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `sel`(`name`(191)) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '后台配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ntp_common_sys_config
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_user
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_user`;
CREATE TABLE `ntp_common_user`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_no` bigint(20) NOT NULL COMMENT '也是唯一键',
  `user_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `nickname` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `create_time` datetime NOT NULL,
  `pwd` varchar(70) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '密码 算法加密',
  `withdraw_pwd` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '提现密码 默认和密码一样 base64加密',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 正常 0冻结 -1 删除',
  `state` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 在线 0 不在线',
  `head_img` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '头像',
  `is_real_name` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否实名 0未实名 1提交申请  2 通过申请 3拒绝申请',
  `market_uid` int(12) NOT NULL DEFAULT 0 COMMENT '业务员ID',
  `is_fictitious` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否虚拟账号 1是 0否',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '手机号码',
  `money_balance` decimal(20, 2) NOT NULL DEFAULT 0.00 COMMENT '用户余额',
  `money_freeze` decimal(20, 2) NOT NULL DEFAULT 0.00 COMMENT '冻结金额',
  `money_integral` decimal(20, 2) NOT NULL DEFAULT 0.00 COMMENT '积分',
  `money_team` decimal(12, 2) NOT NULL DEFAULT 0.00 COMMENT '团队佣金',
  `user_team` int(12) NOT NULL COMMENT '所属团队',
  `ip` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '注册的IP地址',
  `total_withdraw` decimal(12, 2) NOT NULL DEFAULT 0.00 COMMENT '累计提现',
  `total_recharge` decimal(12, 2) NOT NULL DEFAULT 0.00 COMMENT '累计充值',
  `total_red` decimal(12, 2) NOT NULL DEFAULT 0.00 COMMENT '分红',
  `sfz` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '身份证号',
  `is_withdraw` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否可提现。0不可 1可以',
  `agent_id_1` int(12) NOT NULL DEFAULT 0 COMMENT '1级',
  `agent_id_2` int(12) NOT NULL DEFAULT 0 COMMENT '2级',
  `agent_id_3` int(12) NOT NULL DEFAULT 0 COMMENT '3级',
  `agent_id` int(12) NOT NULL DEFAULT 0 COMMENT '上级代理，防止以后用到无限级',
  `level_vip` tinyint(4) NOT NULL DEFAULT 0 COMMENT 'vip等级',
  `current_experience` int(11) NOT NULL DEFAULT 0 COMMENT '当前经验(已经获得的经验)',
  PRIMARY KEY (`id`, `user_no`) USING BTREE,
  INDEX `sel`(`user_name`, `phone`, `agent_id_1`, `agent_id_2`, `agent_id_3`, `agent_id`) USING BTREE,
  INDEX `agent_id`(`agent_id`) USING BTREE,
  INDEX `is_real_name`(`is_real_name`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_user
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_user_sign_log
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_user_sign_log`;
CREATE TABLE `ntp_common_user_sign_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uid` int(11) NOT NULL,
  `money` decimal(12, 2) NOT NULL,
  `create_time` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `money`(`uid`, `money`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 10000 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '用户签到' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_user_sign_log
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_vip
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_vip`;
CREATE TABLE `ntp_common_vip`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `experience` int(11) NOT NULL DEFAULT 0 COMMENT '需要经验',
  `vip` int(11) NOT NULL DEFAULT 0 COMMENT 'vip等级',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'vip表' ROW_FORMAT = Fixed;

-- ----------------------------
-- Records of ntp_common_vip
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_vip_log
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_vip_log`;
CREATE TABLE `ntp_common_vip_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `start_exp` int(11) NOT NULL DEFAULT 0 COMMENT '开始经验',
  `end_exp` int(11) NOT NULL DEFAULT 0 COMMENT '结束经验',
  `start_level` int(11) NOT NULL DEFAULT 0 COMMENT '开始等级',
  `end_level` int(11) NOT NULL DEFAULT 0 COMMENT '结束等级',
  `create_time` datetime NOT NULL,
  `update_time` datetime NOT NULL,
  `remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = 'vip日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ntp_common_vip_log
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_wares
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_wares`;
CREATE TABLE `ntp_common_wares`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wares_type_id` int(11) NOT NULL COMMENT '商品分类',
  `wares_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '商品名称',
  `wares_money` decimal(12, 2) NOT NULL COMMENT '商品需要积分',
  `wares_spec` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '商品规格，大，小，',
  `head_img` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '商品图片',
  `content` text CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '产品介绍',
  `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 下架，1 上架',
  `sort` int(12) NOT NULL DEFAULT 0,
  `is_type` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 积分兑换',
  `create_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = MyISAM AUTO_INCREMENT = 9 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '积分兑换商品表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ntp_common_wares
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_common_wares_order
-- ----------------------------
DROP TABLE IF EXISTS `ntp_common_wares_order`;
CREATE TABLE `ntp_common_wares_order`  (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wares_id` int(11) NOT NULL COMMENT '商品ID',
  `wares_type_id` int(11) NOT NULL COMMENT '分类ID',
  `wares_spec` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '商品规格',
  `head_img` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '商品图片',
  `uid` int(11) NOT NULL COMMENT '用户ID',
  `address_id` int(11) NOT NULL COMMENT '商品购买地址',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '购买地址',
  `wares_money` decimal(12, 2) NOT NULL COMMENT '商品价格',
  `create_time` datetime NULL DEFAULT NULL,
  `wares_no` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '订单号',
  `success_time` datetime NULL DEFAULT NULL COMMENT '收获成功日期',
  `status` tinyint(255) NOT NULL COMMENT '0 下单，1 发货中 2 运输中 3 签收 4 拒签 ',
  `phone` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '联系电话',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `wares_no`(`wares_no`(191)) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '积分兑换记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ntp_common_wares_order
-- ----------------------------

-- ----------------------------
-- Table structure for ntp_money_fanyong_log
-- ----------------------------
DROP TABLE IF EXISTS `ntp_money_fanyong_log`;
CREATE TABLE `ntp_money_fanyong_log`  (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID 主键 自增',
  `user_id` int(11) NOT NULL COMMENT '用户ID',
  `money_amount` decimal(30, 2) NOT NULL COMMENT '返佣金额',
  `money_type` int(11) NOT NULL COMMENT '返佣类型 1一直推返佣 2二级直推返佣 3三级直推返佣',
  `money_type_text` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '返佣类型 文字',
  `is_add_to_user_account` int(11) NOT NULL COMMENT '是否已经添加到用户账户0 否 1 是',
  `remark` varchar(600) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '信息完整备注',
  `user_name` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '用户昵称',
  `create_time` datetime NULL DEFAULT NULL COMMENT '添加时间',
  `update_time` datetime NULL DEFAULT NULL COMMENT '更新到用户账户时间',
  `product_id` int(11) NULL DEFAULT 0 COMMENT '产品ID',
  `product_lev` int(11) NULL DEFAULT 0 COMMENT '产品等级ID',
  `sub_id` int(11) NULL DEFAULT 0 COMMENT '下级ID',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `sel`(`user_id`, `money_type`, `is_add_to_user_account`, `user_name`, `create_time`, `product_id`, `sub_id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '用户返佣表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of ntp_money_fanyong_log
-- ----------------------------

SET FOREIGN_KEY_CHECKS = 1;
