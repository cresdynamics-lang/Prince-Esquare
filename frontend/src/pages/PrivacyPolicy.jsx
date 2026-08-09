import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Globe, Cookie } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const PrivacyPolicy = () => {
  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <SEO
        title="Privacy Policy - Prince Esquire"
        description="Read our privacy policy to understand how we protect your personal information."
        path="/privacy-policy"
      />
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-16">
              <span className="text-gold-500 text-[10px] tracking-[0.4em] font-bold">YOUR PRIVACY MATTERS</span>
              <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight mt-4">Privacy Policy</h1>
              <p className="text-navy-300 font-light mt-4">
                Last updated: January 2026
              </p>
            </div>

            {/* Introduction */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <p className="text-navy-300 leading-relaxed">
                At Prince Esquire, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you visit our website prince-esquire.co.ke or 
                make a purchase. Please read this policy carefully.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gold-600/10 p-3 rounded-lg">
                  <FileText className="text-gold-500" size={24} />
                </div>
                <h2 className="text-2xl font-serif text-gold-400">Information We Collect</h2>
              </div>

              <div className="space-y-4 text-navy-300">
                <div>
                  <h3 className="text-white font-semibold mb-2">Personal Information</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• Name, email address, phone number</li>
                    <li>• Billing and shipping addresses</li>
                    <li>• Payment information (processed securely)</li>
                    <li>• Account credentials (username, password)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-2">Automatically Collected Information</h3>
                  <ul className="space-y-1 text-sm">
                    <li>• IP address and browser type</li>
                    <li>• Device information and operating system</li>
                    <li>• Referring website and pages visited</li>
                    <li>• Time and date of access</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gold-600/10 p-3 rounded-lg">
                  <Eye className="text-gold-500" size={24} />
                </div>
                <h2 className="text-2xl font-serif text-gold-400">How We Use Your Information</h2>
              </div>

              <div className="space-y-4 text-navy-300">
                <p className="text-sm">We use your information for the following purposes:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Process and fulfill your orders</li>
                  <li>• Send order confirmations and shipping updates</li>
                  <li>• Provide customer support and respond to inquiries</li>
                  <li>• Improve our website, products, and services</li>
                  <li>• Send promotional communications (with your consent)</li>
                  <li>• Prevent fraud and ensure security</li>
                  <li>• Comply with legal obligations</li>
                </ul>
              </div>
            </div>

            {/* Data Security */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gold-600/10 p-3 rounded-lg">
                  <Lock className="text-gold-500" size={24} />
                </div>
                <h2 className="text-2xl font-serif text-gold-400">Data Security</h2>
              </div>

              <div className="space-y-4 text-navy-300">
                <p className="text-sm">We implement appropriate security measures to protect your information:</p>
                <ul className="space-y-1 text-sm">
                  <li>• SSL encryption for all transactions</li>
                  <li>• Secure payment processing via M-Pesa and card providers</li>
                  <li>• Restricted access to personal data</li>
                  <li>• Regular security assessments and updates</li>
                  <li>• Secure data storage and transmission protocols</li>
                </ul>
              </div>
            </div>

            {/* Third-Party Services */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gold-600/10 p-3 rounded-lg">
                  <Globe className="text-gold-500" size={24} />
                </div>
                <h2 className="text-2xl font-serif text-gold-400">Third-Party Services</h2>
              </div>

              <div className="space-y-4 text-navy-300">
                <p className="text-sm">We may share your information with trusted third parties:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Payment processors (M-Pesa, card networks)</li>
                  <li>• Shipping and delivery services</li>
                  <li>• Email service providers (for communications)</li>
                  <li>• Analytics services (to improve our website)</li>
                </ul>
                <p className="text-sm mt-4">We do not sell your personal information to third parties.</p>
              </div>
            </div>

            {/* Cookies */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gold-600/10 p-3 rounded-lg">
                  <Cookie className="text-gold-500" size={24} />
                </div>
                <h2 className="text-2xl font-serif text-gold-400">Cookies and Tracking</h2>
              </div>

              <div className="space-y-4 text-navy-300">
                <p className="text-sm">We use cookies and similar technologies to:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Remember your preferences and login information</li>
                  <li>• Analyze website traffic and user behavior</li>
                  <li>• Provide personalized content and recommendations</li>
                  <li>• Improve website functionality and performance</li>
                </ul>
                <p className="text-sm mt-4">You can manage cookie preferences through your browser settings.</p>
              </div>
            </div>

            {/* Your Rights */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gold-600/10 p-3 rounded-lg">
                  <Shield className="text-gold-500" size={24} />
                </div>
                <h2 className="text-2xl font-serif text-gold-400">Your Rights</h2>
              </div>

              <div className="space-y-4 text-navy-300">
                <p className="text-sm">You have the right to:</p>
                <ul className="space-y-1 text-sm">
                  <li>• Access your personal information</li>
                  <li>• Correct inaccurate information</li>
                  <li>• Request deletion of your information</li>
                  <li>• Opt-out of marketing communications</li>
                  <li>• Object to processing of your information</li>
                  <li>• Data portability (transfer your data)</li>
                </ul>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8">
              <h2 className="text-2xl font-serif text-gold-400 mb-4">Contact Us</h2>
              <p className="text-navy-300 text-sm mb-4">
                If you have questions about this Privacy Policy or your personal information, please contact us:
              </p>
              <ul className="space-y-2 text-navy-300 text-sm">
                <li>• Email: prince.esquire.staff@gmail.com</li>
                <li>• Phone: 0724-494089</li>
                <li>• Address: Prince Esquire Boutique, Nairobi, Kenya</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
