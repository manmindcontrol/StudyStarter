"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Scale,
  AlertTriangle,
  UserCheck,
  CreditCard,
  Ban,
  Shield,
  Mail,
} from "lucide-react";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl"></div>
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
            <Scale className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-6xl font-bold text-white mb-4"
          >
            Terms of Use
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
          {/* Agreement to Terms */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Agreement to Terms
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              These Terms of Use constitute a legally binding agreement made
              between you, whether personally or on behalf of an entity ("you")
              and Study Assistant ("Company", "we", "us", or "our"), concerning
              your access to and use of the Study Assistant website and
              application (collectively, the "Application").
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree that by accessing the Application, you have read,
              understood, and agree to be bound by all of these Terms of Use. IF
              YOU DO NOT AGREE WITH ALL OF THESE TERMS OF USE, THEN YOU ARE
              EXPRESSLY PROHIBITED FROM USING THE APPLICATION AND YOU MUST
              DISCONTINUE USE IMMEDIATELY.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Supplemental terms and conditions or documents that may be posted
              on the Application from time to time are hereby expressly
              incorporated herein by reference. We reserve the right, in our
              sole discretion, to make changes or modifications to these Terms
              of Use at any time and for any reason. We will alert you about any
              changes by updating the "Last updated" date of these Terms of Use,
              and you waive any right to receive specific notice of each such
              change. It is your responsibility to periodically review these
              Terms of Use to stay informed of updates.
            </p>
          </motion.section>

          {/* Intellectual Property Rights */}
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
                Intellectual Property Rights
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Unless otherwise indicated, the Application is our proprietary
              property and all source code, databases, functionality, software,
              website designs, audio, video, text, photographs, and graphics on
              the Application (collectively, the "Content") and the trademarks,
              service marks, and logos contained therein (the "Marks") are owned
              or controlled by us or licensed to us, and are protected by
              copyright and trademark laws and various other intellectual
              property rights and unfair competition laws of the United States,
              international copyright laws, and international conventions.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              The Content and the Marks are provided on the Application "AS IS"
              for your information and personal use only. Except as expressly
              provided in these Terms of Use, no part of the Application and no
              Content or Marks may be copied, reproduced, aggregated,
              republished, uploaded, posted, publicly displayed, encoded,
              translated, transmitted, distributed, sold, licensed, or otherwise
              exploited for any commercial purpose whatsoever, without our
              express prior written permission.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Provided that you are eligible to use the Application, you are
              granted a limited license to access and use the Application and to
              download or print a copy of any portion of the Content to which
              you have properly gained access solely for your personal,
              non-commercial use. We reserve all rights not expressly granted to
              you in and to the Application, the Content, and the Marks.
            </p>
          </motion.section>

          {/* User Representations */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20 hover:shadow-2xl transition-shadow duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                User Representations
              </h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              By using the Application, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>
                All registration information you submit will be true, accurate,
                current, and complete
              </li>
              <li>
                You will maintain the accuracy of such information and promptly
                update such registration information as necessary
              </li>
              <li>
                You have the legal capacity and you agree to comply with these
                Terms of Use
              </li>
              <li>
                You are not a minor in the jurisdiction in which you reside, or
                if a minor, you have received parental permission to use the
                Application
              </li>
              <li>
                You will not access the Application through automated or
                non-human means, whether through a bot, script, or otherwise
              </li>
              <li>
                You will not use the Application for any illegal or unauthorized
                purpose
              </li>
              <li>
                Your use of the Application will not violate any applicable law
                or regulation
              </li>
              <li>
                You will not use the Application to upload, transmit, or
                distribute any viruses, malware, or harmful code
              </li>
              <li>
                You will not attempt to bypass any security measures or access
                restricted areas of the Application
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              If you provide any information that is untrue, inaccurate, not
              current, or incomplete, we have the right to suspend or terminate
              your account and refuse any and all current or future use of the
              Application (or any portion thereof).
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
              If you have any questions about these Terms of Use, please contact
              us:
            </p>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@studyassistant.com
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
