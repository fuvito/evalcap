import Link from 'next/link'
import { Nav } from '@/components/nav'

export const metadata = {
  title: 'Privacy Policy – EvalCap',
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-800 dark:text-slate-100">Privacy Policy</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">Last updated: May 28, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Overview</h2>
            <p>
              EvalCap ("we", "us", "our") is a performance review journaling tool. This policy explains what personal data we collect, why we collect it, and how it is stored and processed. We are committed to handling your data with care and transparency.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Data We Collect</h2>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li><strong className="text-slate-700 dark:text-slate-200">Account data</strong> — your email address, collected at signup and used for authentication.</li>
              <li><strong className="text-slate-700 dark:text-slate-200">Profile data</strong> — optional fields you choose to fill in: full name, job title, department, and manager name. These are used to personalise your experience.</li>
              <li><strong className="text-slate-700 dark:text-slate-200">Journal entries</strong> — the check-in responses you write. This is the core content of the service.</li>
              <li><strong className="text-slate-700 dark:text-slate-200">Summaries</strong> — AI-generated performance review summaries created from your journal entries.</li>
              <li><strong className="text-slate-700 dark:text-slate-200">Usage preferences</strong> — settings such as default check-in type and theme preference (stored locally in your browser).</li>
            </ul>
            <p>We do not collect payment information, browsing behaviour, or any data beyond what is listed above.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">How We Use Your Data</h2>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li>To provide the service — storing your entries and generating summaries.</li>
              <li>To improve AI prompt quality — your recent entries are sent to the Anthropic API to generate contextual check-in prompts. See the AI Processing section below.</li>
              <li>To authenticate your account and protect your data.</li>
            </ul>
            <p>We do not sell your data. We do not use your data for advertising.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">AI Processing (Anthropic)</h2>
            <p>
              EvalCap uses the <strong className="text-slate-700 dark:text-slate-200">Anthropic Claude API</strong> to generate check-in prompts and performance review summaries. When you request a prompt or summary, the relevant journal entry content is sent to Anthropic's API servers for processing.
            </p>
            <p>
              Anthropic's data handling is governed by their own <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">Privacy Policy</a>. By using EvalCap's AI features, you acknowledge that your journal content is processed by Anthropic's API.
            </p>
            <p>
              We do not send your email address, profile data, or any identifying information to the Anthropic API — only the journal entry text required for generation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Data Storage</h2>
            <p>
              Your data is stored in <strong className="text-slate-700 dark:text-slate-200">Supabase</strong>, a managed PostgreSQL database service. All data is protected by Row Level Security (RLS) policies — your entries and summaries are only accessible to you. Supabase stores data in the EU West region by default.
            </p>
            <p>
              Supabase's data handling is governed by their <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">Privacy Policy</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-outside pl-5 space-y-2">
              <li><strong className="text-slate-700 dark:text-slate-200">Access</strong> your data — all your journal entries and summaries are visible within the app.</li>
              <li><strong className="text-slate-700 dark:text-slate-200">Delete</strong> your entries and summaries — individually via the app's delete controls.</li>
              <li><strong className="text-slate-700 dark:text-slate-200">Delete your account</strong> — contact us and we will remove all your data within 30 days.</li>
              <li><strong className="text-slate-700 dark:text-slate-200">Export your data</strong> — contact us to request a full export of your account data in JSON format.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Data Retention</h2>
            <p>
              Your data is retained for as long as your account is active. If you request account deletion, all personal data — including entries, summaries, and profile information — will be permanently deleted within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Cookies and Local Storage</h2>
            <p>
              EvalCap uses browser <strong className="text-slate-700 dark:text-slate-200">local storage</strong> (not cookies) to store your theme preference. Authentication session tokens are stored in cookies by Supabase. No third-party tracking cookies are used.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Changes to This Policy</h2>
            <p>
              We may update this policy as the product evolves. Material changes will be communicated by updating the date at the top of this page. Continued use of the service after changes constitutes acceptance of the revised policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Contact</h2>
            <p>
              Questions about this policy or data requests can be sent to{' '}
              <a href="mailto:privacy@evalcap.app" className="text-brand-600 dark:text-brand-400 hover:underline">privacy@evalcap.app</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 dark:border-slate-800">
          <Link href="/terms" className="text-sm text-brand-500 dark:text-brand-400 hover:text-brand-600 transition-colors">
            View Terms of Service →
          </Link>
        </div>
      </main>
    </>
  )
}
