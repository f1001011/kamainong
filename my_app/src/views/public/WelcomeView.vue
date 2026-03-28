<template>
  <div class="welcome-page">
    <header class="welcome-nav" :class="{ elevated: scrolled }">
      <div class="welcome-brand">
        <div class="brand-mark">L</div>
        <span>lendlease</span>
      </div>

      <nav class="welcome-links">
        <button v-for="item in navLinks" :key="item.href" @click="scrollTo(item.href)">
          {{ item.label }}
        </button>
      </nav>

      <div class="welcome-actions">
        <button class="ghost-btn" @click="router.push('/login')">تسجيل الدخول</button>
        <button class="solid-btn" @click="router.push('/register')">ابدأ الآن</button>
      </div>
    </header>

    <section
      id="hero"
      class="hero-section"
      :style="{ backgroundImage: `linear-gradient(140deg, rgba(3, 22, 14, 0.94), rgba(13, 107, 61, 0.82)), url(${welcomeHeroImage})` }"
    >
      <div class="hero-backdrop"></div>
      <div class="hero-content">
        <p class="eyebrow">ARCHITECTURAL WEALTH</p>
        <h1>نصمم استثمارات أكثر ثباتا ووضوحا للمستقبل.</h1>
        <p class="hero-copy">
          منصة استثمارية بطابع مؤسسي فاخر، تمزج بين الانضباط المالي، إدارة الأصول،
          والتجربة الرقمية السلسة للمستخدم العربي.
        </p>
        <div class="hero-actions">
          <button class="solid-btn large" @click="router.push('/register')">إنشاء حساب</button>
          <button class="ghost-btn light large" @click="scrollTo('#projects')">استكشف المشاريع</button>
        </div>
      </div>
      <div class="hero-stats">
        <article v-for="stat in stats" :key="stat.label" class="stat-card">
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.label }}</span>
        </article>
      </div>
    </section>

    <section id="about" class="story-section content-shell">
      <div>
        <p class="section-kicker">من نحن</p>
        <h2>منصة عربية بروح مؤسسية عالمية.</h2>
      </div>
      <p>
        نستند إلى تصور Honeywell الأصلي لواجهة استثمارية فاخرة، لكننا نعيد بناءها
        هنا داخل `my_app` على شكل Vue، مع الحفاظ على الإحساس الهادئ، النبرات الذهبية،
        والهيكل التحريري الواضح.
      </p>
    </section>

    <section id="services" class="services-section content-shell">
      <div class="section-head">
        <p class="section-kicker">الخدمات</p>
        <h2>ثلاثة مسارات رئيسية لصناعة الثقة والنمو.</h2>
      </div>
      <div class="services-grid">
        <article v-for="service in services" :key="service.title" class="service-card">
          <div class="service-icon">{{ service.icon }}</div>
          <h3>{{ service.title }}</h3>
          <p>{{ service.desc }}</p>
        </article>
      </div>
    </section>

    <section id="projects" class="projects-section content-shell">
      <div class="section-head">
        <p class="section-kicker">المشاريع</p>
        <h2>واجهة تسويقية تعكس الطابع العقاري الراقي.</h2>
      </div>
      <div class="projects-grid">
        <article v-for="project in projects" :key="project.title" class="project-card">
          <div class="project-image" :style="{ backgroundImage: `url(${project.image})` }"></div>
          <div class="project-body">
            <span>{{ project.category }}</span>
            <h3>{{ project.title }}</h3>
            <p>{{ project.location }}</p>
          </div>
        </article>
      </div>
    </section>

    <section id="contact" class="cta-section content-shell">
      <div>
        <p class="section-kicker">ابدأ الآن</p>
        <h2>حوّل الزائر إلى مستخدم مسجل بخطوة واحدة واضحة.</h2>
      </div>
      <div class="cta-actions">
        <button class="solid-btn large" @click="router.push('/register')">إنشاء حساب جديد</button>
        <button class="ghost-btn large" @click="router.push('/login')">لدي حساب بالفعل</button>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const scrolled = ref(false)
const welcomeHeroImage = '/worldcup/welcome/welcome-hero.svg'

const navLinks = [
  { label: 'الرئيسية', href: '#hero' },
  { label: 'من نحن', href: '#about' },
  { label: 'الخدمات', href: '#services' },
  { label: 'المشاريع', href: '#projects' },
  { label: 'تواصل', href: '#contact' },
]

const stats = [
  { value: '65+', label: 'سنوات خبرة' },
  { value: '10K+', label: 'مستثمر نشط' },
  { value: '2.5B', label: 'أصول تحت الإدارة' },
  { value: '98%', label: 'رضا العملاء' },
]

const services = [
  { icon: '01', title: 'إدارة الاستثمارات', desc: 'محافظ منضبطة، بيانات أوضح، وتجربة رقمية مصممة لرفع الثقة.' },
  { icon: '02', title: 'التطوير العقاري', desc: 'لغة بصرية راقية تضع المشاريع والعوائد في واجهة واحدة سهلة الفهم.' },
  { icon: '03', title: 'إدارة الأصول', desc: 'لوحات معلومات، تدرج هرمي بصري، ومسارات استخدام عالية الوضوح.' },
]

