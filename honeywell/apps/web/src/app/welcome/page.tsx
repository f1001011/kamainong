/**
 * @file 官网落地页
 * @description 高端品牌展示页面，参考 lendlease.com 风格
 * 翡翠绿+香槟金配色，全屏英雄区+视差效果+滚动动画
 * 所有图片来源 Unsplash，移动端完美适配
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { m, LazyMotion, domAnimation, useScroll, useTransform, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import {
  RiMenuLine,
  RiCloseLine,
  RiArrowRightLine,
  RiArrowDownSLine,
  RiBuildingLine,
  RiFundsBoxLine,
  RiShieldCheckLine,
  RiGlobalLine,
  RiTeamLine,
  RiLineChartLine,
  RiMapPinLine,
  RiArrowRightUpLine,
  RiInstagramLine,
  RiFacebookCircleLine,
  RiTwitterXLine,
  RiLinkedinBoxLine,
  RiCustomerService2Line,
  RiTimeLine,
  RiAwardLine,
  RiHandHeartLine,
} from '@remixicon/react';

/* ━━━━━━━━━━━━━━━ 图片资源（Unsplash） ━━━━━━━━━━━━━━━ */

const IMG = {
  hero: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80&auto=format&fit=crop',
  about: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80&auto=format&fit=crop',
  investment: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&q=80&auto=format&fit=crop',
  development: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80&auto=format&fit=crop',
  management: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&auto=format&fit=crop',
  project1: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&q=80&auto=format&fit=crop',
  project2: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80&auto=format&fit=crop',
  project3: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80&auto=format&fit=crop',
  project4: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80&auto=format&fit=crop',
  cta: 'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=1920&q=80&auto=format&fit=crop',
  team: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&auto=format&fit=crop',
};

/* ━━━━━━━━━━━━━━━ 数据常量 ━━━━━━━━━━━━━━━ */

const NAV_LINKS = [
  { label: 'الرئيسية', href: '#hero' },
  { label: 'من نحن', href: '#about' },
  { label: 'الخدمات', href: '#services' },
  { label: 'المشاريع', href: '#projects' },
  { label: 'اتصل بنا', href: '#contact' },
];

const SERVICES = [
  {
    icon: RiFundsBoxLine,
    title: 'إدارة الاستثمارات',
    desc: 'إدارة نشطة للمحافظ الدولية، تركز على تحقيق أقصى عوائد مع مخاطر مدروسة لمستثمرينا.',
    img: IMG.investment,
  },
  {
    icon: RiBuildingLine,
    title: 'التطوير العقاري',
    desc: 'نبتكر مشاريع حضرية مستدامة ومباني عالية الجودة تحوّل المجتمعات وتخلق قيمة دائمة.',
    img: IMG.development,
  },
  {
    icon: RiShieldCheckLine,
    title: 'إدارة الأصول',
    desc: 'حماية ونمو ثروتك من خلال استراتيجيات متنوعة وإشراف مهني مستمر.',
    img: IMG.management,
  },
];

const PROJECTS = [
  { title: 'برج متروبوليتان', location: 'الدار البيضاء، المغرب', category: 'سكني', img: IMG.project1 },
  { title: 'مرتفعات الهادئ', location: 'الرباط، المغرب', category: 'متعدد الاستخدامات', img: IMG.project2 },
  { title: 'إقامات ذهبية', location: 'مراكش، المغرب', category: 'سكني', img: IMG.project3 },
  { title: 'مركز الزمرد للأعمال', location: 'طنجة، المغرب', category: 'تجاري', img: IMG.project4 },
];

const STATS = [
  { value: '65+', label: 'سنوات من الخبرة', icon: RiTimeLine },
  { value: '10K+', label: 'مستثمرون نشطون', icon: RiTeamLine },
  { value: '2.5B د.م.', label: 'أصول مُدارة', icon: RiLineChartLine },
  { value: '98%', label: 'رضا العملاء', icon: RiAwardLine },
];

