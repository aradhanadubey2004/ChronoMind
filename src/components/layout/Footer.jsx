import React from 'react';
import { Brain, Shield, Github, Twitter, Linkedin, Heart } from 'lucide-react';

export const Footer = ({ onNavigate }) => {
  return (
    <footer className="mt-12 border-t border-[#D1E2D7] bg-white text-slate-600 text-xs py-8 px-4 rounded-2xl shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand & Copyright */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#00684A] text-white flex items-center justify-center font-bold shadow-xs">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-[#001E2B] text-sm">ChronoMind AI Platform</p>
            <p className="text-[11px] text-slate-500">
              Cognitive Memory Architecture with Zero-Knowledge Encryption
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 font-semibold text-slate-600">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-[#00684A] transition-colors">
            Dashboard
          </button>
          <button onClick={() => onNavigate('memory')} className="hover:text-[#00684A] transition-colors">
            Memory Vault
          </button>
          <button onClick={() => onNavigate('timeline')} className="hover:text-[#00684A] transition-colors">
            Decision Timeline
          </button>
          <button onClick={() => onNavigate('chat')} className="hover:text-[#00684A] transition-colors">
            AI Assistant
          </button>
          <button onClick={() => onNavigate('settings')} className="hover:text-[#00684A] transition-colors">
            Settings
          </button>
        </div>

        {/* Security Badge & Social Icons */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E8F3EC] border border-[#C9DFD2] text-[#00684A] font-mono text-[10px] font-bold">
            <Shield className="w-3 h-3 text-[#00684A]" />
            <span>SOC2 Type II Ready</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <a href="#github" className="hover:text-slate-700 transition-colors p-1" title="GitHub Repository">
              <Github className="w-4 h-4" />
            </a>
            <a href="#twitter" className="hover:text-[#00684A] transition-colors p-1" title="Twitter / X">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#linkedin" className="hover:text-blue-600 transition-colors p-1" title="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-medium gap-2">
        <p>© 2026 ChronoMind AI Inc. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Built with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for AI Studio
        </p>
      </div>
    </footer>
  );
};
