/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ChevronRight,
  Info,
  History,
  Zap,
  Lock,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { analyzeAuthenticity, AuthenticityResult } from "@/src/lib/gemini";
import { extractText } from "@/src/lib/documentParser";
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";

export default function App() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AuthenticityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const extractedText = await extractText(file);
      setText(extractedText);
      const analysis = await analyzeAuthenticity(extractedText);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process document");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTextAnalysis = async () => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeAuthenticity(text);
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze text");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setText("");
    setFileName(null);
    setError(null);
  };

  const scoreData = result ? [
    { name: "Score", value: result.score },
    { name: "Remaining", value: 100 - result.score }
  ] : [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e"; // Green
    if (score >= 50) return "#eab308"; // Yellow
    return "#ef4444"; // Red
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Navigation */}
      <nav className="border-bottom border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Naps Cloud</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#" className="hover:text-indigo-600 transition-colors">How it works</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">API</a>
              <Button variant="outline" size="sm" className="rounded-full">Sign In</Button>
              <Button size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-700">Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-4"
          >
            Verify Document <span className="text-indigo-600">Integrity</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Distinguish between human creativity and AI-generated content with our advanced linguistic analysis engine.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-7">
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="w-full grid grid-cols-2 rounded-none bg-slate-50 border-b border-slate-200">
                  <TabsTrigger value="upload" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none py-3">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none py-3">
                    <FileText className="w-4 h-4 mr-2" />
                    Paste Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="p-6 m-0">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all cursor-pointer group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".pdf,.docx,.txt"
                    />
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="text-indigo-600 w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {fileName || "Click to upload or drag and drop"}
                    </h3>
                    <p className="text-sm text-slate-500">
                      PDF, DOCX, or TXT
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="paste" className="p-6 m-0">
                  <Textarea 
                    placeholder="Paste your text here for instant analysis..." 
                    className="min-h-[300px] mb-4 border-slate-200 focus:ring-indigo-500"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <Button 
                    onClick={handleTextAnalysis} 
                    disabled={isAnalyzing || !text.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg font-medium"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing linguistic patterns...
                      </>
                    ) : (
                      "Verify Authenticity"
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-700"
              >
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {!result && !isAnalyzing ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <Card className="h-full border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center p-8 text-center border-dashed">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <Search className="text-slate-400 w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Ready to Analyze</h3>
                    <p className="text-sm text-slate-500">
                      Upload a document or paste text to see your authenticity score and detailed breakdown.
                    </p>
                  </Card>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <Card className="h-full border-slate-200 p-8 flex flex-col items-center justify-center text-center">
                    <div className="relative w-32 h-32 mb-8">
                      <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="text-indigo-600 w-10 h-10 animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing Patterns</h3>
                    <div className="space-y-3 w-full max-w-xs">
                      <div className="flex justify-between text-xs font-medium text-slate-500">
                        <span>Linguistic analysis</span>
                        <span>In progress...</span>
                      </div>
                      <Progress value={66} className="h-1.5" />
                      <p className="text-xs text-slate-400 italic">
                        Checking perplexity and burstiness...
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <Card className="border-slate-200 shadow-lg overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-200 pb-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-bold">Authenticity Score</CardTitle>
                        <Badge variant={result.score >= 70 ? "default" : "destructive"} className={result.score >= 70 ? "bg-green-500" : ""}>
                          {result.score >= 70 ? "Likely Human" : result.score >= 40 ? "Mixed Content" : "Likely AI"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-8 flex flex-col items-center">
                      <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={scoreData}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={100}
                              startAngle={180}
                              endAngle={0}
                              paddingAngle={0}
                              dataKey="value"
                            >
                              <Cell fill={getScoreColor(result.score)} />
                              <Cell fill="#f1f5f9" />
                              <Label
                                value={`${result.score}%`}
                                position="center"
                                className="text-4xl font-bold fill-slate-900"
                              />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute bottom-12 left-0 right-0 text-center">
                          <span className="text-sm font-medium text-slate-500 uppercase tracking-widest">Authentic</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full mt-4">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Perplexity</span>
                          <span className="text-lg font-mono font-bold text-slate-700">{result.breakdown.perplexity.toFixed(1)}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Burstiness</span>
                          <span className="text-lg font-mono font-bold text-slate-700">{result.breakdown.burstiness.toFixed(1)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4 bg-slate-50/50 p-6">
                      <div className="w-full">
                        <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4 text-indigo-600" />
                          Analysis Summary
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {result.analysis}
                        </p>
                      </div>
                      <Button onClick={reset} variant="outline" className="w-full border-slate-200">
                        Analyze Another
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Highlights */}
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Key Findings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {result.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${highlight.type === 'human' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <div>
                            <p className="text-sm font-medium text-slate-900 italic mb-1">"{highlight.text.slice(0, 100)}..."</p>
                            <p className="text-xs text-slate-500">{highlight.reason}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
              <Zap className="text-indigo-600 w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Instant Analysis</h3>
            <p className="text-sm text-slate-500">Get results in seconds with our high-performance inference engine.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-4">
              <Lock className="text-green-600 w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Privacy First</h3>
            <p className="text-sm text-slate-500">Your documents are never stored. Analysis happens in real-time and data is discarded.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-4">
              <History className="text-amber-600 w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Deep Insights</h3>
            <p className="text-sm text-slate-500">We analyze perplexity, burstiness, and semantic structure for maximum accuracy.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
              <ShieldCheck className="text-white w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">Naps Cloud</span>
          </div>
          <p className="text-sm text-slate-500 mb-8">Ensuring transparency and trust in the age of AI.</p>
          <div className="flex justify-center gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-slate-900">Privacy Policy</a>
            <a href="#" className="hover:text-slate-900">Terms of Service</a>
            <a href="#" className="hover:text-slate-900">Contact</a>
          </div>
          <p className="mt-8 text-xs text-slate-400">© 2026 Naps Cloud. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
