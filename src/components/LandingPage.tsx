import { Button } from './ui/button';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d0d8e3] via-[#c8cfd9] to-[#b8c2d0] flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.05 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-20 h-20 rounded-3xl bg-[#5b8dc9] flex items-center justify-center"
            >
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </motion.div>
            <h1 className="text-7xl text-[#1e3a5f]">DeskFlow</h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl text-[#2d4a6f] mb-12"
          >
            Streamline your work, boost your productivity
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={onGetStarted}
              className="bg-[#4c7ce5] hover:bg-[#3d6dd4] text-white text-xl px-12 py-6 h-auto rounded-2xl transition-all duration-150 ease-out"
            >
              Get Started
            </Button>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="bg-white/40 backdrop-blur-sm rounded-3xl p-12 border-4 border-[#2d4a6f]"
        >
          <div className="bg-[#e8ecf1] rounded-2xl p-8 mb-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.4 }}
              className="flex items-center gap-6 mb-6"
            >
              <h2 className="text-2xl text-[#1e3a5f]">DeskFlow</h2>
            </motion.div>
            <div className="grid grid-cols-3 gap-6">
              {['To Do', 'Doing', 'Done'].map((title, columnIndex) => (
                <motion.div 
                  key={title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + columnIndex * 0.1, duration: 0.4 }}
                  className="bg-white rounded-xl p-4"
                >
                  <div className="text-sm text-gray-600 mb-2">{title}</div>
                  <div className="space-y-2">
                    {[...Array(columnIndex === 2 ? 1 : 2)].map((_, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 + columnIndex * 0.1 + index * 0.1, duration: 0.3 }}
                        className="bg-gray-100 rounded h-8"
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
