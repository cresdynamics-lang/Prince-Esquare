import React from 'react';
import { motion } from 'framer-motion';
import { Scissors, Ruler, Award, Clock, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const BespokeServices = () => {
  const services = [
    {
      icon: <Scissors size={32} />,
      title: 'Custom Tailoring',
      description: 'Experience the art of bespoke tailoring with our made-to-measure suits, shirts, and trousers. Each piece is crafted to your exact specifications.',
      features: ['Personalized measurements', 'Premium fabric selection', 'Multiple fitting sessions', 'Lifetime alterations']
    },
    {
      icon: <Ruler size={32} />,
      title: 'Made-to-Measure Shirts',
      description: 'Elevate your wardrobe with custom shirts designed for the perfect fit. Choose from our extensive collection of fine fabrics and collar styles.',
      features: ['Custom collar and cuff styles', 'Monogramming available', 'Premium Egyptian cotton', 'Perfect fit guarantee']
    },
    {
      icon: <Award size={32} />,
      title: 'Bespoke Suits',
      description: 'Our master tailors create one-of-a-kind suits using traditional techniques combined with modern styling for the discerning gentleman.',
      features: ['Hand-stitched details', 'Italian and British fabrics', 'Personalized styling', '6-8 week delivery']
    },
    {
      icon: <Clock size={32} />,
      title: 'Express Service',
      description: 'Need something sooner? Our express service delivers custom pieces within 2-3 weeks without compromising on quality.',
      features: ['Priority scheduling', 'Rapid turnaround', 'Same quality standards', 'Dedicated support']
    }
  ];

  const process = [
    { step: '01', title: 'Consultation', description: 'Meet with our style consultants to discuss your preferences, lifestyle, and requirements.' },
    { step: '02', title: 'Measurement', description: 'Our master tailors take precise measurements to ensure the perfect fit.' },
    { step: '03', title: 'Fabric Selection', description: 'Choose from our curated collection of premium fabrics from around the world.' },
    { step: '04', title: 'Fitting', description: 'Multiple fitting sessions to refine the fit and ensure complete satisfaction.' },
    { step: '05', title: 'Delivery', description: 'Receive your bespoke piece, perfectly tailored and ready to wear.' }
  ];

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <SEO
        title="Bespoke Services - Prince Esquire"
        description="Experience luxury bespoke tailoring at Prince Esquire. Custom suits, shirts, and made-to-measure services."
        path="/bespoke-services"
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
              <span className="text-gold-500 text-[10px] tracking-[0.4em] font-bold">EXCLUSIVE TAILORING</span>
              <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight mt-4">Bespoke Services</h1>
              <p className="text-navy-300 font-light mt-4 max-w-2xl mx-auto">
                Discover the pinnacle of luxury fashion with our bespoke tailoring services. 
                Every piece is crafted exclusively for you, combining traditional craftsmanship with modern elegance.
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-20">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-navy-900/50 border border-gold-600/10 p-8 hover:border-gold-600/30 transition-colors"
                >
                  <div className="bg-gold-600/10 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                    <div className="text-gold-500">{service.icon}</div>
                  </div>
                  <h3 className="text-2xl font-serif text-white mb-4">{service.title}</h3>
                  <p className="text-navy-300 font-light mb-6">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-navy-300 text-sm">
                        <CheckCircle size={16} className="text-gold-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Process Section */}
            <div className="mb-20">
              <h2 className="text-3xl font-serif text-gold-400 text-center mb-12">Our Process</h2>
              <div className="grid md:grid-cols-5 gap-6">
                {process.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-gold-600/30 text-5xl font-bold mb-4">{item.step}</div>
                    <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                    <p className="text-navy-300 text-sm">{item.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-gold-600/20 to-gold-600/10 border border-gold-600/30 p-12 text-center">
              <h2 className="text-3xl font-serif text-white mb-4">Begin Your Bespoke Journey</h2>
              <p className="text-navy-300 mb-8 max-w-xl mx-auto">
                Schedule a consultation with our master tailors and experience the art of custom craftsmanship.
              </p>
              <button className="bg-gold-600 text-navy-950 px-8 py-4 font-bold tracking-wider hover:bg-gold-500 transition-colors">
                Book Consultation
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BespokeServices;
