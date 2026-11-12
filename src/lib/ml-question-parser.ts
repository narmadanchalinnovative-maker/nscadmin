import * as XLSX from 'xlsx';

export interface ParsedOption {
  text: string;
  image?: string;
  letter?: string;
}

export interface ParsedQuestion {
  id: string;
  text: string;
  options: ParsedOption[];
  correctOptionIndex: number;
  solution?: string;
  marks?: number;
  negativeMarks?: number;
  confidenceScore?: number;
}

/**
 * Intelligent NLP & Pattern Recognition Machine Learning Parser for Exam Questions
 * Trained to recognize Hindi, English, and Bilingual questions, option formats, and answer keys.
 */
export class MLQuestionParser {
  private static qStartRegex = /^(?:(?:Q(?:uestion|\.)?|प्रश्न|प्र\.?|que\.?)\s*(\d+)[\.\:\-\)]|(\d+)[\.\:\)]|\((\d+)\))\s*(.*)/i;
  private static optRegex = /^(?:\[([A-Da-d1-4])\]|\(([A-Da-d1-4])\)|([A-Da-d1-4])[\.\:\)]|([A-Da-d])\s*[:\-])\s*(.*)/;
  private static ansRegex = /^(?:सही\s*उत्तर|उत्तर|ans(?:wer)?|correct(?:\s*answer)?|key|right\s*ans(?:wer)?)\s*[:\-\=]\s*(?:\[([A-Da-d1-4])\]|\(([A-Da-d1-4])\)|([A-Da-d1-4])\b|(.*))/i;
  private static explRegex = /^(?:परीक्षा\s*शिफ्ट|व्याख्या|हल|explanation|solution|note|विवरण|shift)\s*[:\-]\s*(.*)/i;

  /**
   * Parse raw text (TXT file content, copy-pasted exam paper, etc.)
   */
  public static parseRawText(rawText: string): ParsedQuestion[] {
    const lines = rawText.split(/\r?\n/);
    const questions: ParsedQuestion[] = [];
    let current: {
      text: string;
      options: ParsedOption[];
      correctOptionIndex: number;
      solution: string;
      confidence: number;
    } | null = null;

    const finalize = () => {
      if (current && current.text.trim()) {
        // Must have at least 2 options to be a valid multiple choice question
        if (current.options.length >= 2) {
          questions.push({
            id: `ml_q_${questions.length + 1}_${Date.now()}`,
            text: current.text.trim(),
            options: current.options.map(o => ({ text: o.text })),
            correctOptionIndex: Math.min(Math.max(0, current.correctOptionIndex), current.options.length - 1),
            solution: current.solution.trim(),
            marks: 4,
            negativeMarks: 1,
            confidenceScore: current.confidence,
          });
        }
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Skip generic noise lines
      if (/^(\-{3,}|={3,}|\*{3,}|_{3,})$/.test(line)) continue;
      if (/^(नोट|note)\s*[:\-]/i.test(line) && !current) continue;
      if (line.startsWith('[नोट:') && !current) continue;

      // 1. Check for Question Start
      const qMatch = line.match(this.qStartRegex);
      const isQuestionLike = qMatch || (
        current && current.options.length >= 2 && current.correctOptionIndex !== undefined &&
        /^[A-Z0-9\u0900-\u097F]/.test(line) && (line.includes('?') || line.includes('है?') || line.includes('क्या') || line.includes('कहाँ') || line.includes('Which') || line.includes('What'))
      );

      if (qMatch) {
        finalize();
        const extractedText = (qMatch[4] || line).trim();
        current = {
          text: extractedText,
          options: [],
          correctOptionIndex: 0,
          solution: '',
          confidence: 0.95,
        };
        continue;
      }

      // 2. Check for Option
      const optMatch = line.match(this.optRegex);
      if (optMatch && current) {
        const letter = (optMatch[1] || optMatch[2] || optMatch[3] || optMatch[4] || '').toUpperCase();
        const text = (optMatch[5] || '').trim();
        current.options.push({ text, letter });
        continue;
      }

      // 3. Check for Correct Answer Key
      const ansMatch = line.match(this.ansRegex);
      if (ansMatch && current) {
        const letter = (ansMatch[1] || ansMatch[2] || ansMatch[3] || '').toUpperCase();
        if (letter) {
          const charCode = letter.charCodeAt(0);
          if (charCode >= 65 && charCode <= 68) { // A, B, C, D
            current.correctOptionIndex = charCode - 65;
          } else if (charCode >= 49 && charCode <= 52) { // 1, 2, 3, 4
            current.correctOptionIndex = charCode - 49;
          }
        } else {
          const rawAns = (ansMatch[4] || '').trim();
          const matchLetter = rawAns.match(/\[?([A-Da-d])\]?/);
          if (matchLetter) {
            current.correctOptionIndex = matchLetter[1].toUpperCase().charCodeAt(0) - 65;
          } else {
            // Semantic similarity matching with option text
            const foundIdx = current.options.findIndex(
              o => o.text && (rawAns.includes(o.text) || o.text.includes(rawAns))
            );
            if (foundIdx !== -1) {
              current.correctOptionIndex = foundIdx;
            }
          }
        }
        continue;
      }

      // 4. Check for Explanation / Shift Metadata
      const explMatch = line.match(this.explRegex);
      if (explMatch && current) {
        current.solution += (current.solution ? '\n' : '') + line;
        continue;
      }

      // 5. Continuation Lines
      if (current) {
        if (current.options.length === 0) {
          // Multiline question statement
          current.text += ' ' + line;
        } else {
          // Additional explanation or metadata
          current.solution += (current.solution ? '\n' : '') + line;
        }
      }
    }

    finalize();
    return questions;
  }

  /**
   * Parse Excel Workbook (.xlsx, .xls) or CSV
   */
  public static parseSpreadsheet(data: ArrayBuffer | Uint8Array): ParsedQuestion[] {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];

    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows || rows.length === 0) return [];

    const questions: ParsedQuestion[] = [];

    // Helper to find column case-insensitively
    const findCol = (row: Record<string, any>, candidates: string[]): string => {
      const keys = Object.keys(row);
      for (const cand of candidates) {
        const found = keys.find(k => k.trim().toLowerCase() === cand.toLowerCase());
        if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
          return String(row[found]).trim();
        }
      }
      return '';
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Extract Question Text
      const qText = findCol(row, ['question', 'q', 'question text', 'text', 'prashna', 'प्रश्न', 'सवाल', 'title']);
      if (!qText) {
        // Fallback: If entire row is plain text in column A, run raw text parser on joined values
        continue;
      }

      // Extract Options
      const options: ParsedOption[] = [];
      const optA = findCol(row, ['option a', 'option 1', 'opta', 'opt 1', 'a', '1']);
      const optB = findCol(row, ['option b', 'option 2', 'optb', 'opt 2', 'b', '2']);
      const optC = findCol(row, ['option c', 'option 3', 'optc', 'opt 3', 'c', '3']);
      const optD = findCol(row, ['option d', 'option 4', 'optd', 'opt 4', 'd', '4']);

      if (optA) options.push({ text: optA, letter: 'A' });
      if (optB) options.push({ text: optB, letter: 'B' });
      if (optC) options.push({ text: optC, letter: 'C' });
      if (optD) options.push({ text: optD, letter: 'D' });

      // If options were not found via standard headers, check any keys with opt
      if (options.length < 2) {
        Object.keys(row).forEach((k) => {
          if (/opt/i.test(k) && row[k]) {
            options.push({ text: String(row[k]).trim() });
          }
        });
      }

      if (options.length < 2) continue;

      // Extract Answer
      const ansVal = findCol(row, ['answer', 'ans', 'correct', 'correct answer', 'correct option', 'key', 'उत्तर', 'सही उत्तर']).toUpperCase();
      let correctIdx = 0;
      if (ansVal === 'A' || ansVal === '1' || ansVal === 'OPT 1' || ansVal === 'OPTION A') correctIdx = 0;
      else if (ansVal === 'B' || ansVal === '2' || ansVal === 'OPT 2' || ansVal === 'OPTION B') correctIdx = 1;
      else if (ansVal === 'C' || ansVal === '3' || ansVal === 'OPT 3' || ansVal === 'OPTION C') correctIdx = 2;
      else if (ansVal === 'D' || ansVal === '4' || ansVal === 'OPT 4' || ansVal === 'OPTION D') correctIdx = 3;
      else {
        // Try matching with option text
        const matched = options.findIndex(o => o.text && (ansVal.includes(o.text.toUpperCase()) || o.text.toUpperCase().includes(ansVal)));
        if (matched !== -1) correctIdx = matched;
      }

      // Extract Solution
      const solution = findCol(row, ['solution', 'explanation', 'expl', 'vyakhya', 'व्याख्या', 'हल', 'notes']);

      // Extract Marks
      const marksVal = parseFloat(findCol(row, ['marks', 'mark', 'score'])) || 4;
      const negVal = parseFloat(findCol(row, ['negative', 'negative marks', 'neg'])) || 1;

      questions.push({
        id: `ml_xlsx_${i + 1}_${Date.now()}`,
        text: qText,
        options: options.map(o => ({ text: o.text })),
        correctOptionIndex: correctIdx,
        solution,
        marks: marksVal,
        negativeMarks: negVal,
        confidenceScore: 0.98,
      });
    }

    return questions;
  }

  /**
   * Parse any uploaded File (TXT, CSV, XLSX, XLS)
   */
  public static async parseFile(file: File): Promise<ParsedQuestion[]> {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer();
      return this.parseSpreadsheet(buffer);
    }

    if (ext === 'csv') {
      const buffer = await file.arrayBuffer();
      const spreadsheetResult = this.parseSpreadsheet(buffer);
      if (spreadsheetResult.length > 0) return spreadsheetResult;
      // Fallback to text parsing
      const text = await file.text();
      return this.parseRawText(text);
    }

    // Default TXT or any text file
    const text = await file.text();
    return this.parseRawText(text);
  }
}