const projects = [
  { title: 'برج متروبوليتان', category: 'سكني', location: 'الدار البيضاء، المغرب', image: '/worldcup/welcome/welcome-project-01.svg' },
  { title: 'مرتفعات الهادئ', category: 'متعدد الاستخدامات', location: 'الرباط، المغرب', image: '/worldcup/welcome/welcome-project-02.svg' },
  { title: 'مركز الزمرد للأعمال', category: 'تجاري', location: 'طنجة، المغرب', image: '/worldcup/welcome/welcome-project-03.svg' },
]

function scrollTo(selector: string) {
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function handleScroll() {
  scrolled.value = window.scrollY > 40
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<style scoped>
.welcome-page {
  color: #17392a;
}

.welcome-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 28px;
  transition: all 0.25s ease;
}

.welcome-nav.elevated {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(20px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
}

.welcome-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-size: 19px;
  font-weight: 700;
}

.welcome-nav.elevated .welcome-brand {
  color: #17392a;
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #d0ac73, #8f6c3a);
  color: #111;
  font-weight: 800;
}

.welcome-links,
.welcome-actions,
.hero-actions,
.cta-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.welcome-links button,
.ghost-btn,
.solid-btn {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.welcome-links button {
  padding: 10px 14px;
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
}

.welcome-nav.elevated .welcome-links button {
  color: rgba(23, 57, 42, 0.72);
}

.ghost-btn,
.solid-btn {
  border-radius: 999px;
  padding: 12px 20px;
  font-weight: 700;
}

.ghost-btn {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.ghost-btn.light {
  background: rgba(255, 255, 255, 0.18);
}

.solid-btn {
  background: linear-gradient(135deg, #0d6b3d, #15834b);
  color: #fff;
  box-shadow: 0 12px 30px rgba(13, 107, 61, 0.2);
}

.large {
  padding: 15px 24px;
}

.hero-section {
  position: relative;
  min-height: 100vh;
  padding: 120px 28px 48px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 28px;
  align-items: end;
  background-position: center;
  background-size: cover;
}

.hero-backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(201, 169, 110, 0.14), transparent 30%);
}

.hero-content,
.hero-stats {
  position: relative;
  z-index: 1;
}

.eyebrow,
.section-kicker {
  margin-bottom: 14px;
  color: #d0ac73;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 700;
}

.hero-content h1,
.story-section h2,
.section-head h2,
.cta-section h2 {
  margin: 0;
  color: #fff;
  font-size: clamp(42px, 6vw, 78px);
  line-height: 1.04;
  max-width: 760px;
}

.hero-copy {
  margin: 20px 0 0;
  max-width: 640px;
  color: rgba(255, 255, 255, 0.76);
  line-height: 1.9;
  font-size: 17px;
}

.hero-actions {
  margin-top: 32px;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.stat-card,
.service-card,
.project-card,
.cta-section,
.story-section {
  border-radius: 28px;
}

.stat-card {
  padding: 22px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(18px);
  color: #fff;
}

.stat-card strong {
  display: block;
  font-size: 34px;
  margin-bottom: 8px;
}

.stat-card span {
  color: rgba(255, 255, 255, 0.72);
  font-size: 14px;
}

.content-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 92px 28px;
}

.story-section {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 28px;
  background: #fff;
  margin-top: -52px;
  box-shadow: 0 40px 60px rgba(0, 0, 0, 0.08);
}

.story-section h2,
.section-head h2,
.cta-section h2 {
  color: #17392a;
  font-size: clamp(28px, 4vw, 48px);
}

.story-section p,
.service-card p,
.project-body p {
  color: rgba(23, 57, 42, 0.68);
  line-height: 1.9;
  font-size: 16px;
}

.services-grid,
.projects-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 28px;
}

.service-card {
  padding: 24px;
  background: linear-gradient(180deg, #fff, #f3efe6);
  box-shadow: inset 0 0 0 1px rgba(208, 172, 115, 0.12);
}

.service-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(208, 172, 115, 0.18), rgba(13, 107, 61, 0.1));
  color: #8f6c3a;
  font-weight: 800;
}

.service-card h3,
.project-body h3 {
  margin: 0 0 10px;
  font-size: 22px;
  color: #17392a;
}

.project-card {
  overflow: hidden;
  background: #fff;
  box-shadow: 0 22px 50px rgba(0, 0, 0, 0.08);
}

.project-image {
  height: 280px;
  background-size: cover;
  background-position: center;
}

.project-body {
  padding: 22px;
}

.project-body span {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(13, 107, 61, 0.08);
  color: #0d6b3d;
  font-size: 12px;
  font-weight: 700;
}

.cta-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  margin-bottom: 72px;
  background: linear-gradient(135deg, #17392a, #0d6b3d);
  color: #fff;
}

.cta-section .section-kicker,
.cta-section h2 {
  color: #fff;
}

@media (max-width: 960px) {
  .hero-section,
  .story-section,
  .cta-section,
  .services-grid,
  .projects-grid {
    grid-template-columns: 1fr;
  }

  .welcome-links {
    display: none;
  }
}

@media (max-width: 640px) {
  .welcome-nav {
    padding: 14px 16px;
  }

  .welcome-actions {
    display: none;
  }

  .hero-section,
  .content-shell {
    padding-left: 16px;
    padding-right: 16px;
  }

  .hero-stats {
    grid-template-columns: 1fr;
  }
}
</style>
