'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { testService } from '@/lib/services/tests';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Question, Test } from '@/types';
import { MLQuestionParser, ParsedQuestion } from '@/lib/ml-question-parser';
import { Upload, FileText, CheckCircle2, Trash2, Sparkles, AlertCircle, FileSpreadsheet } from 'lucide-react';

type OptionInput = { text: string };

type QuestionFormData = {
  text: string;
  options: OptionInput[];
  correctOptionIndex: number;
  marks: number;
  negativeMarks: number;
  solution: string;
};

type BulkQuestion = {
  text: string;
  options: OptionInput[];
  correctOptionIndex?: number;
  marks?: number;
  negativeMarks?: number;
  solution?: string;
};

export default function NewQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const { adminUser } = useAuth();
  const testId = params.id as string;
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [loadingTest, setLoadingTest] = useState(true);
  const [creationMode, setCreationMode] = useState<'single' | 'bulk' | 'ai_import'>('single');

  // AI & File Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawText, setRawText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSavingImport, setIsSavingImport] = useState(false);
  const [globalMarks, setGlobalMarks] = useState(4);
  const [globalNegMarks, setGlobalNegMarks] = useState(1);
  const [selectedFileName, setSelectedFileName] = useState('');

  // Single question form
  const { register, control, handleSubmit: handleSingleSubmit, setValue } = useForm<QuestionFormData>({
    defaultValues: {
      text: '',
      options: [{ text: '' }, { text: '' }],
      correctOptionIndex: 0,
      marks: 4,
      negativeMarks: 1,
      solution: '',
    },
  });

  // Bulk questions form
  const {
    register: registerBulk,
    control: controlBulk,
    handleSubmit: handleBulkSubmit,
  } = useForm<{ questions: BulkQuestion[] }>({
    defaultValues: {
      questions: [
        {
          text: '',
          options: [{ text: '' }, { text: '' }],
          marks: 4,
          negativeMarks: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'options' });
  const { fields: bulkFields, append: appendBulk, remove: removeBulk } = useFieldArray({
    control: controlBulk,
    name: 'questions',
  });

  useEffect(() => {
    async function loadTest() {
      try {
        const test = await testService.get(testId);
        setCurrentTest(test);
        if (!test) {
          toast.error('Test not found');
        }
      } catch (error) {
        console.error('Failed to load test', error);
        toast.error('Failed to load test');
      } finally {
        setLoadingTest(false);
      }
    }

    setValue('text', '');
    loadTest();
  }, [testId, setValue]);

  const onSingleSubmit = async (data: QuestionFormData) => {
    if (!adminUser?.uid) return toast.error('Not authenticated');
    if (!testId) return toast.error('Invalid test');
    if (!currentTest) return toast.error('Test not loaded');

    try {
      const existingQuestions = (currentTest.questions || []) as Question[];
      const payload: Question = {
        id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
        title: data.text,
        description: data.solution || '',
        testId: testId,
        options: data.options.map((o: OptionInput) => ({ text: o.text })),
        correctOptionIndex: Number(data.correctOptionIndex),
        marks: Number(data.marks) || 4,
        negativeMarks: Number(data.negativeMarks) || 1,
        solution: data.solution,
        status: 'active',
        text: data.text,
      } as Question;
      await testService.update(
        testId,
        {
          questions: [...existingQuestions, payload],
        } as Partial<Test>,
        adminUser.uid,
        currentTest
      );
      toast.success('Question created');
      router.push(`/admin/tests/${testId}/questions`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create question');
    }
  };

  const onBulkSubmit = async (data: { questions: BulkQuestion[] }) => {
    if (!adminUser?.uid) return toast.error('Not authenticated');
    if (!testId) return toast.error('Invalid test');
    if (!currentTest) return toast.error('Test not loaded');

    try {
      let createdCount = 0;
      const existingQuestions = (currentTest.questions || []) as Question[];

      for (const q of data.questions) {
        if (!q.text.trim()) {
          toast.error('Question text cannot be empty');
          continue;
        }

        const payload: Question = {
          id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
          title: q.text,
          description: q.solution || '',
          testId: testId,
          options: q.options.map((o: OptionInput) => ({ text: o.text })),
          correctOptionIndex: q.correctOptionIndex ?? 0,
          marks: Number(q.marks) || 4,
          negativeMarks: Number(q.negativeMarks) || 1,
          solution: q.solution || '',
          status: 'active',
          text: q.text,
        } as Question;

        existingQuestions.push(payload);
        createdCount++;
      }

      await testService.update(
        testId,
        {
          questions: existingQuestions,
        } as Partial<Test>,
        adminUser.uid,
        currentTest
      );

      toast.success(`${createdCount} questions created successfully`);
      router.push(`/admin/tests/${testId}/questions`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to create questions');
    }
  };

  // --- AI & FILE IMPORT HANDLERS ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsParsing(true);
    try {
      const parsed = await MLQuestionParser.parseFile(file);
      if (parsed.length === 0) {
        toast.error('Could not detect questions in this file. Please verify file format.');
      } else {
        setParsedQuestions(parsed);
        toast.success(`ML Engine successfully parsed ${parsed.length} questions from ${file.name}!`);
      }
    } catch (error: any) {
      console.error('File parsing failed:', error);
      toast.error(error?.message || 'Failed to parse file');
    } finally {
      setIsParsing(false);
    }
  };

  const handleParseRawText = () => {
    if (!rawText.trim()) {
      toast.error('Please paste question text first');
      return;
    }

    setIsParsing(true);
    try {
      const parsed = MLQuestionParser.parseRawText(rawText);
      if (parsed.length === 0) {
        toast.error('Could not detect any questions. Ensure questions have options like [A], [B] or (A), (B).');
      } else {
        setParsedQuestions(parsed);
        toast.success(`ML Engine extracted ${parsed.length} questions with answers!`);
      }
    } catch (error: any) {
      console.error('Text parsing failed:', error);
      toast.error('Failed to parse text');
    } finally {
      setIsParsing(false);
    }
  };

  const applyGlobalMarks = () => {
    setParsedQuestions(prev =>
      prev.map(q => ({
        ...q,
        marks: globalMarks,
        negativeMarks: globalNegMarks,
      }))
    );
    toast.success(`Applied Marks: ${globalMarks}, Negative: ${globalNegMarks} to all questions`);
  };

  const updateParsedQuestion = (index: number, updatedFields: Partial<ParsedQuestion>) => {
    setParsedQuestions(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updatedFields };
      return copy;
    });
  };

  const removeParsedQuestion = (index: number) => {
    setParsedQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveImportedQuestions = async () => {
    if (!adminUser?.uid) return toast.error('Not authenticated');
    if (!testId || !currentTest) return toast.error('Test not loaded');
    if (parsedQuestions.length === 0) return toast.error('No questions to save');

    setIsSavingImport(true);
    try {
      const existingQuestions = (currentTest.questions || []) as Question[];
      const newQuestions: Question[] = parsedQuestions.map(q => ({
        id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
        title: q.text,
        text: q.text,
        description: q.solution || '',
        testId: testId,
        options: q.options.map(o => ({ text: o.text })),
        correctOptionIndex: q.correctOptionIndex ?? 0,
        marks: Number(q.marks) || globalMarks,
        negativeMarks: Number(q.negativeMarks) || globalNegMarks,
        solution: q.solution || '',
        status: 'active',
      } as Question));

      await testService.update(
        testId,
        {
          questions: [...existingQuestions, ...newQuestions],
        } as Partial<Test>,
        adminUser.uid,
        currentTest
      );

      toast.success(`Successfully saved ${newQuestions.length} questions to the test!`);
      router.push(`/admin/tests/${testId}/questions`);
    } catch (error: any) {
      console.error('Error saving imported questions:', error);
      toast.error(error?.message || 'Failed to save questions');
    } finally {
      setIsSavingImport(false);
    }
  };

  if (loadingTest) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <p className="text-sm text-gray-500">Loading test...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-gray-900">Add Questions</h1>
      <p className="text-gray-600 mb-6">Add single, multiple, or import entire exam papers using AI & ML parsing</p>

      {/* Mode Selection */}
      <div className="bg-white p-6 rounded-lg shadow mb-6 border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Creation Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label
            className={`flex items-center gap-3 p-3.5 border rounded-lg cursor-pointer transition-all ${
              creationMode === 'single'
                ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm font-medium'
                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <input
              type="radio"
              checked={creationMode === 'single'}
              onChange={() => setCreationMode('single')}
              className="w-4 h-4 text-blue-600"
            />
            <span>Add Single Question</span>
          </label>

          <label
            className={`flex items-center gap-3 p-3.5 border rounded-lg cursor-pointer transition-all ${
              creationMode === 'bulk'
                ? 'border-blue-600 bg-blue-50/50 text-blue-900 shadow-sm font-medium'
                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <input
              type="radio"
              checked={creationMode === 'bulk'}
              onChange={() => setCreationMode('bulk')}
              className="w-4 h-4 text-blue-600"
            />
            <span>Manual Bulk Add</span>
          </label>

          <label
            className={`flex items-center gap-3 p-3.5 border rounded-lg cursor-pointer transition-all ${
              creationMode === 'ai_import'
                ? 'border-purple-600 bg-purple-50 text-purple-950 shadow-sm font-semibold ring-2 ring-purple-400'
                : 'border-purple-200 bg-purple-50/30 hover:bg-purple-50 text-purple-900'
            }`}
          >
            <input
              type="radio"
              checked={creationMode === 'ai_import'}
              onChange={() => setCreationMode('ai_import')}
              className="w-4 h-4 text-purple-600"
            />
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Smart AI Import (TXT, CSV, Excel)</span>
            </span>
          </label>
        </div>
      </div>

      {/* AI & FILE IMPORT MODE */}
      {creationMode === 'ai_import' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Machine Learning Exam Question Importer</h2>
                <p className="text-sm text-gray-600">
                  Upload any <b>TXT, CSV, Excel (.xlsx, .xls)</b> file or paste raw questions in Hindi / English. ML will automatically extract questions, options, and answer keys.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-white/80 hover:bg-white rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group shadow-xs"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Click to Upload Exam File</p>
                  <p className="text-xs text-gray-500 mt-1">Supports .TXT, .CSV, .XLSX, .XLS (Up to 20MB)</p>
                </div>
                {selectedFileName && (
                  <span className="text-xs font-medium text-purple-700 bg-purple-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    {selectedFileName}
                  </span>
                )}
              </div>

              {/* Paste Text Area */}
              <div className="bg-white rounded-xl p-4 border border-purple-200 flex flex-col shadow-xs">
                <label className="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  Or Paste Question Text Directly:
                </label>
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder="Paste questions here, for example:&#10;Q1. मानव शरीर में कपाल तंत्रिकाओं की संख्या?&#10;[A] 10 जोड़ी&#10;[B] 12 जोड़ी&#10;[C] 14 जोड़ी&#10;[D] 31 जोड़ी&#10;सही उत्तर: [B] 12 जोड़ी"
                  rows={4}
                  className="w-full text-xs p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-gray-900 font-mono resize-none flex-1"
                />
                <button
                  type="button"
                  onClick={handleParseRawText}
                  disabled={isParsing || !rawText.trim()}
                  className="mt-2 w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {isParsing ? 'Analyzing with ML...' : 'Parse Text with ML Engine'}
                </button>
              </div>
            </div>
          </div>

          {/* PARSED QUESTIONS PREVIEW & CONTROLS */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-4">
              {/* Sticky Action Toolbar */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-md flex flex-wrap items-center justify-between gap-4 sticky top-4 z-20">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {parsedQuestions.length} Questions Extracted
                  </span>
                  <span className="text-xs text-gray-500">Review & edit below before saving</span>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm">
                    <label className="text-gray-700 font-medium text-xs">Marks:</label>
                    <input
                      type="number"
                      value={globalMarks}
                      onChange={e => setGlobalMarks(Number(e.target.value))}
                      className="w-16 px-2 py-1 border rounded text-xs text-gray-900"
                    />
                    <label className="text-gray-700 font-medium text-xs">Negative:</label>
                    <input
                      type="number"
                      value={globalNegMarks}
                      onChange={e => setGlobalNegMarks(Number(e.target.value))}
                      className="w-16 px-2 py-1 border rounded text-xs text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={applyGlobalMarks}
                      className="px-2.5 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium border"
                    >
                      Apply All
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveImportedQuestions}
                    disabled={isSavingImport}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    {isSavingImport ? 'Saving to VPS Database...' : `Save All ${parsedQuestions.length} Questions`}
                  </button>
                </div>
              </div>

              {/* Questions Cards List */}
              <div className="space-y-4">
                {parsedQuestions.map((q, qIdx) => (
                  <div key={q.id || qIdx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded font-bold text-xs">
                        Q{qIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeParsedQuestion(qIdx)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Question Text */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Question Statement:</label>
                      <textarea
                        value={q.text}
                        onChange={e => updateParsedQuestion(qIdx, { text: e.target.value })}
                        rows={2}
                        className="w-full p-2.5 border rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>

                    {/* Options Grid */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Options (Select the correct answer):
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correctOptionIndex === optIdx;
                          const letter = String.fromCharCode(65 + optIdx);
                          return (
                            <div
                              key={optIdx}
                              onClick={() => updateParsedQuestion(qIdx, { correctOptionIndex: optIdx })}
                              className={`flex items-center gap-2.5 p-2.5 border rounded-lg cursor-pointer transition-all ${
                                isCorrect
                                  ? 'border-green-600 bg-green-50 ring-1 ring-green-600 font-medium'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct_ans_${q.id || qIdx}`}
                                checked={isCorrect}
                                onChange={() => updateParsedQuestion(qIdx, { correctOptionIndex: optIdx })}
                                className="w-4 h-4 text-green-600"
                              />
                              <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center shrink-0">
                                {letter}
                              </span>
                              <input
                                type="text"
                                value={opt.text}
                                onChange={e => {
                                  e.stopPropagation();
                                  const newOpts = [...q.options];
                                  newOpts[optIdx] = { ...newOpts[optIdx], text: e.target.value };
                                  updateParsedQuestion(qIdx, { options: newOpts });
                                }}
                                className="flex-1 bg-transparent text-sm text-gray-900 outline-none"
                              />
                              {isCorrect && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-green-200 text-green-800 px-2 py-0.5 rounded">
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Solution / Explanation */}
                    {q.solution && (
                      <div className="pt-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Explanation / Solution / Shift Details:
                        </label>
                        <input
                          type="text"
                          value={q.solution}
                          onChange={e => updateParsedQuestion(qIdx, { solution: e.target.value })}
                          className="w-full text-xs px-3 py-1.5 border rounded-md text-gray-700 bg-gray-50"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Bottom Save Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveImportedQuestions}
                    disabled={isSavingImport}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-base shadow-lg transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {isSavingImport ? 'Saving to VPS Database...' : `Save All ${parsedQuestions.length} Questions to Test`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single Question Form */}
      {creationMode === 'single' && (
        <form onSubmit={handleSingleSubmit(onSingleSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question Text <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('text')}
              rows={3}
              placeholder="Enter question text"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <input
                    {...register(`options.${idx}.text`)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <label className="flex items-center gap-2 whitespace-nowrap">
                    <input type="radio" {...register('correctOptionIndex')} value={String(idx)} />
                    <span className="text-sm">Correct</span>
                  </label>
                  {fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => append({ text: '' })}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
              >
                + Add Option
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
              <input {...register('marks', { valueAsNumber: true })} type="number" defaultValue={4} className="w-full px-3 py-2 border rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marks</label>
              <input {...register('negativeMarks', { valueAsNumber: true })} type="number" defaultValue={1} className="w-full px-3 py-2 border rounded-lg text-gray-900" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Solution / Explanation (Optional)</label>
            <textarea {...register('solution')} rows={4} placeholder="Enter solution details" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Save Question
            </button>
          </div>
        </form>
      )}

      {/* Bulk Questions Form */}
      {creationMode === 'bulk' && (
        <form onSubmit={handleBulkSubmit(onBulkSubmit)} className="space-y-4">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Bulk Add Questions</h2>
              <button
                type="button"
                onClick={() =>
                  appendBulk({
                    text: '',
                    options: [{ text: '' }, { text: '' }],
                    marks: 4,
                    negativeMarks: 1,
                  })
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-6">
              {bulkFields.map((field, qIdx) => (
                <div key={field.id} className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-700">Question {qIdx + 1}</h3>
                    {bulkFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBulk(qIdx)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Question Text <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        {...registerBulk(`questions.${qIdx}.text`)}
                        rows={2}
                        placeholder="Enter question text"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[0, 1, 2, 3].map(optIdx => (
                          <div key={optIdx} className="flex gap-2 items-center">
                            <input
                              {...registerBulk(`questions.${qIdx}.options.${optIdx}.text`)}
                              placeholder={`Option ${optIdx + 1}`}
                              className="w-full px-3 py-2 border rounded-lg text-gray-900"
                            />
                            <input
                              type="radio"
                              {...registerBulk(`questions.${qIdx}.correctOptionIndex`)}
                              value={optIdx}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                        <input
                          {...registerBulk(`questions.${qIdx}.marks`, { valueAsNumber: true })}
                          type="number"
                          defaultValue={4}
                          className="w-full px-3 py-2 border rounded-lg text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marks</label>
                        <input
                          {...registerBulk(`questions.${qIdx}.negativeMarks`, { valueAsNumber: true })}
                          type="number"
                          defaultValue={1}
                          className="w-full px-3 py-2 border rounded-lg text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Save All Questions
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
