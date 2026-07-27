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

export default function TermsOfServiceContent() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="font-semibold text-slate-700">PLEASE READ THIS AGREEMENT CAREFULLY.</p>
      <p className="mt-3 text-[15px] leading-7 text-slate-600">
        By enrolling a student in services provided by Open Minds Studios, LLC (“Open Minds,”
        “Company,” “we,” “our,” or “us”), signing this Agreement, checking an “I Agree” box, making
        payment for services, or participating in tutoring sessions, you (“Parent,” “Guardian,” or
        “Client”) agree to be bound by these Terms of Service.
      </p>

      <Section title="Educational Services">
        <p>Open Minds Studios provides tutoring, educational enrichment, academic coaching, and related educational support services.</p>
        <p>Services may be delivered through online video conferencing platforms, educational software, electronic communications, and other methods selected by Open Minds.</p>
        <p>Open Minds reserves the right to modify, improve, suspend, or discontinue services when reasonably necessary.</p>
      </Section>

      <Section title="No Guarantee of Results">
        <p>Open Minds strives to provide high-quality educational support; however, educational outcomes depend upon many factors beyond our control.</p>
        <p>Open Minds does not guarantee:</p>
        <BulletList items={[
          'Specific grades', 'Standardized test scores', 'School admissions', 'College admissions',
          'Scholarships', 'Academic advancement', 'Any other educational outcome',
        ]} />
        <p>The Parent acknowledges that tutoring services are educational support services and not a guarantee of academic performance.</p>
      </Section>

      <Section title="Parental Consent">
        <p>The Parent represents that:</p>
        <BulletList items={[
          'The Parent is at least 18 years old.',
          'The Parent is the student’s parent or legal guardian or otherwise has authority to enroll the student.',
          'Information provided during enrollment is accurate and complete.',
        ]} />
      </Section>

      <Section title="Fees and Payment">
        <p>Fees for services shall be communicated before enrollment.</p>
        <p>Unless otherwise agreed in writing:</p>
        <BulletList items={[
          'Payment is due before services are provided.',
          'Open Minds may require a valid payment method to remain on file.',
          'Outstanding balances may result in suspension of services.',
          'The Parent is responsible for all fees associated with enrolled services.',
        ]} />
        <p>Open Minds reserves the right to modify pricing upon reasonable advance notice.</p>
      </Section>

      <Section title="Cancellation and Rescheduling">
        <p>Parents may cancel or reschedule sessions by providing at least twenty-four (24) hours’ advance notice.</p>
        <p>Sessions cancelled with less than twenty-four (24) hours’ notice may be charged in full.</p>
        <p>Missed sessions or no-shows may be treated as completed sessions and may not be eligible for refund or rescheduling.</p>
        <p>Open Minds may waive cancellation fees at its sole discretion.</p>
      </Section>

      <Section title="Company Cancellations">
        <p>If Open Minds cancels a session, the Parent will be offered either:</p>
        <BulletList items={['A makeup session; or', 'A credit toward future services.']} />
      </Section>

      <Section title="Technology Requirements">
        <p>The Parent is responsible for providing:</p>
        <BulletList items={[
          'Reliable internet access', 'A suitable device', 'Necessary software or applications',
          'A reasonably quiet learning environment',
        ]} />
        <p>Open Minds is not responsible for interruptions caused by internet outages, equipment failures, software malfunctions, or circumstances beyond our reasonable control.</p>
      </Section>

      <Section title="Student Conduct">
        <p>Students are expected to behave respectfully toward tutors and staff.</p>
        <p>Open Minds reserves the right to suspend or terminate services if a student engages in:</p>
        <BulletList items={[
          'Harassment', 'Threatening behavior', 'Disruptive conduct', 'Repeated refusal to participate',
          'Conduct that interferes with instruction',
        ]} />
        <p>No refund shall be required when services are terminated for serious misconduct.</p>
      </Section>

      <Section title="Communications">
        <p>The Parent consents to receiving communications relating to scheduling, billing, educational services, and account administration.</p>
        <p>Marketing communications will be provided only in accordance with applicable law and may be discontinued by following provided opt-out instructions.</p>
      </Section>

      <Section title="Recording of Sessions">
        <p>Open Minds does not record tutoring sessions unless specifically disclosed and authorized.</p>
        <p>If Open Minds elects to record sessions in the future, separate notice and consent will be obtained where required by law.</p>
      </Section>

      <Section title="Intellectual Property">
        <p>All instructional materials, lesson plans, worksheets, presentations, videos, educational content, logos, trademarks, website content, and other materials provided by Open Minds remain the property of Open Minds or its licensors.</p>
        <p>Materials are provided solely for the enrolled student’s personal educational use.</p>
        <p>Parents and students may not:</p>
        <BulletList items={[
          'Reproduce materials for commercial purposes', 'Distribute materials to third parties',
          'Upload materials to public websites',
          'Sell, license, or otherwise exploit materials without written permission',
        ]} />
      </Section>

      <Section title="Privacy">
        <p>The collection, use, and disclosure of personal information are governed by the Open Minds Privacy Policy.</p>
        <p>The Privacy Policy is incorporated into this Agreement by reference.</p>
      </Section>

      <Section title="Disclaimer of Warranties">
        <p>Services are provided on an “as-is” and “as-available” basis.</p>
        <p>To the fullest extent permitted by law, Open Minds disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
      </Section>

      <Section title="Limitation of Liability">
        <p>To the fullest extent permitted by Pennsylvania law, Open Minds, its owners, employees, instructors, contractors, and representatives shall not be liable for any indirect, incidental, consequential, special, exemplary, or punitive damages arising out of or relating to the services.</p>
        <p>In no event shall Open Minds’ total liability exceed the amount paid by the Parent for services during the three (3) months immediately preceding the event giving rise to the claim.</p>
      </Section>

      <Section title="Indemnification">
        <p>The Parent agrees to defend, indemnify, and hold harmless Open Minds, its owners, employees, instructors, contractors, and representatives from any claims, liabilities, damages, losses, costs, or expenses arising from:</p>
        <BulletList items={[
          'Violation of this Agreement;', 'Misuse of services;', 'Conduct of the Parent or student; or',
          'Inaccurate information provided during enrollment.',
        ]} />
      </Section>

      <Section title="Force Majeure">
        <p>Open Minds shall not be responsible for delays or failures resulting from circumstances beyond its reasonable control, including natural disasters, internet outages, power failures, labor disputes, governmental actions, pandemics, or other emergencies.</p>
      </Section>

      <Section title="Termination">
        <p>Either party may terminate tutoring services at any time.</p>
        <p>Termination does not relieve either party of obligations incurred before termination.</p>
        <p>Outstanding fees remain due and payable.</p>
      </Section>

      <Section title="Governing Law and Venue">
        <p>This Agreement shall be governed by the laws of the Commonwealth of Pennsylvania without regard to conflict-of-law principles.</p>
        <p>Any legal action arising from this Agreement shall be brought exclusively in the state or federal courts located in Allegheny County, Pennsylvania, and the parties consent to the jurisdiction of those courts.</p>
      </Section>

      <Section title="Severability">
        <p>If any provision of this Agreement is found unenforceable, the remaining provisions shall remain in full force and effect.</p>
      </Section>

      <Section title="Entire Agreement">
        <p>This Agreement, together with the Privacy Policy and any written enrollment documents, constitutes the entire agreement between the parties regarding the services provided by Open Minds.</p>
      </Section>

      <Section title="Enrollment Form Consents">
        <p className="font-semibold text-slate-700">Required Consent</p>
        <p>☐ I certify that I am the parent or legal guardian of the student being enrolled. I have read and agree to the Open Minds Studios Online Tutoring Enrollment Agreement and Terms of Service, the Open Minds Studios Privacy Policy, and the Open Minds Studios Payment and Cancellation Policy. I consent to the collection, use, and disclosure of personal information as described in the Privacy Policy and authorize Open Minds Studios to provide tutoring and educational services to my child.</p>
        <p className="mt-4 font-semibold text-slate-700">Optional Email Marketing Consent</p>
        <p>☐ I would like to receive promotional emails, newsletters, program updates, special offers, and marketing communications from Open Minds Studios. I understand that I may unsubscribe at any time.</p>
        <p className="mt-4 font-semibold text-slate-700">Optional SMS Marketing Consent</p>
        <p>☐ I agree to receive recurring marketing and promotional text messages from Open Minds Studios at the phone number provided. Consent is not a condition of purchase. Message and data rates may apply. I may opt out at any time by replying STOP.</p>
      </Section>

      <Section title="Contact Information">
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-5 text-[15px] leading-7 text-slate-600">
          <div className="font-semibold text-slate-800">Open Minds Studios, LLC</div>
          <div>Phone: <a href="tel:4122184025" style={{ color: 'rgb(58,154,202)' }}>412-218-4025</a></div>
          <div>Email: <a href="mailto:openmindsadmin46@gmail.com" style={{ color: 'rgb(58,154,202)' }}>openmindsadmin46@gmail.com</a></div>
        </div>
      </Section>

      <Section title="Acknowledgment">
        <p>By enrolling a student, submitting payment, signing electronically, checking an “I Agree” box, or participating in tutoring services, the Parent acknowledges that they have read, understood, and agreed to this Enrollment Agreement and Terms of Service.</p>
      </Section>
    </div>
  );
}