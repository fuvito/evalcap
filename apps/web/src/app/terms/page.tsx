import Link from 'next/link'
import { Nav } from '@/components/nav'

export const metadata = {
  title: 'Terms of Service – EvalCap',
}

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Terms of Service</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">Last updated: May 28, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Acceptance of Terms</h2>
            <p>
              By creating an account or using EvalCap ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users of EvalCap.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Description of Service</h2>
            <p>
              EvalCap is a personal performance review journaling tool. It allows you to record regular check-ins and generate AI-powered summaries of your work for use in performance review processes. The Service is provided as-is and is intended for individual use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Your Account</h2>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>You must provide a valid email address and keep your credentials secure.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must be at least 16 years old to use the Service.</li>
              <li>One account per person. Creating duplicate accounts is not permitted.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>Use the Service for any unlawful purpose or in violation of any applicable law.</li>
              <li>Attempt to gain unauthorised access to other users' data or the underlying systems.</li>
              <li>Use the Service to generate content that is harmful, defamatory, or abusive.</li>
              <li>Reverse engineer, scrape, or attempt to extract the underlying AI models or data.</li>
              <li>Use automated tools to create entries or summaries at scale.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Your Content</h2>
            <p>
              You retain ownership of all journal entries and summaries you create. By using the Service, you grant EvalCap a limited licence to store and process your content solely for the purpose of providing the Service to you.
            </p>
            <p>
              You are responsible for the accuracy of your entries. EvalCap AI features compile and rewrite your own input — they do not fabricate information. However, <strong className="text-slate-700 dark:text-slate-200">you should review all AI-generated summaries before using them</strong> in any professional context.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">AI-Generated Content</h2>
            <p>
              EvalCap uses the Anthropic Claude API to generate prompts and summaries. AI-generated outputs are based solely on the journal entries you have written. We take reasonable steps to ensure outputs are grounded in your actual content, but:
            </p>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>We do not guarantee the accuracy, completeness, or suitability of any generated summary.</li>
              <li>Generated summaries are a starting point, not a final document. You should edit them before use.</li>
              <li>EvalCap is not responsible for any professional consequences arising from the use of AI-generated content.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Availability and Changes</h2>
            <p>
              We aim to keep the Service available but do not guarantee uninterrupted access. We may modify, suspend, or discontinue any part of the Service at any time. We will provide reasonable notice for material changes that affect your data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" without warranties of any kind, express or implied. We do not warrant that the Service will be error-free, secure, or continuously available. Use of the Service is at your own risk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, EvalCap shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including but not limited to loss of data or professional consequences from use of generated summaries.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Termination</h2>
            <p>
              You may stop using the Service and request account deletion at any time by contacting us. We may suspend or terminate your account if you violate these terms. Upon termination, your data will be deleted in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Changes to These Terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised terms. The date at the top of this page reflects the most recent update.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Contact</h2>
            <p>
              Questions about these terms can be sent to{' '}
              <a href="mailto:legal@evalcap.app" className="text-brand-600 dark:text-brand-400 hover:underline">legal@evalcap.app</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 dark:border-slate-800">
          <Link href="/privacy" className="text-sm text-brand-500 dark:text-brand-400 hover:text-brand-600 transition-colors">
            View Privacy Policy →
          </Link>
        </div>
      </main>
    </>
  )
}
