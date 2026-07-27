import React from 'react';

function Section({ title, children }) {
  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-slate-600">{children}</div>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'rgb(98,191,161)' }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicyContent() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[15px] leading-7 text-slate-600">
        Open Minds Studios, LLC (“Open Minds,” “we,” “our,” or “us”) respects your privacy and is
        committed to protecting the personal information of our students, parents, guardians, and
        website visitors. This Privacy Policy explains how we collect, use, disclose, and safeguard
        personal information when you visit our website, request information, enroll in tutoring
        services, access our Parent Portal, or otherwise interact with us.
      </p>
      <p className="mt-3 text-[15px] leading-7 text-slate-600">
        By using our website or services, you agree to the collection and use of information as
        described in this Privacy Policy. If you do not agree with this Privacy Policy, please
        discontinue use of our website and services.
      </p>

      <Section title="Information We Collect">
        <p>We may collect personal information directly from parents, guardians, students, and website visitors.</p>
        <p className="font-semibold text-slate-700">Personal information may include:</p>
        <BulletList items={[
          'Name', 'Email address', 'Telephone number', 'Mailing address', 'Student name',
          'Student age and grade level', 'Educational needs and learning goals',
          'Academic progress information', 'Parent and guardian contact information',
          'Account login credentials', 'Communications with Open Minds', 'Payment and billing information',
        ]} />
        <p className="mt-4 font-semibold text-slate-700">We collect information when you:</p>
        <BulletList items={[
          'Submit a website form', 'Request a consultation', 'Enroll in tutoring services',
          'Create a Parent Portal account', 'Contact us by phone, email, text message, or other means',
          'Participate in tutoring sessions or educational activities',
        ]} />
      </Section>

      <Section title="Website Information">
        <p>When you visit our website, we may automatically collect certain non-identifying information, including:</p>
        <BulletList items={[
          'Browser type', 'Device type', 'Language preference', 'Referring website',
          'Date and time of access', 'Pages viewed', 'General usage information',
        ]} />
        <p>This information helps us improve our website, analyze trends, and better understand how visitors use our services.</p>
      </Section>

      <Section title="Parent Portal">
        <p>Registration is required to access the Parent Portal.</p>
        <p>The Parent Portal may contain:</p>
        <BulletList items={[
          'Student progress reports', 'Educational plans', 'Attendance records', 'Session notes',
          'Communications regarding services', 'Other educational information related to your child',
        ]} />
        <p>
          Access to the Parent Portal is restricted to authorized users through password-protected
          accounts. Users are responsible for maintaining the confidentiality of their login credentials.
        </p>
      </Section>

      <Section title="Cookies and Tracking Technologies">
        <p>Our website may use cookies and similar technologies to improve website functionality and analyze usage.</p>
        <p>A cookie is a small file stored on your device that allows our website to recognize returning visitors and remember preferences.</p>
        <p>You may disable cookies through your browser settings. However, certain website features may not function properly if cookies are disabled.</p>
        <p>Our systems do not currently respond to “Do Not Track” browser signals.</p>
      </Section>

      <Section title="Analytics and Advertising">
        <p>We may use third-party analytics services, including Google Analytics, to better understand how users interact with our website.</p>
        <p>These services may collect information regarding website usage and performance.</p>
        <p>We may also use advertising providers to display advertisements relating to our services. These providers may use cookies or similar technologies to help deliver advertisements that may be relevant to users.</p>
        <p>You may learn more about online advertising preferences through the National Advertising Initiative and the Digital Advertising Alliance.</p>
      </Section>

      <Section title="How We Use Personal Information">
        <p>We may use personal information for lawful business purposes, including:</p>
        <BulletList items={[
          'Providing tutoring and educational services', 'Developing educational plans and monitoring progress',
          'Communicating with parents and students', 'Scheduling consultations and tutoring sessions',
          'Managing accounts and Parent Portal access', 'Processing payments',
          'Improving instructional methods and educational materials', 'Training and supervising instructors',
          'Responding to inquiries and customer service requests',
          'Protecting against fraud, unauthorized access, and other security risks',
          'Complying with legal obligations', 'Enforcing agreements and policies',
          'Improving our website and marketing efforts',
        ]} />
        <p>With your consent where required by law, we may send promotional emails and text messages regarding our services, programs, events, and special offers.</p>
        <p>Consent to receive marketing text messages is voluntary and is not required to purchase or receive tutoring services. Message and data rates may apply. You may opt out at any time by following the instructions provided in the communication.</p>
      </Section>

      <Section title="Information Sharing">
        <p>We do not sell or rent personal information for monetary compensation.</p>
        <p>We may disclose personal information to employees, contractors, instructors, and service providers who require access to perform services on our behalf.</p>
        <p>We may also share information with third-party service providers that assist us in operating our business, including providers of:</p>
        <BulletList items={[
          'Website hosting', 'Cloud storage', 'Email communications', 'Video conferencing',
          'Scheduling services', 'Payment processing', 'Analytics services',
          'Customer relationship management systems', 'Educational technology platforms',
        ]} />
        <p>These parties are authorized to use personal information only as necessary to provide services to Open Minds and are contractually required to maintain confidentiality and appropriate safeguards.</p>
        <p>We may disclose information when required by law, court order, subpoena, or governmental request, or when necessary to protect the rights, safety, or property of Open Minds, our students, or others.</p>
      </Section>

      <Section title="Children’s Privacy">
        <p>Open Minds provides educational services to children and recognizes the importance of protecting children’s privacy.</p>
        <p>We collect personal information about children only when reasonably necessary to provide educational services, assess academic progress, communicate with parents or guardians, and administer our programs.</p>
        <p>Information collected about a child may include:</p>
        <BulletList items={[
          'Name', 'Age', 'Grade level', 'Educational needs', 'Academic progress information',
          'Tutoring records', 'Attendance information', 'Learning assessments',
        ]} />
        <p>Before collecting personal information directly from a child under the age of 13, we obtain verifiable parental consent when required by applicable law.</p>
        <p className="font-semibold text-slate-700">Parents and legal guardians may:</p>
        <BulletList items={[
          'Review their child’s personal information', 'Request correction of inaccurate information',
          'Revoke consent', 'Request deletion of their child’s information, subject to legal and operational requirements',
        ]} />
        <p>We do not knowingly sell children’s personal information and do not use children’s personal information for behavioral advertising.</p>
        <p>If we learn that we have collected personal information from a child under 13 without the required parental consent, we will take reasonable steps to delete such information as soon as practicable.</p>
      </Section>

      <Section title="Data Security">
        <p>We maintain administrative, technical, and physical safeguards designed to protect personal information from unauthorized access, disclosure, alteration, or destruction.</p>
        <p>These safeguards may include encryption, access controls, password protection, employee training, and secure service providers.</p>
        <p>While we use commercially reasonable measures to protect information, no method of transmission or storage can be guaranteed to be completely secure.</p>
      </Section>

      <Section title="Data Security Incidents">
        <p>If we become aware of a security incident involving personal information under our control, we will investigate the matter and provide any notifications required by applicable law, including applicable Pennsylvania data breach notification requirements.</p>
      </Section>

      <Section title="Retention of Information">
        <p>We retain personal information only as long as reasonably necessary to fulfill the purposes described in this Privacy Policy, provide services, comply with legal obligations, resolve disputes, and enforce agreements.</p>
        <p>Retention periods may vary depending on:</p>
        <BulletList items={[
          'The nature of the information', 'Legal requirements', 'Business needs', 'Contractual obligations',
        ]} />
        <p>When personal information is no longer needed, we take reasonable steps to securely delete, destroy, or anonymize it.</p>
      </Section>

      <Section title="Your Privacy Choices">
        <p>You may:</p>
        <BulletList items={[
          'Request access to personal information we maintain about you',
          'Request correction of inaccurate information',
          'Request deletion of personal information, subject to applicable legal requirements',
          'Withdraw consent previously provided', 'Opt out of marketing communications',
        ]} />
        <p>To exercise these rights, contact us using the information provided below.</p>
        <p>We may request information necessary to verify your identity before responding to your request.</p>
        <p>Even if you opt out of marketing communications, we may continue to send administrative messages relating to your account, billing, appointments, or services.</p>
      </Section>

      <Section title="Changes to This Privacy Policy">
        <p>We may update this Privacy Policy from time to time to reflect changes in our business practices, legal requirements, or operational needs.</p>
        <p>Any updates will be posted on this page with a revised Effective Date.</p>
        <p>Your continued use of our website or services following the posting of changes constitutes acceptance of the revised Privacy Policy.</p>
      </Section>

      <Section title="Contact Us">
        <p>If you have questions regarding this Privacy Policy or wish to exercise your privacy rights, please contact:</p>
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-5 text-[15px] leading-7 text-slate-600">
          <div className="font-semibold text-slate-800">Open Minds Studios, LLC</div>
          <div>Privacy Coordinator</div>
          <div>Phone: <a href="tel:4122184025" style={{ color: 'rgb(58,154,202)' }}>412-218-4025</a></div>
          <div>Email: <a href="mailto:openmindsadmin46@gmail.com" style={{ color: 'rgb(58,154,202)' }}>openmindsadmin46@gmail.com</a></div>
        </div>
      </Section>
    </div>
  );
}