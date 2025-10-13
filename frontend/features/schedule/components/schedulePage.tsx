"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Code,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/forms/button";
import SchedulerWrapper from "@/features/schedule/components/view/schedular-view-filteration";
import { SchedulerProvider } from "@/features/schedule/providers/schedular-provider";

export default function Home() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const installCode = `# First, install shadcn UI in your project:
npx shadcn-ui@latest init

# Then clone the Mina Scheduler repository:
git clone https://github.com/Mina-Massoud/mina-scheduler

# Copy these folders to your project:
# - /types
# - /components/schedule
# - /providers`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen relative flex flex-col">
      <section className="flex-1 relative z-10 container mx-auto flex flex-col items-center justify-center px-4 py-12 md:py-24 text-center">
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Button size="lg" onClick={() => setShowCalendar(true)}>
            Show Me The Library
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowCode(!showCode)}
          >
            How To Install
          </Button>
        </motion.div>

  
        <AnimatePresence>
          {showCode && (
            <motion.div
              className="w-full max-w-[700px] bg-card border rounded-lg p-4 mb-8 relative"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <pre className="overflow-x-auto text-left p-4 bg-muted rounded">
                <code>{installCode}</code>
              </pre>
              <p className="text-left text-sm mt-4">
                Then import in your React component:
              </p>
              <pre className="overflow-x-auto text-left p-4 bg-muted rounded mt-2">
                <code>{`// In your component
import SchedulerWrapper from "@/features/schedule/_components/view/schedular-view-filteration";
import { SchedulerProvider } from "@/features/schedule/providers/schedular-provider";

export default function MyCalendar() {
  return (
    <SchedulerProvider weekStartsOn="monday">
      <SchedulerWrapper 
        stopDayEventSummary={true}
        classNames={{
          tabs: {
            panel: "p-0",
          },
        }}
      />
    </SchedulerProvider>
  )
}`}</code>
              </pre>
              <h3 className="text-left font-medium mt-6 mb-2">Step-by-step:</h3>
              <ol className="text-left text-sm list-decimal ml-5 space-y-2">
                <li>
                  <a
                    href="https://ui.shadcn.com/docs/installation"
                    target="_blank"
                    className="text-primary underline"
                  >
                    Install shadcn UI
                  </a>{" "}
                  in your React/Next.js project
                </li>
                <li>
                  Clone the{" "}
                  <a
                    href="https://github.com/Mina-Massoud/mina-scheduler"
                    target="_blank"
                    className="text-primary underline"
                  >
                    Mina Scheduler repository
                  </a>
                </li>
                <li>
                  for detailed documentation, visit the{" "}
                  <a
                    href="https://github.com/Mina-Massoud/mina-scheduler"
                    target="_blank"
                    className="text-primary underline"
                  >
                    repository page
                  </a>
                </li>
                <li>
                  Copy these folders to your project:
                  <ul className="list-disc ml-5 mt-1">
                    <li>
                      <code className="bg-muted px-1 rounded text-xs">
                        /types
                      </code>{" "}
                      folder with event and scheduler types
                    </li>
                    <li>
                      <code className="bg-muted px-1 rounded text-xs">
                        /components/schedule
                      </code>{" "}
                      folder with calendar components
                    </li>
                    <li>
                      <code className="bg-muted px-1 rounded text-xs">
                        /providers
                      </code>{" "}
                      folder with context providers
                    </li>
                  </ul>
                </li>
                <li>Import and use as shown in the example above</li>
                <li>
                  Contact with me on{" "}
                  <a
                    href="https://mina-massoud.com"
                    target="_blank"
                    className="text-primary underline"
                  >
                    mina-massoud.com
                  </a>{" "}
                  <span className="inline-block animate-bounce">🚀</span>
                </li>
              </ol>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {showCalendar && (
          <motion.div
            onClick={() => setShowCalendar(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card border rounded-lg w-full max-w-[1500px] max-h-[95vh] overflow-auto"
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-2xl font-bold">Mina Scheduler Demo</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalendar(false)}
                >
                  Close
                </Button>
              </div>
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="p-4"
              >
                  <SchedulerWrapper
                    stopDayEventSummary={true}
                    classNames={{
                      tabs: {
                        panel: "p-0",
                      },
                    }}
                  />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
