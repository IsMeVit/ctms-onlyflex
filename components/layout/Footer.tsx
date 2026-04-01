"use client";

import { Film, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { ButtonRed } from '../ui/ButtonRed';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const handleNavigate = (page: string) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-white">OnlyFlix</h3>
                <p className="text-xs text-zinc-500">Premium Cinema</p>
              </div>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Experience movies like never before with state-of-the-art technology, 
              luxury seating, and unforgettable cinematic moments.
            </p>
            <div className="flex gap-3 text-white">
              <a href="#" className="w-10 h-10 bg-zinc-900 cursor-pointer hover:bg-red-500 border border-zinc-800 rounded-lg flex items-center justify-center transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 bg-zinc-900 cursor-pointer hover:bg-red-500 border border-zinc-800 rounded-lg flex items-center justify-center transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 bg-zinc-900 cursor-pointer hover:bg-red-500 border border-zinc-800 rounded-lg flex items-center justify-center transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 bg-zinc-900 cursor-pointer hover:bg-red-500 border border-zinc-800 rounded-lg flex items-center justify-center transition-all">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate("now-showing")}
                  className="text-zinc-400 cursor-pointer hover:text-red-500 transition-colors text-sm"
                >
                  Now Showing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate("coming-soon")}
                  className="text-zinc-400 cursor-pointer hover:text-red-500 transition-colors text-sm"
                >
                  Coming Soon
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleNavigate("showtimes")}
                  className="text-zinc-400 cursor-pointer hover:text-red-500 transition-colors text-sm"
                >
                  Showtimes
                </button>
              </li>
              <li>
                <a href="#" className="text-zinc-400 cursor-pointer hover:text-red-500 transition-colors text-sm">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 cursor-pointer hover:text-red-500 transition-colors text-sm">
                  Gift Cards
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-6 text-white">Support</h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-zinc-400 cursor-pointer hover:text-red-500 transition-colors text-sm">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 cursor-pointer hover:text-red-500 transition-colors text-sm">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 cursor-pointer hover:text-red-500 transition-colors text-sm">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 cursor-pointer hover:text-red-500 transition-colors text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-zinc-400 cursor-pointer hover:text-red-500 transition-colors text-sm">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-6 text-white">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 cursor-pointer text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-zinc-400 text-sm cursor-pointer hover:text-red-500 transition-colors  ">
                  123 Cinema Boulevard<br />Los Angeles, CA 90028
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 cursor-pointer text-red-500 flex-shrink-0" />
                <span className="text-zinc-400 text-sm cursor-pointer hover:text-red-500 transition-colors  ">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 cursor-pointer text-red-500 flex-shrink-0" />
                <span className="text-zinc-400 text-sm cursor-pointer hover:text-red-500 transition-colors  ">info@cinemax.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-zinc-800 pt-8 mb-8">
          <div className="max-w-2xl mx-auto text-center">
            <h4 className="font-semibold text-xl mb-3 text-white">Stay Updated</h4>
            <p className="text-zinc-400 text-sm mb-6">
              Subscribe to our newsletter for exclusive offers and movie updates
            </p>
            <div className="flex gap-3 max-w-md mx-auto text-zinc-200">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-transparent text-sm"
              />
              <ButtonRed className="text-white/90 cursor-pointer px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 rounded-lg font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all whitespace-nowrap">
                Subscribe
              </ButtonRed>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-500 text-sm">
            © 2026 OnlyFlix. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-zinc-500 hover:text-red-500 text-sm transition-colors">
              Privacy
            </a>
            <a href="#" className="text-zinc-500 hover:text-red-500 text-sm transition-colors">
              Terms
            </a>
            <a href="#" className="text-zinc-500 hover:text-red-500 text-sm transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
