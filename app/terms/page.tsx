export default function TermsPage() {
  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-2xl mx-auto">

        <h1 className="text-xl font-bold mb-2" style={{ color: '#f0f2f5' }}>Terms of Service</h1>
        <p className="text-xs mb-8" style={{ color: '#4a5068' }}>Last updated: May 2026</p>

        <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: '#8b92a5' }}>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>1. About Vaapsi</h2>
            <p>Vaapsi is a lost-and-found platform built for KIIT University students. It helps users report lost or found items on campus and coordinate their return through verified claims and safe handoffs.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>2. Eligibility</h2>
            <p>You must have a valid KIIT University email address (@kiit.ac.in) to create an account. By signing up, you confirm you are a current student or staff member of KIIT University.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>3. User Conduct</h2>
            <p>You agree not to post false or misleading item reports, claim items that do not belong to you, use profane or abusive language, attempt to circumvent verification or security measures, or use the platform for any unlawful purpose. Vaapsi reserves the right to remove content and suspend accounts that violate these terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>4. Item Claims & Verification</h2>
            <p>Vaapsi provides verification tools (questions, photo proof) to help confirm ownership, but cannot guarantee the identity or intentions of any user. You are responsible for verifying ownership before returning an item. Vaapsi is not liable for items returned to the wrong person.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>5. Privacy</h2>
            <p>Your use of Vaapsi is also governed by our <a href="/privacy" style={{ color: '#185FA5' }}>Privacy Policy</a>. We collect only what is necessary to operate the platform.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>6. Limitation of Liability</h2>
            <p>Vaapsi is provided &quot;as is&quot; without warranties of any kind. We are not responsible for any loss, damage, or dispute arising from the use of the platform, including but not limited to items lost, stolen, or incorrectly claimed.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>7. Changes</h2>
            <p>We may update these terms at any time. Continued use of Vaapsi after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: '#f0f2f5' }}>8. Contact</h2>
            <p>Questions about these terms? Reach out at <a href="mailto:rajdeepoff78@gmail.com" style={{ color: '#185FA5' }}>rajdeepoff78@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </main>
  )
}