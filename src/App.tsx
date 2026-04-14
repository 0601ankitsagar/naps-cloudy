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
  History as HistoryIcon,
  Zap,
  Lock,
  Search,
  RotateCcw,
  Trash2,
  Clock
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

interface HistoryItem {
  id: string;
  timestamp: number;
  fileName: string | null;
  textPreview: string;
  result: AuthenticityResult;
}

export default function App() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AuthenticityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem("naps_history");
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    localStorage.setItem("naps_history", JSON.stringify(history));
  }, [history]);

  const addToHistory = (analysisResult: AuthenticityResult, name: string | null, content: string) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      fileName: name,
      textPreview: content.slice(0, 100),
      result: analysisResult
    };
    setHistory(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20 items
  };

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
      addToHistory(analysis, file.name, extractedText);
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
      addToHistory(analysis, null, text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze text");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setText("");
    setFileName(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("naps_history");
  };

  const loadFromHistory = (item: HistoryItem) => {
    setResult(item.result);
    setText(item.textPreview + "...");
    setFileName(item.fileName);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const isApiKeyMissing = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY";

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[140px]" />
      </div>

      {/* API Key Warning */}
      {isApiKeyMissing && (
        <div className="relative z-[60] bg-amber-500/10 backdrop-blur-md border-b border-amber-500/20 p-3 text-center text-sm text-amber-200 font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Gemini API Key is missing. Please add GEMINI_API_KEY to your Vercel Environment Variables.
        </div>
      )}
      
      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-950 border-l border-white/10 z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <HistoryIcon className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-xl font-black text-white tracking-tight">ANALYSIS HISTORY</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <Clock className="w-12 h-12 mb-4" />
                    <p className="font-bold">No history yet</p>
                    <p className="text-xs">Your recent analyses will appear here</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        <Badge className={`text-[10px] ${
                          item.result.score >= 70 ? "bg-green-500/20 text-green-400" : 
                          item.result.score >= 40 ? "bg-amber-500/20 text-amber-400" : 
                          "bg-red-500/20 text-red-400"
                        }`}>
                          Score: {item.result.score}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate mb-1">
                        {item.fileName || "Text Analysis"}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {item.textPreview}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {history.length > 0 && (
                <div className="p-6 border-t border-white/10">
                  <Button 
                    variant="ghost" 
                    onClick={clearHistory}
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 font-bold"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear History
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">NAPS<span className="text-indigo-500">CLOUD</span></span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
              <button onClick={() => setShowHistory(!showHistory)} className="hover:text-white transition-colors flex items-center gap-2">
                <Clock className="w-4 h-4" />
                History
              </button>
              <a href="#" className="hover:text-white transition-colors">Technology</a>
              <a href="#" className="hover:text-white transition-colors">Enterprise</a>
              <div className="h-4 w-px bg-white/10" />
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5">Sign In</Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 px-6">Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Zap className="w-3 h-3" />
            Next-Gen AI Detection
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]"
          >
            Verify Your <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400">Document Integrity</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed"
          >
            Distinguish between human creativity and AI-generated content with our advanced neural linguistic analysis engine.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Input Section */}
          <div className="lg:col-span-7">
            <Card className="bg-slate-900/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/5">
              <Tabs defaultValue="upload" className="w-full" onValueChange={handleReset}>
                <TabsList className="w-full grid grid-cols-2 rounded-none bg-black/20 border-b border-white/5 p-0 h-14">
                  <TabsTrigger value="upload" className="data-[state=active]:bg-white/5 data-[state=active]:text-white rounded-none h-full font-bold text-slate-400 transition-all">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="paste" className="data-[state=active]:bg-white/5 data-[state=active]:text-white rounded-none h-full font-bold text-slate-400 transition-all">
                    <FileText className="w-4 h-4 mr-2" />
                    Paste Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="p-8 m-0">
                  {fileName ? (
                    <div className="border-2 border-indigo-500/30 bg-indigo-500/5 rounded-2xl p-12 text-center relative group">
                      <div className="w-16 h-16 bg-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <FileText className="text-indigo-400 w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{fileName}</h3>
                      <p className="text-slate-400 text-sm mb-6">Document ready for analysis</p>
                      <div className="flex gap-3 justify-center">
                        <Button 
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline" 
                          className="border-white/10 hover:bg-white/5"
                        >
                          Change File
                        </Button>
                        <Button 
                          onClick={handleReset}
                          variant="ghost" 
                          className="text-slate-400 hover:text-white"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative group border-2 border-dashed border-white/10 rounded-2xl p-16 text-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept=".pdf,.docx,.txt"
                      />
                      <div className="relative z-10">
                        <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500">
                          <Upload className="text-indigo-400 w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          Drop your file here
                        </h3>
                        <p className="text-slate-500 font-medium">
                          PDF, DOCX, or TXT
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="paste" className="p-8 m-0">
                  <div className="relative">
                    <Textarea 
                      placeholder="Paste your text here for deep analysis..." 
                      className="min-h-[350px] mb-6 bg-black/20 border-white/10 focus:border-indigo-500/50 focus:ring-0 text-slate-200 placeholder:text-slate-600 rounded-xl resize-none p-6 text-lg leading-relaxed"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                    {text && (
                      <Button 
                        onClick={handleReset}
                        variant="ghost" 
                        size="sm"
                        className="absolute top-4 right-4 text-slate-500 hover:text-white"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                      </Button>
                    )}
                  </div>
                  <Button 
                    onClick={handleTextAnalysis} 
                    disabled={isAnalyzing || !text.trim()}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 h-14 text-lg font-bold shadow-xl shadow-indigo-600/20 rounded-xl transition-all active:scale-[0.98]"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Neural Processing...
                      </>
                    ) : (
                      "Analyze Authenticity"
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-4 text-red-400"
              >
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </div>

          {/* Results Section */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {!result && !isAnalyzing ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <Card className="h-full bg-slate-900/20 border-white/5 flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Search className="text-slate-600 w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Awaiting Input</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Upload a document or paste text to generate a comprehensive authenticity report.
                    </p>
                  </Card>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full"
                >
                  <Card className="h-full bg-slate-900/40 backdrop-blur-xl border-white/10 p-12 flex flex-col items-center justify-center text-center">
                    <div className="relative w-40 h-40 mb-10">
                      <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center animate-pulse">
                          <Zap className="text-indigo-400 w-12 h-12" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-4">Neural Analysis</h3>
                    <div className="space-y-4 w-full max-w-xs">
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>Linguistic Scan</span>
                        <span className="text-indigo-400">Active</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="h-full bg-indigo-500"
                        />
                      </div>
                      <p className="text-xs text-slate-500 font-medium italic">
                        Calculating perplexity and semantic variance...
                      </p>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <Card className="bg-slate-900/60 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/10">
                    <CardHeader className="bg-white/5 border-b border-white/5 pb-6">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-black tracking-tight">ANALYSIS REPORT</CardTitle>
                        <Badge className={`px-4 py-1 rounded-full font-bold text-xs uppercase tracking-widest ${
                          result.score >= 70 ? "bg-green-500/20 text-green-400 border-green-500/30" : 
                          result.score >= 40 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : 
                          "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}>
                          {result.score >= 70 ? "Human" : result.score >= 40 ? "Mixed" : "AI"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-10 flex flex-col items-center">
                      <div className="h-72 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={scoreData}
                              cx="50%"
                              cy="50%"
                              innerRadius={90}
                              outerRadius={115}
                              startAngle={180}
                              endAngle={0}
                              paddingAngle={0}
                              dataKey="value"
                            >
                              <Cell fill={getScoreColor(result.score)} />
                              <Cell fill="rgba(255,255,255,0.05)" />
                              <Label
                                content={({ viewBox }) => {
                                  const { cx, cy } = viewBox as any;
                                  return (
                                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                      <tspan x={cx} y={cy - 10} className="text-6xl font-black fill-white">
                                        {result.score}
                                      </tspan>
                                      <tspan x={cx} y={cy + 30} className="text-sm font-bold fill-slate-500 uppercase tracking-[0.2em]">
                                        AUTHENTIC
                                      </tspan>
                                    </text>
                                  );
                                }}
                              />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="grid grid-cols-2 gap-6 w-full mt-4">
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black block mb-2">Perplexity</span>
                          <span className="text-2xl font-mono font-bold text-white">{result.breakdown.perplexity.toFixed(1)}</span>
                        </div>
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black block mb-2">Burstiness</span>
                          <span className="text-2xl font-mono font-bold text-white">{result.breakdown.burstiness.toFixed(1)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-6 bg-black/20 p-8">
                      <div className="w-full">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <Info className="w-4 h-4 text-indigo-500" />
                          Executive Summary
                        </h4>
                        <p className="text-slate-300 leading-relaxed font-medium">
                          {result.analysis}
                        </p>
                      </div>
                      <Button onClick={handleReset} variant="outline" className="w-full border-white/10 hover:bg-white/5 text-white font-bold h-12 rounded-xl">
                        New Analysis
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* Highlights */}
                  <Card className="bg-slate-900/40 border-white/5 shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Neural Markers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {result.highlights.map((highlight, idx) => (
                        <div key={idx} className="flex gap-4 group">
                          <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${highlight.type === 'human' ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                          <div>
                            <p className="text-sm font-bold text-white italic mb-2 leading-relaxed group-hover:text-indigo-300 transition-colors">"{highlight.text.slice(0, 120)}..."</p>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{highlight.reason}</p>
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
        <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="group p-8 bg-slate-900/40 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="text-indigo-400 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Instant Inference</h3>
            <p className="text-slate-500 font-medium leading-relaxed">High-performance neural processing delivers results in milliseconds.</p>
          </div>
          <div className="group p-8 bg-slate-900/40 rounded-3xl border border-white/5 hover:border-green-500/30 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Lock className="text-green-400 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Zero Retention</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Your data is processed in volatile memory and instantly purged post-analysis.</p>
          </div>
          <div className="group p-8 bg-slate-900/40 rounded-3xl border border-white/5 hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-2">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <HistoryIcon className="text-amber-400 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Semantic Depth</h3>
            <p className="text-slate-500 font-medium leading-relaxed">Deep-layer analysis of perplexity and burstiness for unmatched precision.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl py-20 mt-40">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-black w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white uppercase">NAPS<span className="text-indigo-500">CLOUD</span></span>
          </div>
          <p className="text-slate-500 font-medium mb-12 max-w-md mx-auto">Ensuring transparency and trust in the era of synthetic intelligence.</p>
          <div className="flex justify-center gap-12 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">API</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="mt-16 text-[10px] font-bold text-slate-700 uppercase tracking-[0.3em]">© 2026 NAPS CLOUD. SECURED BY NEURAL PROTOCOL.</p>
        </div>
      </footer>
    </div>
  );
}
