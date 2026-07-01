import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <SEO
        title="Contact Us - Prince Esquire"
        description="Get in touch with Prince Esquire. We're here to help with your luxury fashion needs."
        path="/contact-us"
      />
      <Navbar />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            <div className="text-center mb-16">
              <span className="text-gold-500 text-[10px] tracking-[0.4em] font-bold">GET IN TOUCH</span>
              <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight mt-4">Contact Us</h1>
              <p className="text-navy-300 font-light mt-4 max-w-2xl mx-auto">
                We'd love to hear from you. Whether you have a question about our products, 
                need styling advice, or want to discuss a bespoke order.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div className="space-y-8">
                <div className="bg-navy-900/50 border border-gold-600/10 p-8">
                  <h2 className="text-2xl font-serif text-gold-400 mb-6">Contact Information</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gold-600/10 p-3 rounded-lg">
                        <MapPin className="text-gold-500" size={20} />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Visit Our Boutique</h3>
                        <p className="text-navy-300 text-sm">Prince Esquire Boutique, Nairobi, Kenya</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="bg-gold-600/10 p-3 rounded-lg">
                        <Phone className="text-gold-500" size={20} />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Call Us</h3>
                        <p className="text-navy-300 text-sm">0724-494089</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="bg-gold-600/10 p-3 rounded-lg">
                        <Mail className="text-gold-500" size={20} />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Email Us</h3>
                        <p className="text-navy-300 text-sm">prince.esquire.staff@gmail.com</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="bg-gold-600/10 p-3 rounded-lg">
                        <Clock className="text-gold-500" size={20} />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold mb-1">Business Hours</h3>
                        <p className="text-navy-300 text-sm">Mon - Sat: 9:00 AM - 7:00 PM</p>
                        <p className="text-navy-300 text-sm">Sunday: 10:00 AM - 4:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-navy-900/50 border border-gold-600/10 p-8">
                  <h2 className="text-xl font-serif text-gold-400 mb-4">Connect With Us</h2>
                  <p className="text-navy-300 text-sm mb-6">
                    Follow us on social media for the latest updates, style inspiration, and exclusive offers.
                  </p>
                  <div className="flex space-x-4">
                    <a
                      href="https://instagram.com/prince_esquire.1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gold-600/10 hover:bg-gold-600/20 p-3 rounded-lg transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-500">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </a>
                    <a
                      href="https://facebook.com/prince.esquire254"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gold-600/10 hover:bg-gold-600/20 p-3 rounded-lg transition-colors"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-500">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-navy-900/50 border border-gold-600/10 p-8">
                <h2 className="text-2xl font-serif text-gold-400 mb-6">Send Us a Message</h2>
                
                {submitted && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-600/20 border border-green-600/30 text-green-400 p-4 rounded-lg mb-6"
                  >
                    Thank you for your message! We'll get back to you soon.
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Your Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full bg-navy-950 border border-gold-600/20 text-white px-4 py-3 outline-none focus:border-gold-600 transition-colors"
                      placeholder="Enter your name"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full bg-navy-950 border border-gold-600/20 text-white px-4 py-3 outline-none focus:border-gold-600 transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-navy-950 border border-gold-600/20 text-white px-4 py-3 outline-none focus:border-gold-600 transition-colors"
                      placeholder="What is this about?"
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-semibold mb-2">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full bg-navy-950 border border-gold-600/20 text-white px-4 py-3 outline-none focus:border-gold-600 transition-colors resize-none"
                      placeholder="Tell us more..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gold-600 text-navy-950 py-4 font-bold tracking-wider hover:bg-gold-500 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Send size={18} />
                    <span>Send Message</span>
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;