/* ━━━━━━━━━━━━━━━ 导航栏 ━━━━━━━━━━━━━━━ */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const scrollToSection = useCallback((href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <>
      <m.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-2xl shadow-[0_1px_0_rgba(0,0,0,0.06)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/welcome" className="flex items-center gap-2.5 shrink-0">
              <img
                src="/images/logo.png"
                alt="Lendlease"
                className={`h-7 sm:h-8 w-auto transition-all duration-300 ${scrolled ? '' : 'brightness-0 invert'}`}
              />
            </Link>

            {/* 桌面端导航链接 */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${
                    scrolled
                      ? 'text-neutral-600 hover:text-primary-600 hover:bg-primary-50'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className={`hidden sm:inline-flex px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                  scrolled
                    ? 'text-primary-600 hover:bg-primary-50'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                تسجيل الدخول
              </Link>
              <Link
                href="/register"
                className={`hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                  scrolled
                    ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-primary'
                    : 'bg-white text-dark-950 hover:bg-white/90 shadow-lg'
                }`}
              >
                ابدأ الآن
                <RiArrowRightLine className="w-3.5 h-3.5" />
              </Link>

              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setMobileOpen(true)}
                className={`lg:hidden p-2 rounded-full transition-colors ${
                  scrolled ? 'text-neutral-700 hover:bg-neutral-100' : 'text-white hover:bg-white/10'
                }`}
              >
                <RiMenuLine className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </m.nav>

      {/* 移动端全屏菜单 */}
      <AnimatePresence>
        {mobileOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[60] bg-dark-950/95 backdrop-blur-2xl"
          >
            <m.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col h-full px-8 pt-6"
            >
              <div className="flex items-center justify-between">
                <img src="/images/logo.png" alt="Lendlease" className="h-7 w-auto brightness-0 invert" />
                <button onClick={() => setMobileOpen(false)} className="p-2 text-white/60 hover:text-white rounded-full">
                  <RiCloseLine className="w-7 h-7" />
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center gap-2 -mt-16">
                {NAV_LINKS.map((link, i) => (
                  <m.button
                    key={link.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    onClick={() => scrollToSection(link.href)}
                    className="text-left font-heading text-3xl text-white/80 hover:text-white py-3 transition-colors"
                  >
                    {link.label}
                  </m.button>
                ))}
              </div>

              <div className="pb-12 flex flex-col gap-3">
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 w-full py-4 bg-primary-500 text-white font-semibold rounded-2xl text-base"
                  onClick={() => setMobileOpen(false)}
                >
                  إنشاء حساب
                  <RiArrowRightLine className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center w-full py-4 border border-white/20 text-white/80 font-medium rounded-2xl text-base"
                  onClick={() => setMobileOpen(false)}
                >
                  تسجيل الدخول
                </Link>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ━━━━━━━━━━━━━━━ 英雄区 ━━━━━━━━━━━━━━━ */

function HeroSection() {
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 800], [0, 200]);
  const contentY = useTransform(scrollY, [0, 600], [0, -60]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* 背景图片 + 视差 */}
      <m.div className="absolute inset-0" style={{ y: imgY }}>
        <img
          src={IMG.hero}
          alt=""
          className="absolute inset-0 w-full h-[120%] object-cover"
          loading="eager"
          decoding="async"
        />
      </m.div>

      {/* 多层渐变遮罩 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950/70 via-dark-950/50 to-dark-950/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/60 via-transparent to-transparent" />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 70% 60%, rgba(var(--color-primary-rgb), 0.1) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* 装饰元素 */}
      <div className="absolute top-1/4 right-[10%] w-px h-32 bg-gradient-to-b from-transparent via-gold-400/20 to-transparent hidden lg:block" />
      <div className="absolute bottom-1/3 left-[8%] w-px h-24 bg-gradient-to-b from-transparent via-primary-400/20 to-transparent hidden lg:block" />

      {/* 内容 */}
      <m.div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 w-full" style={{ y: contentY, opacity }}>
        <div className="max-w-3xl pt-24 sm:pt-32">
          {/* 标签 */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/8 border border-white/10 backdrop-blur-sm mb-6 sm:mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-white/60 tracking-wider uppercase">
              استثمارات عقارية موثوقة
            </span>
          </m.div>

          {/* 主标题 */}
          <m.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.08] tracking-tight"
          >
            استثمارات{' '}
            <span className="relative inline-block">
              <span className="text-gradient-shine">تبني</span>
            </span>
            <br />
            مستقبلك
          </m.h1>

          {/* 金色分割线 */}
          <m.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="w-20 sm:w-28 h-[2px] bg-gradient-to-r from-gold-400 to-gold-600 mt-6 sm:mt-8 origin-left"
          />

          {/* 副标题 */}
          <m.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-base sm:text-lg lg:text-xl text-white/50 mt-5 sm:mt-6 max-w-xl leading-relaxed font-light"
          >
            مع أكثر من 65 عاماً من الخبرة العالمية، تحوّل Lendlease مشهد الاستثمار
            العقاري بالشفافية والربحية والثقة.
          </m.p>

          {/* CTA 按钮 */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 sm:mt-10"
          >
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-primary-500 text-white font-semibold rounded-xl text-base transition-all duration-300 hover:bg-primary-400 shadow-primary-lg hover:shadow-primary-xl hover:-translate-y-0.5"
            >
              ابدأ الآن
              <RiArrowRightLine className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white/80 font-medium rounded-xl text-base transition-all duration-300 hover:bg-white/8 hover:border-white/30 hover:text-white backdrop-blur-sm"
            >
              تسجيل الدخول
            </Link>
          </m.div>
        </div>
      </m.div>

      {/* 底部滚动指示器 */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-white/30 tracking-widest uppercase">↓</span>
        <m.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <RiArrowDownSLine className="w-5 h-5 text-white/30" />
        </m.div>
      </m.div>

      {/* 底部金色渐变线 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent z-10" />
    </section>
  );
}

/* ━━━━━━━━━━━━━━━ 关于我们 ━━━━━━━━━━━━━━━ */

function AboutSection() {
  return (
    <section id="about" className="relative py-20 sm:py-28 lg:py-36 bg-neutral-50 overflow-hidden">
      {/* 微妙背景纹理 */}
      <div className="absolute inset-0 pattern-dots-emerald opacity-40" />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* 左侧文字 */}
          <m.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 mb-5">
              <RiGlobalLine className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-semibold text-primary-600 tracking-wider uppercase">من نحن</span>
            </div>

            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-dark-950 leading-tight">
              نحن Lendlease
            </h2>

            <div className="w-16 h-[2px] bg-gradient-to-r from-gold-400 to-gold-600 mt-5 mb-6" />

            <p className="text-neutral-600 text-base sm:text-lg leading-relaxed">
              Lendlease شركة رائدة في الاستثمار العقاري بثلاث قدرات أساسية:
              <strong className="text-dark-950"> الاستثمارات، التطوير وإدارة الأصول</strong>.
            </p>
            <p className="text-neutral-500 text-base sm:text-lg leading-relaxed mt-4">
              نستفيد من هذه الخبرة لخلق قيمة لشركائنا وعملائنا والمجتمعات
              التي نطوّر فيها مشاريعنا. على مدار أكثر من 65 عاماً، بنينا شراكات تحقق
              نتائج استثمارية استثنائية.
            </p>

            <Link
              href="/register"
              className="group inline-flex items-center gap-2 mt-8 text-primary-600 font-semibold text-base hover:text-primary-700 transition-colors"
            >
              اعرف المزيد عنا
              <RiArrowRightUpLine className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </m.div>

          {/* 右侧图片 */}
          <m.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-soft-xl">
              <img
                src={IMG.about}
                alt="مكتب حديث"
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/30 via-transparent to-transparent" />
            </div>

            {/* 浮动统计卡片 */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 -left-4 sm:-left-8 glass-heavy rounded-xl p-4 sm:p-5 shadow-soft-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
                  <RiHandHeartLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-dark-950 font-heading">65+</p>
                  <p className="text-xs text-neutral-500">سنوات من الثقة</p>
                </div>
              </div>
            </m.div>

            {/* 右上角装饰 */}
            <div className="absolute -top-3 -right-3 w-24 h-24 rounded-full border border-gold-200/50 pointer-events-none" />
            <div className="absolute -top-1.5 -right-1.5 w-16 h-16 rounded-full border border-primary-200/30 pointer-events-none" />
          </m.div>
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━ 服务能力 ━━━━━━━━━━━━━━━ */

function ServicesSection() {
  return (
    <section id="services" className="relative py-20 sm:py-28 lg:py-36 bg-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* 标题 */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-50 border border-gold-100 mb-5">
            <RiBuildingLine className="w-3.5 h-3.5 text-gold-600" />
            <span className="text-xs font-semibold text-gold-700 tracking-wider uppercase">خدماتنا</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-dark-950 leading-tight">
            ثلاث قدرات، هدف واحد
          </h2>
          <div className="w-16 h-[2px] bg-gradient-to-r from-gold-400 to-gold-600 mx-auto mt-5 mb-5" />
          <p className="text-neutral-500 text-base sm:text-lg">
            ندمج الاستثمارات والتطوير والإدارة لتقديم نتائج استثنائية
            لكل مستثمر من مستثمرينا.
          </p>
        </m.div>

        {/* 服务卡片 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {SERVICES.map((service, i) => (
            <m.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="group relative bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:border-primary-100 transition-all duration-500 hover:shadow-soft-lg"
            >
              {/* 卡片图片 */}
              <div className="relative h-52 sm:h-56 overflow-hidden">
                <img
                  src={service.img}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/50 to-transparent" />
                <div className="absolute bottom-4 left-4 w-11 h-11 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-soft">
                  <service.icon className="w-5.5 h-5.5 text-primary-600" />
                </div>
              </div>

              {/* 卡片内容 */}
              <div className="p-5 sm:p-6">
                <h3 className="font-heading text-xl sm:text-[22px] text-dark-950 mb-2.5">{service.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{service.desc}</p>
                <div className="mt-5 pt-4 border-t border-neutral-100">
                  <span className="group/link inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer">
                    اعرف المزيد
                    <RiArrowRightLine className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
                  </span>
                </div>
              </div>

              {/* 顶部金色装饰线 */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary-400 via-gold-400 to-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━ 数据统计 ━━━━━━━━━━━━━━━ */

function StatsSection() {
  return (
    <section className="relative py-16 sm:py-24 overflow-hidden">
      {/* 深色翡翠背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-primary-900" />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 50% 80% at 80% 20%, rgba(var(--color-primary-rgb), 0.15) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 40% 60% at 20% 80%, rgba(var(--color-gold-rgb), 0.08) 0%, transparent 60%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {STATS.map((stat, i) => (
            <m.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-5 h-5 text-gold-400" />
              </div>
              <p className="font-heading text-3xl sm:text-4xl lg:text-5xl text-white mb-1.5">{stat.value}</p>
              <p className="text-sm sm:text-base text-white/40 font-light">{stat.label}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━ 精选项目 ━━━━━━━━━━━━━━━ */

function ProjectsSection() {
  return (
    <section id="projects" className="relative py-20 sm:py-28 lg:py-36 bg-neutral-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* 标题 */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12 sm:mb-16"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 mb-5">
              <RiMapPinLine className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs font-semibold text-primary-600 tracking-wider uppercase">المحفظة</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-dark-950 leading-tight">
              مشاريع مميزة
            </h2>
            <div className="w-16 h-[2px] bg-gradient-to-r from-gold-400 to-gold-600 mt-5" />
          </div>
          <Link
            href="/register"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors shrink-0"
          >
            عرض جميع المشاريع
            <RiArrowRightLine className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </m.div>

        {/* 项目网格 — 桌面端第一行大+小，第二行小+大 */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
          {PROJECTS.map((project, i) => (
            <m.div
              key={project.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer ${
                i === 0 || i === 3 ? 'sm:row-span-1 aspect-[4/3] sm:aspect-auto sm:h-full' : 'aspect-[4/3]'
              }`}
              style={{ minHeight: i === 0 || i === 3 ? undefined : undefined }}
            >
              <img
                src={project.img}
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
                decoding="async"
              />
              {/* 遮罩 */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-950/70 via-dark-950/10 to-transparent transition-opacity duration-500" />

              {/* 标签 */}
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center px-3 py-1 bg-white/15 backdrop-blur-md border border-white/10 rounded-full text-xs font-medium text-white">
                  {project.category}
                </span>
              </div>

              {/* 信息 */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <h3 className="font-heading text-xl sm:text-2xl text-white mb-1">{project.title}</h3>
                <div className="flex items-center gap-1.5 text-white/50 text-sm">
                  <RiMapPinLine className="w-3.5 h-3.5" />
                  <span>{project.location}</span>
                </div>
              </div>

              {/* Hover 箭头 */}
              <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/0 group-hover:bg-white flex items-center justify-center transition-all duration-500 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0">
                <RiArrowRightUpLine className="w-4.5 h-4.5 text-dark-950" />
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━ 信任背书 ━━━━━━━━━━━━━━━ */

function TrustSection() {
  const features = [
    { icon: RiShieldCheckLine, title: 'أمان مضمون', desc: 'أموال محمية بتقنية التشفير البنكي ومراجعات دورية.' },
    { icon: RiLineChartLine, title: 'ربحية مثبتة', desc: 'سجل ثابت من العوائد الأعلى من متوسط السوق.' },
    { icon: RiCustomerService2Line, title: 'دعم على مدار الساعة', desc: 'فريق من الخبراء متاح في كل الأوقات لمساعدتك.' },
    { icon: RiGlobalLine, title: 'حضور عالمي', desc: 'عمليات في أكثر من 40 دولة بمعرفة محلية عميقة.' },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-white overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* 左侧图片 */}
          <m.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-soft-xl">
              <img
                src={IMG.team}
                alt="فريق محترف"
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/20 to-transparent" />
            </div>

            {/* 评分浮窗 */}
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="absolute -bottom-5 -right-3 sm:-right-6 glass-heavy rounded-xl p-4 shadow-soft-lg"
            >
              <div className="flex items-center gap-2 mb-1.5">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-xs text-neutral-500">تقييم المستثمرين</p>
              <p className="text-lg font-bold text-dark-950">4.9/5.0</p>
            </m.div>
          </m.div>

          {/* 右侧特性列表 */}
          <div className="order-1 lg:order-2">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-dark-950 leading-tight">
                لماذا تختارنا؟
              </h2>
              <div className="w-16 h-[2px] bg-gradient-to-r from-gold-400 to-gold-600 mt-5 mb-8" />
            </m.div>

            <div className="space-y-5">
              {features.map((feat, i) => (
                <m.div
                  key={feat.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-4 p-4 rounded-xl hover:bg-neutral-50 transition-colors duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                    <feat.icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-dark-950 text-base mb-1">{feat.title}</h4>
                    <p className="text-sm text-neutral-500 leading-relaxed">{feat.desc}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━ CTA 行动号召 ━━━━━━━━━━━━━━━ */

function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden">
      {/* 背景图 */}
      <img
        src={IMG.cta}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-dark-950/75" />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(var(--color-primary-rgb), 0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-white leading-tight">
            ابدأ رحلتك الاستثمارية اليوم
          </h2>
          <div className="w-16 h-[2px] bg-gradient-to-r from-gold-400 to-gold-600 mx-auto mt-6 mb-5" />
          <p className="text-base sm:text-lg text-white/50 max-w-xl mx-auto leading-relaxed">
            انضم إلى أكثر من 10,000 مستثمر يثقون في Lendlease لبناء
            ثروتهم بأمان وربحية مثبتة.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-10">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-primary-500 text-white font-semibold rounded-xl text-base transition-all duration-300 hover:bg-primary-400 shadow-primary-lg hover:shadow-primary-xl hover:-translate-y-0.5"
            >
              إنشاء حساب مجاني
              <RiArrowRightLine className="w-4.5 h-4.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 border border-white/20 text-white/80 font-medium rounded-xl text-base transition-all duration-300 hover:bg-white/8 hover:border-white/30 hover:text-white backdrop-blur-sm"
            >
              لدي حساب بالفعل
            </Link>
          </div>
        </m.div>
      </div>
    </section>
  );
}

/* ━━━━━━━━━━━━━━━ 页脚 ━━━━━━━━━━━━━━━ */

function Footer() {
  const linkGroups = [
    {
      title: 'الشركة',
      links: ['من نحن', 'فريقنا', 'وظائف', 'اتصل بنا'],
    },
    {
      title: 'الاستثمارات',
      links: ['المحفظة', 'الاستراتيجيات', 'العوائد', 'أسئلة شائعة'],
    },
    {
      title: 'قانوني',
      links: ['شروط الاستخدام', 'الخصوصية', 'ملفات تعريف الارتباط', 'اللوائح'],
    },
  ];

  return (
    <footer id="contact" className="relative bg-dark-950 overflow-hidden">
      {/* 顶部金色线 */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />

      {/* 装饰光晕 */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(var(--color-primary-rgb), 0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 sm:pt-20 pb-8">
        {/* 上部分 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/8">
          {/* Logo + 描述 */}
          <div className="lg:col-span-2">
            <img src="/images/logo.png" alt="Lendlease" className="h-8 w-auto brightness-0 invert mb-4" />
            <p className="text-sm text-white/30 leading-relaxed max-w-sm">
              Lendlease شركة رائدة عالمياً في الاستثمار العقاري،
              ملتزمة بخلق قيمة مستدامة ونتائج استثنائية لمستثمرينا.
            </p>
            <div className="flex gap-3 mt-6">
              {[RiInstagramLine, RiFacebookCircleLine, RiTwitterXLine, RiLinkedinBoxLine].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4 text-white/40" />
                </a>
              ))}
            </div>
          </div>

          {/* 链接列 */}
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-white/70 mb-4 tracking-wider uppercase">{group.title}</h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-white/30 hover:text-white/60 transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 底部 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Lendlease Corporation. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
            <span className="text-xs text-white/30">الدار البيضاء، المغرب</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ━━━━━━━━━━━━━━━ 主页面 ━━━━━━━━━━━━━━━ */

export default function WelcomePage() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="relative bg-neutral-50">
        <Navbar />
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <StatsSection />
        <ProjectsSection />
        <TrustSection />
        <CTASection />
        <Footer />
      </div>
    </LazyMotion>
  );
}
