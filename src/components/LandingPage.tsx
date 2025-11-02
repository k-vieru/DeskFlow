import { Button } from './ui/button';
import { Check } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d0d8e3] via-[#c8cfd9] to-[#b8c2d0] flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-3xl bg-[#5b8dc9] flex items-center justify-center">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <h1 className="text-7xl text-[#1e3a5f]">DeskFlow</h1>
          </div>
          <p className="text-2xl text-[#2d4a6f] mb-12">
            Streamline your work, boost your productivity
          </p>

          <Button
            onClick={onGetStarted}
            className="bg-[#4c7ce5] hover:bg-[#3d6dd4] text-white text-xl px-12 py-6 h-auto rounded-2xl"
          >
            Get Started
          </Button>
        </div>

        <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-12 border-4 border-[#2d4a6f]">
          <div className="bg-[#e8ecf1] rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-6 mb-6">
              <h2 className="text-2xl text-[#1e3a5f]">DeskFlow</h2>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-2">To Do</div>
                <div className="space-y-2">
                  <div className="bg-gray-100 rounded h-8"></div>
                  <div className="bg-gray-100 rounded h-8"></div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-2">Doing</div>
                <div className="space-y-2">
                  <div className="bg-gray-100 rounded h-8"></div>
                  <div className="bg-gray-100 rounded h-8"></div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="text-sm text-gray-600 mb-2">Done</div>
                <div className="space-y-2">
                  <div className="bg-gray-100 rounded h-8"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
