import React from 'react';
import { motion } from 'framer-motion';
import { Shirt, Ruler, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SEO from '../components/SEO';

const SizeGuide = () => {
  const shirtSizes = [
    { size: 'S', chest: '36-38', neck: '14-14.5', sleeve: '32-33' },
    { size: 'M', chest: '38-40', neck: '15-15.5', sleeve: '33-34' },
    { size: 'L', chest: '40-42', neck: '16-16.5', sleeve: '34-35' },
    { size: 'XL', chest: '42-44', neck: '17-17.5', sleeve: '35-36' },
    { size: 'XXL', chest: '44-46', neck: '18-18.5', sleeve: '36-37' },
    { size: '3XL', chest: '46-48', neck: '19-19.5', sleeve: '37-38' }
  ];

  const shoeSizes = [
    { uk: '6', us: '7', eu: '40', cm: '25' },
    { uk: '7', us: '8', eu: '41', cm: '26' },
    { uk: '8', us: '9', eu: '42', cm: '27' },
    { uk: '9', us: '10', eu: '43', cm: '28' },
    { uk: '10', us: '11', eu: '44', cm: '29' },
    { uk: '11', us: '12', eu: '45', cm: '30' },
    { uk: '12', us: '13', eu: '46', cm: '31' }
  ];

  const trouserSizes = [
    { size: '30', waist: '30', length: '30' },
    { size: '32', waist: '32', length: '32' },
    { size: '34', waist: '34', length: '32' },
    { size: '36', waist: '36', length: '34' },
    { size: '38', waist: '38', length: '34' }
  ];

  return (
    <div className="bg-navy-950 min-h-screen font-serif">
      <SEO
        title="Size Guide - Prince Esquire"
        description="Find your perfect fit with our comprehensive size guide for shirts, shoes, and trousers."
        path="/size-guide"
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
              <span className="text-gold-500 text-[10px] tracking-[0.4em] font-bold">FIND YOUR FIT</span>
              <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight mt-4">Size Guide</h1>
              <p className="text-navy-300 font-light mt-4 max-w-2xl mx-auto">
                Use our comprehensive size guide to find your perfect fit. If you're between sizes, 
                we recommend sizing up for comfort.
              </p>
            </div>

            {/* Shirt Sizes */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gold-600/10 p-3 rounded-lg">
                  <Shirt className="text-gold-500" size={24} />
                </div>
                <h2 className="text-2xl font-serif text-gold-400">Shirt Sizes</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gold-600/20">
                      <th className="text-left text-gold-500 py-3 px-4">Size</th>
                      <th className="text-left text-gold-500 py-3 px-4">Chest (in)</th>
                      <th className="text-left text-gold-500 py-3 px-4">Neck (in)</th>
                      <th className="text-left text-gold-500 py-3 px-4">Sleeve (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shirtSizes.map((item, index) => (
                      <tr key={index} className="border-b border-gold-600/10">
                        <td className="text-white py-3 px-4 font-semibold">{item.size}</td>
                        <td className="text-navy-300 py-3 px-4">{item.chest}</td>
                        <td className="text-navy-300 py-3 px-4">{item.neck}</td>
                        <td className="text-navy-300 py-3 px-4">{item.sleeve}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shoe Sizes */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gold-600/10 p-3 rounded-lg">
                  <Ruler className="text-gold-500" size={24} />
                </div>
                <h2 className="text-2xl font-serif text-gold-400">Shoe Sizes</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gold-600/20">
                      <th className="text-left text-gold-500 py-3 px-4">UK</th>
                      <th className="text-left text-gold-500 py-3 px-4">US</th>
                      <th className="text-left text-gold-500 py-3 px-4">EU</th>
                      <th className="text-left text-gold-500 py-3 px-4">CM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shoeSizes.map((item, index) => (
                      <tr key={index} className="border-b border-gold-600/10">
                        <td className="text-white py-3 px-4 font-semibold">{item.uk}</td>
                        <td className="text-navy-300 py-3 px-4">{item.us}</td>
                        <td className="text-navy-300 py-3 px-4">{item.eu}</td>
                        <td className="text-navy-300 py-3 px-4">{item.cm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trouser Sizes */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8 mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-gold-600/10 p-3 rounded-lg">
                  <Users className="text-gold-500" size={24} />
                </div>
                <h2 className="text-2xl font-serif text-gold-400">Trouser Sizes</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gold-600/20">
                      <th className="text-left text-gold-500 py-3 px-4">Size</th>
                      <th className="text-left text-gold-500 py-3 px-4">Waist (in)</th>
                      <th className="text-left text-gold-500 py-3 px-4">Length (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trouserSizes.map((item, index) => (
                      <tr key={index} className="border-b border-gold-600/10">
                        <td className="text-white py-3 px-4 font-semibold">{item.size}</td>
                        <td className="text-navy-300 py-3 px-4">{item.waist}</td>
                        <td className="text-navy-300 py-3 px-4">{item.length}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-navy-900/50 border border-gold-600/10 p-8">
              <h2 className="text-2xl font-serif text-gold-400 mb-6">Measuring Tips</h2>
              <div className="grid md:grid-cols-2 gap-6 text-navy-300 text-sm">
                <div>
                  <h3 className="text-white font-semibold mb-2">For Shirts</h3>
                  <ul className="space-y-1">
                    <li>• Measure around the fullest part of your chest</li>
                    <li>• Measure neck at the base where collar sits</li>
                    <li>• Measure sleeve from center back to wrist</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">For Shoes</h3>
                  <ul className="space-y-1">
                    <li>• Measure foot length in centimeters</li>
                    <li>• Measure both feet and use larger size</li>
                    <li>• Consider wearing socks for accurate fit</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">For Trousers</h3>
                  <ul className="space-y-1">
                    <li>• Measure waist at natural waistline</li>
                    <li>• Measure from waist to desired length</li>
                    <li>• Consider rise preference (low, mid, high)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-2">General Advice</h3>
                  <ul className="space-y-1">
                    <li>• If between sizes, size up for comfort</li>
                    <li>• Consider fabric stretch when choosing size</li>
                    <li>• Contact us for personalized fitting advice</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="mt-12 text-center">
              <p className="text-navy-300 mb-4">Need help finding your size?</p>
              <a href="/contact-us" className="text-gold-500 hover:text-gold-400 font-semibold">
                Contact Our Support Team
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SizeGuide;
