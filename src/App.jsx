import React, { useState, useEffect } from 'react';
import { mockUser } from './data/mockData';
import { ensureAuthToken } from './services/aiService';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { CommandMenu } from './components/common/CommandMenu';

// Screens
import { LandingPage } from './components/screens/LandingPage';
import { AuthPage } from './components/screens/AuthPage';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { AIBrainDashboardScreen } from './components/screens/AIBrainDashboardScreen';
import { MeetingIntelligenceScreen } from './components/screens/MeetingIntelligenceScreen';
import { ConversationMemoryScreen } from './components/screens/ConversationMemoryScreen';
import { DecisionTimelineScreen } from './components/screens/DecisionTimelineScreen';
import { AIChatScreen } from './components/screens/AIChatScreen';
import { TaskManagementScreen } from './components/screens/TaskManagementScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import DocumentLibraryScreen from './components/screens/DocumentLibraryScreen';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('landing');
  const [isCommandMenuOpen, setIsCommandMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(mockUser);

  useEffect(() => {
    ensureAuthToken();
  }, []);

  const isPublicView = activeScreen === 'landing' || activeScreen === 'auth';

  return (
    <div className="min-h-screen bg-[#f2f6f4] text-[#001e2b] flex flex-col selection:bg-emerald-500/20 selection:text-emerald-950 font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
        user={currentUser}
      />

      {/* Main Body Shell */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* App Sidebar (Only shown on app screens, hidden on landing/auth) */}
        {!isPublicView && (
          <Sidebar
            activeScreen={activeScreen}
            onNavigate={setActiveScreen}
          />
        )}

        {/* Content View Container */}
        <main className={`flex-1 overflow-y-auto ${!isPublicView ? 'p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full' : ''}`}>
          
          {activeScreen === 'landing' && (
            <LandingPage onNavigate={setActiveScreen} />
          )}

          {activeScreen === 'auth' && (
            <AuthPage onNavigate={setActiveScreen} />
          )}

          {activeScreen === 'dashboard' && (
            <DashboardScreen
              user={currentUser}
              onNavigate={setActiveScreen}
              onOpenCommandMenu={() => setIsCommandMenuOpen(true)}
            />
          )}

          {activeScreen === 'documents' && (
            <DocumentLibraryScreen />
          )}

          {activeScreen === 'brain' && (
            <AIBrainDashboardScreen onNavigate={setActiveScreen} />
          )}

          {activeScreen === 'meeting' && (
            <MeetingIntelligenceScreen onNavigate={setActiveScreen} />
          )}

          {activeScreen === 'memory' && (
            <ConversationMemoryScreen onNavigate={setActiveScreen} />
          )}

          {activeScreen === 'timeline' && (
            <DecisionTimelineScreen onNavigate={setActiveScreen} />
          )}

          {activeScreen === 'chat' && (
            <AIChatScreen onNavigate={setActiveScreen} />
          )}

          {activeScreen === 'tasks' && (
            <TaskManagementScreen onNavigate={setActiveScreen} />
          )}

          {activeScreen === 'settings' && (
            <SettingsScreen
              user={currentUser}
              onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
              onNavigate={setActiveScreen}
            />
          )}

          {!isPublicView && (
            <Footer onNavigate={setActiveScreen} />
          )}

        </main>
      </div>

      {/* Universal Command Menu Palette (Cmd+K) */}
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
        onNavigate={setActiveScreen}
        onQuickAction={(action) => {
          if (action.includes('Simulate')) setActiveScreen('timeline');
          if (action.includes('Memory')) setActiveScreen('memory');
        }}
      />

    </div>
  );
}
