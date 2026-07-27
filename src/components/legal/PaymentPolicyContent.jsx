import React from 'react';

function Section({ title, children }) {
  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{title}</h2>
      <div className="mt-3 space-y-5">{children}</div>
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div>
      <h3 className="font-semibold text-slate-700">{title}</h3>
      <div className="mt-2 space-y-3 text-[15px] leading-7 text-slate-600">{children}</div>
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

export default function PaymentPolicyContent() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-[15px] leading-7 text-slate-600">
        At Open Minds Studios, we value our students’ time, our instructors’ time, and our commitment
        to providing high-quality educational services. This Payment and Cancellation Policy explains
        our expectations regarding payment, scheduling, cancellations, and refunds.
      </p>

      <Section title="Payment Policy">
        <SubSection title="Payment Due">
          <p>Payment for tutoring services is due after the scheduled tutoring session.</p>
          <p>Parents may purchase individual sessions, tutoring packages, or recurring tutoring services as offered by Open Minds Studios.</p>
        </SubSection>
        <SubSection title="Payment Methods">
          <p>We accept approved payment methods as communicated during enrollment.</p>
          <p>Parents are responsible for maintaining current and valid payment information.</p>
        </SubSection>
        <SubSection title="Returned or Failed Payments">
          <p>If a payment is declined, returned, disputed, or otherwise unsuccessful:</p>
          <BulletList items={[
            'Open Minds may suspend future tutoring sessions until payment is received.',
            'The Parent remains responsible for all outstanding charges.',
            'Open Minds reserves the right to require an alternate payment method.',
          ]} />
        </SubSection>
        <SubSection title="Pricing Changes">
          <p>Open Minds reserves the right to modify tuition rates, package pricing, and fees. Existing families will receive reasonable advance notice of any pricing changes.</p>
        </SubSection>
      </Section>

      <Section title="Cancellation and Rescheduling Policy">
        <SubSection title="Parent Cancellation Requests">
          <p>Tutoring sessions may be cancelled or rescheduled without penalty when at least twenty-four (24) hours’ advance notice is provided. Notice may be provided through email, text message, or phone call.</p>
        </SubSection>
        <SubSection title="Late Cancellations">
          <p>Sessions cancelled with less than twenty-four (24) hours’ notice may be charged at the full session rate.</p>
          <p>Open Minds may waive this charge in cases involving emergencies, illness, severe weather, or other circumstances at our discretion.</p>
        </SubSection>
        <SubSection title="No-Shows">
          <p>A student who fails to attend a scheduled tutoring session without notice will be considered a no-show.</p>
          <p>No-show sessions may be charged in full and may not be eligible for refund, credit, or rescheduling.</p>
        </SubSection>
        <SubSection title="Student Late Arrivals">
          <p>If a student arrives late, the session will end at its originally scheduled time unless otherwise approved by the tutor. The full session fee may still apply.</p>
        </SubSection>
        <SubSection title="Tutor Cancellations">
          <p>If Open Minds or an instructor must cancel a session, the Parent will be offered a makeup session or a credit toward future services.</p>
          <p>No cancellation fee will be charged to the Parent when Open Minds cancels a session.</p>
        </SubSection>
      </Section>

      <Section title="Refunds">
        <SubSection title="Completed Services">
          <p>Refunds are not available for tutoring sessions that have already been completed.</p>
        </SubSection>
        <SubSection title="Prepaid Packages">
          <p>Unused prepaid tutoring sessions may be eligible for refunds upon written request.</p>
          <p>Any refund may be reduced by:</p>
          <BulletList items={[
            'The value of sessions already completed.',
            'Promotional discounts previously applied.',
            'Any applicable processing fees.',
          ]} />
        </SubSection>
        <SubSection title="Refund Processing">
          <p>Approved refunds will be processed within thirty (30) days using the original payment method whenever possible.</p>
        </SubSection>
      </Section>

      <Section title="Makeup Sessions">
        <SubSection title="Makeup Sessions">
          <p>Open Minds may offer makeup sessions for excused absences when scheduling permits.</p>
          <p>Makeup sessions are not guaranteed and are subject to instructor availability.</p>
        </SubSection>
      </Section>

      <Section title="Communication">
        <SubSection title="Contact Information">
          <p>Questions regarding payments, cancellations, credits, or refunds should be directed to:</p>
          <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-5 text-[15px] leading-7 text-slate-600">
            <div className="font-semibold text-slate-800">Open Minds Studios, LLC</div>
            <div>Phone: <a href="tel:4122184025" style={{ color: 'rgb(58,154,202)' }}>412-218-4025</a></div>
            <div>Email: <a href="mailto:openmindsadmin46@gmail.com" style={{ color: 'rgb(58,154,202)' }}>openmindsadmin46@gmail.com</a></div>
          </div>
        </SubSection>
      </Section>

      <Section title="Acknowledgment">
        <p className="text-[15px] leading-7 text-slate-600">By enrolling in tutoring services, scheduling tutoring sessions, or submitting payment, the Parent acknowledges that they have read, understood, and agreed to this Payment and Cancellation Policy.</p>
      </Section>
    </div>
  );
}