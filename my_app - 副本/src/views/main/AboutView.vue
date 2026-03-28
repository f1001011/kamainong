<template>
  <div class="about-page">
    <header class="about-header">
      <button class="back-btn" @click="router.back()">‹</button>
      <span>من نحن</span>
    </header>

    <section class="about-hero">
      <div class="about-hero-copy">
        <p class="section-kicker">Corporate Prestige</p>
        <h1>واجهة تعريفية مؤسسية بروح Honeywell ولكن بلغة Vue.</h1>
        <p>
          هذه الصفحة تنقل إحساس Honeywell عن الثقة، الأصول، والوضوح المؤسسي،
          مع بنية قابلة للاستمرار داخل `my_app` بدلا من الاعتماد على Next.js.
        </p>
      </div>
    </section>

    <main class="about-content">
      <section v-for="section in sections" :key="section.title" class="content-card">
        <div class="content-grid">
          <div>
            <p class="section-kicker">{{ section.kicker }}</p>
            <h2>{{ section.title }}</h2>
          </div>
          <p>{{ section.body }}</p>
        </div>
      </section>

      <footer class="about-footer">
        <span>Vue Migration Edition</span>
      </footer>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const sections = [
  {
    kicker: 'Vision',
    title: 'نبني تجربة استثمارية ذات حضور بصري راق.',
    body: 'تعتمد النسخة الأصلية على نبرة مؤسسية فاخرة، صور واسعة، وأقسام تحريرية طويلة. في Vue نحافظ على نفس السرد لكن داخل بنية أخف وأكثر وضوحا.',
  },
  {
    kicker: 'Design System',
    title: 'اللون الأخضر العميق والذهب ليسا زينة فقط.',
    body: 'الهوية البصرية في Honeywell تعتمد على الأخضر الداكن والذهبي لتوصيل الثبات والهيبة. لذلك يستمر هذا المزج في صفحات Vue الجديدة مع بطاقات بيضاء ومسافات مريحة.',
  },
  {
    kicker: 'Migration',
    title: 'كل صفحة تتحول بالتتابع مع الحفاظ على المسارات.',
    body: 'الهجرة لا تتم كنسخ عشوائي. يتم تثبيت وثيقة مسارات، ثم إعادة بناء كل صفحة داخل `my_app`، ثم حذف النسخة القديمة فقط بعد نجاح البناء والتحقق.',
  },
]
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f7f5ef 0%, #ffffff 40%);
}

.about-header {
  position: sticky;
  top: 0;
  z-index: 15;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.back-btn {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: rgba(13, 107, 61, 0.08);
  color: #17392a;
  font-size: 28px;
}

.about-header span {
  color: #17392a;
  font-size: 16px;
  font-weight: 700;
}

.about-hero {
  padding: 42px 18px 18px;
}

.about-hero-copy {
  max-width: 980px;
  margin: 0 auto;
  padding: 32px;
  border-radius: 32px;
  color: #fff;
  background: linear-gradient(135deg, #12261c 0%, #0d6b3d 100%);
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.12);
}

.section-kicker {
  margin: 0 0 10px;
  color: #d0ac73;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
}

.about-hero-copy h1,
.content-card h2 {
  margin: 0;
  line-height: 1.15;
}

.about-hero-copy h1 {
  font-size: clamp(28px, 5vw, 48px);
}

.about-hero-copy p:last-child,
.content-card p:last-child {
  margin: 16px 0 0;
  line-height: 1.9;
}

.about-content {
  max-width: 980px;
  margin: 0 auto;
  padding: 0 18px 96px;
}

.content-card {
  margin-top: 18px;
  padding: 26px;
  border-radius: 28px;
  background: #fff;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.06);
}

.content-grid {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 28px;
}

.content-card h2 {
  color: #17392a;
  font-size: clamp(24px, 4vw, 38px);
}

.content-card p:last-child {
  color: rgba(23, 57, 42, 0.68);
  font-size: 16px;
}

.about-footer {
  padding: 28px 0 6px;
  text-align: center;
}

.about-footer span {
  color: rgba(23, 57, 42, 0.38);
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

@media (max-width: 760px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .about-hero,
  .about-content {
    padding-left: 14px;
    padding-right: 14px;
  }
}
</style>
