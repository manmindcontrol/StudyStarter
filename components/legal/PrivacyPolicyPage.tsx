"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Eye,
  Database,
  Users,
  FileText,
  AlertCircle,
  Mail,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-600 to-cyan-500 rounded-full mb-6 shadow-xl shadow-blue-500/30"
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold text-white mb-4"
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-blue-200 text-lg"
          >
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </motion.p>
        </motion.div>

        {/* Content - Individual Cards */}
        <div className="space-y-6">
          {/* Introduction */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Introduction</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Study Starter. We are committed to protecting your
              personal information and your right to privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your
              information when you use our web application and services. Please
              read this privacy policy carefully. If you do not agree with the
              terms of this privacy policy, please do not access the
              application.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              We reserve the right to make changes to this Privacy Policy at any
              time and for any reason. We will alert you about any changes by
              updating the &ldquo;Last updated&rdquo; date of this Privacy Policy. You are
              encouraged to periodically review this Privacy Policy to stay
              informed of updates. You will be deemed to have been made aware
              of, will be subject to, and will be deemed to have accepted the
              changes in any revised Privacy Policy by your continued use of the
              Application after the date such revised Privacy Policy is posted.
            </p>
          </motion.section>

          {/* Information We Collect */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Information We Collect
              </h2>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
              Personal Information You Disclose to Us
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect personal information that you voluntarily provide to us
              when you register on the Application, express an interest in
              obtaining information about us or our products and services, when
              you participate in activities on the Application, or otherwise
              when you contact us.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              The personal information that we collect depends on the context of
              your interactions with us and the Application, the choices you
              make, and the products and features you use. The personal
              information we collect may include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>Account Information:</strong> Name, email address,
                username, and password
              </li>
              <li>
                <strong>Profile Information:</strong> Educational background,
                study preferences, and profile picture
              </li>
              <li>
                <strong>User Content:</strong> Study materials, notes,
                questions, and other content you upload or create
              </li>
              <li>
                <strong>Communication Data:</strong> Information from your
                communications with us, including support requests
              </li>
              <li>
                <strong>Payment Information:</strong> Credit card details,
                billing address (processed securely through third-party payment
                processors)
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
              Information Automatically Collected
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We automatically collect certain information when you visit, use,
              or navigate the Application. This information does not reveal your
              specific identity (like your name or contact information) but may
              include device and usage information, such as:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>Device Information:</strong> IP address, browser type
                and version, operating system, device type
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, time spent on pages,
                clickstream data, features used
              </li>
              <li>
                <strong>Location Data:</strong> General geographic location
                based on IP address
              </li>
              <li>
                <strong>Cookies and Tracking Technologies:</strong> Data
                collected through cookies, web beacons, and similar technologies
              </li>
              <li>
                <strong>Analytics Data:</strong> Application performance, error
                logs, and usage patterns
              </li>
            </ul>
          </motion.section>

          {/* How We Use Your Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                How We Use Your Information
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use personal information collected via our Application for a
              variety of business purposes described below. We process your
              personal information for these purposes in reliance on our
              legitimate business interests, in order to enter into or perform a
              contract with you, with your consent, and/or for compliance with
              our legal obligations.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>Provide and Maintain Services:</strong> To operate and
                maintain your account, deliver the services you request, and
                process transactions
              </li>
              <li>
                <strong>Improve User Experience:</strong> To understand how you
                use our Application and improve features, functionality, and
                user interface
              </li>
              <li>
                <strong>AI-Powered Features:</strong> To generate study
                questions, create notes, and provide AI-assisted learning tools
                using your uploaded materials
              </li>
              <li>
                <strong>Personalization:</strong> To customize content,
                recommendations, and features based on your preferences and
                usage patterns
              </li>
              <li>
                <strong>Communication:</strong> To send you administrative
                information, updates, security alerts, and support messages
              </li>
              <li>
                <strong>Marketing:</strong> To send you promotional materials,
                newsletters, and other information that may be of interest (with
                your consent)
              </li>
              <li>
                <strong>Security and Fraud Prevention:</strong> To protect
                against unauthorized access, detect and prevent fraud, and
                ensure platform security
              </li>
              <li>
                <strong>Legal Compliance:</strong> To comply with applicable
                laws, regulations, and legal processes
              </li>
              <li>
                <strong>Analytics and Research:</strong> To analyze trends,
                track user behavior, and conduct research to improve our
                services
              </li>
              <li>
                <strong>Customer Support:</strong> To respond to your inquiries,
                provide technical support, and resolve issues
              </li>
            </ul>
          </motion.section>

          {/* Sharing Your Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Sharing Your Information
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may process or share your data that we hold based on the
              following legal basis:
            </p>
            <ul className="list-disc list-inside space-y-3 text-gray-700 ml-4">
              <li>
                <strong>Service Providers:</strong> We may share your
                information with third-party vendors, service providers,
                contractors, or agents who perform services for us or on our
                behalf and require access to such information to do that work.
                Examples include: payment processing, data analysis, email
                delivery, hosting services, customer service, and AI/ML services
                (such as OpenAI for generating questions and notes).
              </li>
              <li>
                <strong>Business Transfers:</strong> We may share or transfer
                your information in connection with, or during negotiations of,
                any merger, sale of company assets, financing, or acquisition of
                all or a portion of our business to another company.
              </li>
              <li>
                <strong>Legal Obligations:</strong> We may disclose your
                information where we are legally required to do so in order to
                comply with applicable law, governmental requests, a judicial
                proceeding, court order, or legal process.
              </li>
              <li>
                <strong>Vital Interests and Legal Rights:</strong> We may
                disclose your information where we believe it is necessary to
                investigate, prevent, or take action regarding potential
                violations of our policies, suspected fraud, situations
                involving potential threats to the safety of any person, or as
                evidence in litigation.
              </li>
              <li>
                <strong>With Your Consent:</strong> We may disclose your
                personal information for any other purpose with your consent.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Important Note on AI Services:</strong> When you use
              AI-powered features (such as question generation or note
              creation), your uploaded content is processed by third-party AI
              services including OpenAI. This content is sent securely to these
              services for processing but is not used to train their models or
              shared with other parties.
            </p>
          </motion.section>

          {/* Data Retention */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Data Retention
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              We will only keep your personal information for as long as it is
              necessary for the purposes set out in this privacy policy, unless
              a longer retention period is required or permitted by law (such as
              tax, accounting, or other legal requirements). When we have no
              ongoing legitimate business need to process your personal
              information, we will either delete or anonymize such information,
              or, if this is not possible (for example, because your personal
              information has been stored in backup archives), then we will
              securely store your personal information and isolate it from any
              further processing until deletion is possible.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Account information and user-generated content are retained for
              the duration of your account&apos;s active status. If you delete your
              account, your personal information will be removed from our active
              databases within 30 days, although some information may be
              retained in backup systems for up to 90 days for security and
              legal purposes.
            </p>
          </motion.section>

          {/* Data Security */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Data Security
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              We have implemented appropriate technical and organizational
              security measures designed to protect the security of any personal
              information we process. However, despite our safeguards and
              efforts to secure your information, no electronic transmission
              over the Internet or information storage technology can be
              guaranteed to be 100% secure, so we cannot promise or guarantee
              that hackers, cybercriminals, or other unauthorized third parties
              will not be able to defeat our security and improperly collect,
              access, steal, or modify your information.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Our security measures include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-2">
              <li>Encryption of data in transit using SSL/TLS protocols</li>
              <li>Encryption of sensitive data at rest</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure password storage using industry-standard hashing</li>
              <li>Regular backup and disaster recovery procedures</li>
              <li>
                Employee training on data protection and security best practices
              </li>
            </ul>
          </motion.section>

          {/* Your Privacy Rights */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Your Privacy Rights
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding
              your personal information. These may include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>Right to Access:</strong> You can request a copy of the
                personal information we hold about you
              </li>
              <li>
                <strong>Right to Rectification:</strong> You can request that we
                correct inaccurate or incomplete information
              </li>
              <li>
                <strong>Right to Erasure:</strong> You can request that we
                delete your personal information in certain circumstances
              </li>
              <li>
                <strong>Right to Restrict Processing:</strong> You can request
                that we limit how we use your information
              </li>
              <li>
                <strong>Right to Data Portability:</strong> You can request a
                copy of your data in a structured, machine-readable format
              </li>
              <li>
                <strong>Right to Object:</strong> You can object to our
                processing of your personal information in certain cases
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Where we rely on
                your consent, you can withdraw it at any time
              </li>
              <li>
                <strong>Right to Lodge a Complaint:</strong> You can file a
                complaint with your local data protection authority
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please contact us using the information
              provided in the &ldquo;Contact Us&rdquo; section below. We will respond to
              your request within 30 days. Please note that we may need to
              verify your identity before processing your request.
            </p>
          </motion.section>

          {/* Cookies and Tracking */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Cookies and Tracking Technologies
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies to track activity
              on our Application and hold certain information. Cookies are files
              with a small amount of data which may include an anonymous unique
              identifier. You can instruct your browser to refuse all cookies or
              to indicate when a cookie is being sent. However, if you do not
              accept cookies, you may not be able to use some portions of our
              Application. For more detailed information about the cookies we
              use and your choices regarding cookies, please visit our Cookie
              Policy.
            </p>
          </motion.section>

          {/* Third-Party Services */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Third-Party Services
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our Application may contain links to third-party websites,
              services, or applications that are not operated by us. We use
              various third-party services to provide and improve our
              Application, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>OpenAI:</strong> For AI-powered question generation and
                note creation
              </li>
              <li>
                <strong>Supabase:</strong> For database and authentication
                services
              </li>
              <li>
                <strong>Payment Processors:</strong> For handling subscription
                payments and transactions
              </li>
              <li>
                <strong>Analytics Services:</strong> For understanding user
                behavior and improving our services
              </li>
              <li>
                <strong>Cloud Hosting:</strong> For storing and delivering
                application content
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              If you click on a third-party link or use a third-party service,
              you will be directed to that third party&apos;s site. We strongly
              advise you to review the Privacy Policy of every site you visit or
              service you use. We have no control over and assume no
              responsibility for the content, privacy policies, or practices of
              any third-party sites or services.
            </p>
          </motion.section>

          {/* Children's Privacy */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Children&apos;s Privacy
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Our Application is not intended for children under the age of 13,
              and we do not knowingly collect personal information from children
              under 13. If you are a parent or guardian and you are aware that
              your child has provided us with personal information, please
              contact us. If we become aware that we have collected personal
              information from children under 13 without verification of
              parental consent, we will take steps to remove that information
              from our servers. If you are between 13 and 18 years old, you may
              only use our Application with the consent and supervision of a
              parent or legal guardian.
            </p>
          </motion.section>

          {/* International Data Transfers */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                International Data Transfers
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Your information, including personal data, may be transferred to —
              and maintained on — computers located outside of your state,
              province, country, or other governmental jurisdiction where the
              data protection laws may differ from those of your jurisdiction.
              If you are located outside the European Economic Area and choose
              to provide information to us, please note that we transfer the
              data, including personal data, to countries that may not have the
              same data protection laws as your country. Your consent to this
              Privacy Policy followed by your submission of such information
              represents your agreement to that transfer. We will take all steps
              reasonably necessary to ensure that your data is treated securely
              and in accordance with this Privacy Policy.
            </p>
          </motion.section>

          {/* Contact Us */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please
              contact us:
            </p>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <p className="text-gray-700">
                <strong>Email:</strong> privacy@studyassistant.com
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Address:</strong> Study Starter Inc., 123 Education
                Street, Learning City, LC 12345
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
