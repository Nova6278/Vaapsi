export default function PrivacyPage() {
  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-xl font-bold mb-2" style={{ color: '#f0f2f5' }}>Privacy Policy</h1>
        <p className="text-xs mb-8" style={{ color: '#4a5068' }}>Last updated: May 2026</p>

        <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: '#8b92a5' }}>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>1. What We Collect</h2>
            <p>When you sign up, we collect your KIIT email address and display name. When you use the platform, we store your posts, claims, verification answers, uploaded images, handoff messages, and notification history. We also collect basic usage data through Vercel Analytics (page views, referrers — no personal identifiers).</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>2. How We Use Your Data</h2>
            <p>Your data is used solely to operate Vaapsi: displaying posts, processing claims, sending notifications, coordinating handoffs, and improving the platform. We do not sell, rent, or share your personal information with third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>3. Data Storage</h2>
            <p>All data is stored on Supabase (hosted on AWS). Post images are stored in Supabase Storage. Claim proof images are stored in a private bucket — only the post owner can view them via time-limited signed URLs. Your password is hashed by Supabase Auth and never stored in plain text.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>4. Data Retention</h2>
            <p>Your data is retained as long as your account is active. Posts marked as resolved are preserved for statistics but hidden from the public feed. If you wish to delete your account or data, contact us and we will process your request.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>5. Cookies</h2>
            <p>Vaapsi uses essential cookies for authentication (Supabase session tokens). We do not use advertising or tracking cookies. Vercel Analytics uses privacy-friendly, cookieless tracking.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>6. Security</h2>
            <p>We implement rate limiting, CSRF protection, input sanitization, magic byte file validation, Row Level Security on all database tables, and security headers on all responses. Proof images are stored in private buckets with signed URL access only.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>7. Your Rights</h2>
            <p>You can view, edit, or delete your posts and claims at any time through the app. For account deletion or data export requests, contact us at the email below.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>8. Contact</h2>
            <p>Privacy questions? Reach out at <a href="mailto:rajdeepoff78@gmail.com" style={{ color: '#185FA5' }}>rajdeepoff78@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </main>
  )
}