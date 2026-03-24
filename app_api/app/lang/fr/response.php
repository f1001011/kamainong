<?php

/**
 * 统一响应状态码定义
 */
return [
    // 通用错误码 (1000-1999)
    'SYSTEM_ERROR' => ['code' => 1001, 'message' => 'Erreur système'],
    'INVALID_PARAMS' => ['code' => 1002, 'message' => 'Paramètres invalides'],
    'UNAUTHORIZED' => ['code' => 1003, 'message' => 'Non autorisé'],
    'FORBIDDEN' => ['code' => 1004, 'message' => 'Accès refusé'],
    'NOT_FOUND' => ['code' => 1005, 'message' => 'Non trouvé'],
    'SERVER_ERROR' => ['code' => 1006, 'message' => 'Erreur serveur'],
    
    // 认证错误码 (2000-2999)
    'INVALID_TOKEN' => ['code' => 2001, 'message' => 'Jeton invalide'],
    'TOKEN_EXPIRED' => ['code' => 2002, 'message' => 'Jeton expiré'],
    'INVALID_CREDENTIALS' => ['code' => 2003, 'message' => 'Identifiants invalides'],
    'INVALID_PHONE' => ['code' => 2004, 'message' => 'Numéro de téléphone invalide'],
    'PHONE_EXISTS' => ['code' => 2005, 'message' => 'Numéro de téléphone existe déjà'],
    'WEAK_PASSWORD' => ['code' => 2006, 'message' => 'Mot de passe trop faible'],
    
    // 用户错误码 (3000-3999)
    'USER_NOT_FOUND' => ['code' => 3001, 'message' => 'Utilisateur non trouvé'],
    'BALANCE_INSUFFICIENT' => ['code' => 3002, 'message' => 'Solde insuffisant'],
    'ACCOUNT_FROZEN' => ['code' => 3003, 'message' => 'Compte gelé'],
    
    // 产品错误码 (4000-4999)
    'PRODUCT_NOT_FOUND' => ['code' => 4001, 'message' => 'Produit non trouvé'],
    'PRODUCT_OFF_SALE' => ['code' => 4002, 'message' => 'Produit épuisé'],
    'PURCHASE_LIMIT' => ['code' => 4003, 'message' => 'Limite d\'achat atteinte'],
    'BELOW_MINIMUM_AMOUNT' => ['code' => 4004, 'message' => 'Montant inférieur au minimum requis'],
    
    // 订单错误码 (5000-5999)
    'ORDER_NOT_FOUND' => ['code' => 5001, 'message' => 'Commande non trouvée'],
    'ORDER_CANNOT_CANCEL' => ['code' => 5002, 'message' => 'Commande ne peut pas être annulée'],
    'INCOME_NOT_AVAILABLE' => ['code' => 5003, 'message' => 'Revenu non disponible'],
    'INCOME_ALREADY_CLAIMED' => ['code' => 5004, 'message' => 'Revenu déjà réclamé'],
    'INCOME_EXPIRED' => ['code' => 5005, 'message' => 'Revenu expiré'],
    
    // 充值错误码 (6000-6999)
    'RECHARGE_NOT_FOUND' => ['code' => 6001, 'message' => 'Recharge non trouvée'],
    'RECHARGE_ALREADY_PAID' => ['code' => 6002, 'message' => 'Recharge déjà payée'],
    'RECHARGE_MINIMUM' => ['code' => 6003, 'message' => 'Montant minimum de recharge: {min} XAF'],
    
    // 提现错误码 (7000-7999)
    'WITHDRAW_NOT_FOUND' => ['code' => 7001, 'message' => 'Retrait non trouvé'],
    'WITHDRAW_OUTSIDE_TIME' => ['code' => 7002, 'message' => 'Retrait uniquement entre 10h et 18h'],
    'WITHDRAW_DAILY_LIMIT' => ['code' => 7003, 'message' => 'Limite de retrait quotidien atteinte'],
    'WITHDRAW_REQUIREMENT' => ['code' => 7004, 'message' => 'Vous devez effectuer un achat pour retirer'],
    'WITHDRAW_MINIMUM' => ['code' => 7005, 'message' => 'Montant minimum de retrait: {min} XAF'],
    
    // VIP错误码 (8000-8999)
    'VIP_NOT_QUALIFIED' => ['code' => 8001, 'message' => 'Non qualifié pour ce niveau VIP'],
    'VIP_REWARD_CLAIMED' => ['code' => 8002, 'message' => 'Récompense VIP déjà réclamée aujourd\'hui'],
    
    // 任务错误码 (9000-9999)
    'TASK_NOT_COMPLETED' => ['code' => 9001, 'message' => 'Tâche non terminée'],
    'TASK_ALREADY_CLAIMED' => ['code' => 9002, 'message' => 'Récompense déjà réclamée'],
    
    // 转盘错误码 (10000-10999)
    'LOTTERY_NO_CHANCE' => ['code' => 10001, 'message' => 'Pas de chance disponible'],
    'LOTTERY_DAILY_LIMIT' => ['code' => 10002, 'message' => 'Limite de rotation quotidienne atteinte'],
    
    // 礼品码错误码 (11000-11999)
    'GIFT_CODE_INVALID' => ['code' => 11001, 'message' => 'Code cadeau invalide'],
    'GIFT_CODE_USED' => ['code' => 11002, 'message' => 'Code cadeau déjà utilisé'],
    'GIFT_CODE_EXPIRED' => ['code' => 11003, 'message' => 'Code cadeau expiré'],
    
    // 签到错误码 (12000-12999)
    'SIGNIN_ALREADY' => ['code' => 12001, 'message' => 'Déjà connecté aujourd\'hui'],
    
    // 社区错误码 (13000-13999)
    'POST_NOT_FOUND' => ['code' => 13001, 'message' => 'Publication non trouvée'],
    'COMMENT_TOO_LONG' => ['code' => 13002, 'message' => 'Commentaire trop long'],
];
