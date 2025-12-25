"use client";

import { motion } from "framer-motion";
import {
  Cookie,
  Settings,
  BarChart3,
  Shield,
  Info,
  Trash2,
  Mail,
} from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl"></div>

        {/* Animated stars */}
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, 100, -50, 80, 0],
            y: [0, -80, 60, -40, 0],
            opacity: [0.4, 0.8, 0.3, 0.7, 0.4],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: "20%", left: "20%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, -80, 60, -40, 0],
            y: [0, 70, -90, 50, 0],
            opacity: [0.3, 0.7, 0.4, 0.8, 0.3],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          style={{ top: "40%", right: "20%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, -60, 90, -70, 0],
            y: [0, -50, 80, -30, 0],
            opacity: [0.5, 0.3, 0.8, 0.4, 0.5],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          style={{ bottom: "30%", left: "33%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, 70, -80, 50, 0],
            y: [0, -60, 40, -70, 0],
            opacity: [0.6, 0.4, 0.7, 0.3, 0.6],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.5,
          }}
          style={{ top: "60%", right: "30%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, -90, 40, -60, 0],
            y: [0, 80, -70, 50, 0],
            opacity: [0.4, 0.8, 0.5, 0.7, 0.4],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          style={{ top: "15%", left: "60%" }}
        />
        <motion.div
          className="absolute w-2 h-2 bg-white/40 rounded-full"
          animate={{
            x: [0, 60, -70, 90, 0],
            y: [0, -40, 70, -60, 0],
            opacity: [0.5, 0.7, 0.4, 0.8, 0.5],
          }}
          transition={{
            duration: 19,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2.5,
          }}
          style={{ bottom: "20%", right: "40%" }}
        />
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
            className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-orange-500 to-amber-500 rounded-full mb-6 shadow-xl shadow-orange-500/30"
          >
            <Cookie className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold text-white mb-4"
          >
            Cookie Policy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-orange-200 text-lg"
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
              <Info className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                What Are Cookies
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              This Cookie Policy explains what cookies are and how we use them
              on the Study Assistant application (the Application). You should
              read this policy to understand what type of cookies we use, the
              information we collect using cookies, how that information is
              used, and how to control cookie preferences.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Cookies are small text files that are placed on your device
              (computer, smartphone, tablet, etc.) when you visit a website or
              use an application. Cookies are widely used by website and
              application owners to make their platforms work more efficiently
              and to provide reporting information. Cookies set by the
              website/application owner (in this case, Study Assistant) are
              called first-party cookies. Cookies set by parties other than the
              website/application owner are called third-party cookies.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Third-party cookies enable third-party features or functionality
              to be provided on or through the website/application (e.g.,
              advertising, interactive content, and analytics). The parties that
              set these third-party cookies can recognize your device both when
              it visits the website/application in question and also when it
              visits certain other websites/applications.
            </p>
          </motion.section>

          {/* Why We Use Cookies */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Why We Use Cookies
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use first-party and third-party cookies for several reasons.
              Some cookies are required for technical reasons in order for our
              Application to operate, and we refer to these as essential or
              strictly necessary cookies. Other cookies enable us to track and
              target the interests of our users to enhance the experience on our
              Application. Third parties serve cookies through our Application
              for advertising, analytics, and other purposes.
            </p>
          </motion.section>

          {/* Types of Cookies */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Types of Cookies We Use
              </h2>
            </div>

            {/* Essential Cookies */}
            <div className="bg-orange-50 rounded-lg p-6 mb-6 border border-orange-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                Essential Website Cookies
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                These cookies are strictly necessary to provide you with
                services available through our Application and to use some of
                its features, such as access to secure areas. Because these
                cookies are strictly necessary to deliver the Application, you
                cannot refuse them without impacting how our Application
                functions.
              </p>
              <div className="bg-white rounded p-4 mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Examples:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                  <li>
                    <strong>Authentication cookies:</strong> Keep you logged in
                    as you navigate the Application
                  </li>
                  <li>
                    <strong>Security cookies:</strong> Detect authentication
                    abuses and protect user data
                  </li>
                  <li>
                    <strong>Session cookies:</strong> Remember your preferences
                    during a single browsing session
                  </li>
                  <li>
                    <strong>Cookie consent cookies:</strong> Remember your
                    cookie preferences
                  </li>
                </ul>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Analytics and Performance Cookies
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                These cookies collect information about how you use our
                Application, such as which pages you visit most often and if you
                receive error messages. All information these cookies collect is
                aggregated and anonymous. It is only used to improve how our
                Application works and performs.
              </p>
              <div className="bg-white rounded p-4 mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Examples:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                  <li>
                    <strong>Google Analytics:</strong> Tracks user behavior,
                    session duration, bounce rate, and demographics
                  </li>
                  <li>
                    <strong>Performance monitoring:</strong> Identifies
                    slow-loading pages and technical errors
                  </li>
                  <li>
                    <strong>Feature usage tracking:</strong> Helps us understand
                    which features are most valuable to users
                  </li>
                  <li>
                    <strong>A/B testing cookies:</strong> Test different
                    versions of pages to improve user experience
                  </li>
                </ul>
              </div>
            </div>

            {/* Functionality Cookies */}
            <div className="bg-purple-50 rounded-lg p-6 mb-6 border border-purple-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Functionality Cookies
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                These cookies allow our Application to remember choices you make
                (such as your username, language, or the region you are in) and
                provide enhanced, more personalized features. These cookies can
                also be used to remember changes you have made to text size,
                fonts, and other customizable parts of web pages.
              </p>
              <div className="bg-white rounded p-4 mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Examples:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                  <li>
                    <strong>User preference cookies:</strong> Remember your
                    display settings, theme preferences, and interface
                    customizations
                  </li>
                  <li>
                    <strong>Language cookies:</strong> Remember your preferred
                    language
                  </li>
                  <li>
                    <strong>Accessibility cookies:</strong> Remember your
                    accessibility preferences
                  </li>
                  <li>
                    <strong>Video player cookies:</strong> Remember your volume
                    and playback settings
                  </li>
                </ul>
              </div>
            </div>

            {/* Advertising Cookies */}
            <div className="bg-green-50 rounded-lg p-6 mb-6 border border-green-100">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Targeting and Advertising Cookies
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                These cookies are used to make advertising messages more
                relevant to you and your interests. They perform functions like
                preventing the same advertisement from continuously reappearing,
                ensuring that ads are properly displayed, and in some cases
                selecting advertisements that are based on your interests.
              </p>
              <div className="bg-white rounded p-4 mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Examples:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                  <li>
                    <strong>Retargeting cookies:</strong> Show you relevant ads
                    on other websites based on your visit to our Application
                  </li>
                  <li>
                    <strong>Social media cookies:</strong> Allow you to share
                    content with social networks
                  </li>
                  <li>
                    <strong>Ad network cookies:</strong> Deliver advertisements
                    relevant to your interests
                  </li>
                  <li>
                    <strong>Conversion tracking:</strong> Measure the
                    effectiveness of advertising campaigns
                  </li>
                </ul>
              </div>
            </div>
          </motion.section>

          {/* Third-Party Cookies */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Third-Party Cookies
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              In addition to our own cookies, we may also use various
              third-party cookies to report usage statistics of the Application,
              deliver advertisements on and through the Application, and so on.
              These third-party services have their own privacy policies and
              cookie policies:
            </p>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Google Analytics
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  We use Google Analytics to analyze the use of our Application.
                  Google Analytics gathers information about Application use by
                  means of cookies. The information gathered is used to create
                  reports about the use of our Application.
                </p>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-600 hover:text-orange-700 underline"
                >
                  Google Privacy Policy
                </a>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">OpenAI</h4>
                <p className="text-sm text-gray-600 mb-2">
                  When you use our AI-powered features, your content is
                  processed by OpenAI&apos;s services. While OpenAI may use cookies
                  for their service operation, your content is not used to train
                  their models.
                </p>
                <a
                  href="https://openai.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-600 hover:text-orange-700 underline"
                >
                  OpenAI Privacy Policy
                </a>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Supabase</h4>
                <p className="text-sm text-gray-600 mb-2">
                  We use Supabase for database and authentication services.
                  Supabase may set cookies to maintain your authentication
                  session and ensure secure access to your data.
                </p>
                <a
                  href="https://supabase.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-600 hover:text-orange-700 underline"
                >
                  Supabase Privacy Policy
                </a>
              </div>
            </div>
          </motion.section>

          {/* How to Control Cookies */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                How to Control Cookies
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to decide whether to accept or reject cookies.
              You can exercise your cookie preferences by clicking on the
              appropriate opt-out links provided in the cookie banner when you
              first visit our Application.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
              Browser Controls
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can also set or amend your web browser controls to accept or
              refuse cookies. If you choose to reject cookies, you may still use
              our Application though your access to some functionality and areas
              may be restricted. As the means by which you can refuse cookies
              through your web browser controls vary from browser to browser,
              you should visit your browser&apos;s help menu for more information.
            </p>
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-100">
              <p className="text-sm text-gray-700 mb-3">
                <strong>Popular browser cookie settings:</strong>
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <strong>Chrome:</strong>{" "}
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 underline"
                  >
                    Cookie settings in Chrome
                  </a>
                </li>
                <li>
                  <strong>Firefox:</strong>{" "}
                  <a
                    href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 underline"
                  >
                    Cookie settings in Firefox
                  </a>
                </li>
                <li>
                  <strong>Safari:</strong>{" "}
                  <a
                    href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 underline"
                  >
                    Cookie settings in Safari
                  </a>
                </li>
                <li>
                  <strong>Edge:</strong>{" "}
                  <a
                    href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 underline"
                  >
                    Cookie settings in Edge
                  </a>
                </li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
              Disabling Specific Cookies
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              In addition to browser controls, you can also disable specific
              types of cookies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                <strong>Google Analytics:</strong> Opt out using the{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 underline"
                >
                  Google Analytics Opt-out Browser Add-on
                </a>
              </li>
              <li>
                <strong>Advertising cookies:</strong> Visit{" "}
                <a
                  href="https://www.youronlinechoices.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 underline"
                >
                  Your Online Choices
                </a>{" "}
                or{" "}
                <a
                  href="https://www.networkadvertising.org/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 underline"
                >
                  Network Advertising Initiative
                </a>
              </li>
            </ul>
          </motion.section>

          {/* Clear Cookies */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                How to Delete Cookies
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you want to delete cookies that are already on your device, you
              can do this through your browser settings. The process varies
              depending on your browser:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>Open your browser&apos;s settings or preferences menu</li>
              <li>Look for the privacy or security section</li>
              <li>Find the option to clear browsing data or cookies</li>
              <li>
                Select the time range (e.g., &quot;All time&quot; to delete all cookies)
              </li>
              <li>Make sure &quot;Cookies&quot; or &quot;Cookies and site data&quot; is checked</li>
              <li>Click &quot;Clear data&quot; or &quot;Delete&quot;</li>
            </ol>
            <p className="text-gray-700 leading-relaxed mt-4">
              <strong>Note:</strong> Deleting cookies will log you out of most
              websites and may reset your preferences on many sites.
            </p>
          </motion.section>

          {/* Do Not Track */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Do Not Track Signals
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Some browsers incorporate a &quot;Do Not Track&quot; (DNT) feature that
              signals to websites you visit that you do not want to have your
              online activity tracked. Currently, there is no uniform technology
              standard for recognizing and implementing DNT signals, and as
              such, we do not currently respond to DNT browser signals or any
              other mechanism that automatically communicates your choice not to
              be tracked online. If a standard for online tracking is adopted
              that we must follow in the future, we will inform you about that
              practice in a revised version of this Cookie Policy.
            </p>
          </motion.section>

          {/* Updates to Policy */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Updates to This Cookie Policy
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              We may update this Cookie Policy from time to time in order to
              reflect changes to the cookies we use or for other operational,
              legal, or regulatory reasons. We encourage you to review this
              Cookie Policy periodically to stay informed about our use of
              cookies and related technologies. The date at the top of this
              Cookie Policy indicates when it was last updated.
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
              <Mail className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">Contact Us</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about our use of cookies or this Cookie
              Policy, please contact us:
            </p>
            <div className="bg-orange-50 rounded-lg p-6 border border-orange-100">
              <p className="text-gray-700">
                <strong>Email:</strong> cookies@studyassistant.com
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Address:</strong> Study Assistant Inc., 123 Education
                Street, Learning City, LC 12345
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
