/**
 * @file 首页组件统一导出
 */

export { HomeHeader, type HomeHeaderProps, type HeaderUserInfo } from './home-header';
export { HomeBanner, type HomeBannerProps, type BannerItem } from './home-banner';
export { HomeBalanceCard, type HomeBalanceCardProps, type BalanceData } from './home-balance-card';
export { HomeInvestmentCard, type HomeInvestmentCardProps, type PositionSummary } from './home-investment-card';
export { HomeSigninCard, type HomeSigninCardProps } from './home-signin-card';
export { HomeTeamCard, type HomeTeamCardProps, type TeamStats } from './home-team-card';
export { HomeQuickNav, type HomeQuickNavProps, type QuickEntryItem } from './home-quick-nav';
export { HomeProductRecommend, type HomeProductRecommendProps } from './home-product-recommend';
export { HomePropertyGallery, type HomePropertyGalleryProps } from './home-property-gallery';
export {
  HomeAnnouncementModal,
  isAnnouncementDismissed,
  type HomeAnnouncementModalProps,
  type AnnouncementData,
} from './home-announcement-modal';
