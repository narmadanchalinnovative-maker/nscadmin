const fs = require('fs');
const path = require('path');
const file = 'c:/Users/adars/OneDrive/Desktop/adminforclass/src/app/admin/courses/[id]/subjects/[subjectId]/chapters/[chapterId]/lectures/page.tsx';

let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { TranscoderStatus }')) {
  content = content.replace(
    'import { toast } from \'sonner\';',
    'import { toast } from \'sonner\';\nimport { TranscoderStatus } from \'@/components/admin/TranscoderStatus\';'
  );
}

const oldBlock = \                        {lecture.videoProcessingStatus === 'processing' && (
                          <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full animate-pulse max-w-max">
                            ?? Processing Video...
                          </span>
                        )}\;

const newBlock = \                        {lecture.videoProcessingStatus === 'processing' && (
                          <TranscoderStatus videoUrl={lecture.videoUrl} />
                        )}
                        {lecture.videoProcessingStatus === 'error' && (
                          <div className="mt-2 flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full max-w-max">
                              ? Video Processing Failed
                            </span>
                            <button 
                              onClick={() => alert((lecture as any).videoProcessingError || 'Unknown Error')} 
                              className="text-xs text-red-600 underline hover:text-red-800"
                            >
                              View Error Log
                            </button>
                          </div>
                        )}\;

// The icon might be different due to encoding (e.g. 🔄)
// Instead of replacing exact text, we can use a regex that matches the block.
content = content.replace(/\\{lecture\\.videoProcessingStatus === 'processing' && \\([\\s\\S]*?<span[\\s\\S]*?Processing Video\\.\\.\\.[\\s\\S]*?<\\/span>[\\s\\S]*?\\)\\}/, newBlock);

fs.writeFileSync(file, content);
