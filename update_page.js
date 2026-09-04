const fs = require("fs");
const file = "c:/Users/adars/OneDrive/Desktop/adminforclass/src/app/admin/courses/[id]/subjects/[subjectId]/chapters/[chapterId]/lectures/page.tsx";
let content = fs.readFileSync(file, "utf8");

if (!content.includes("import { TranscoderStatus }")) {
  content = content.replace(
    "import { toast } from \"sonner\";",
    "import { toast } from \"sonner\";\nimport { TranscoderStatus } from \"@/components/admin/TranscoderStatus\";"
  );
}

const newBlock = `                        {lecture.videoProcessingStatus === "processing" && (
                          <TranscoderStatus videoUrl={lecture.videoUrl} />
                        )}
                        {lecture.videoProcessingStatus === "error" && (
                          <div className="mt-2 flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full max-w-max">
                              ❌ Video Processing Failed
                            </span>
                            <button 
                              onClick={() => alert((lecture as any).videoProcessingError || "Unknown Error")} 
                              className="text-xs text-red-600 underline hover:text-red-800"
                            >
                              View Error Log
                            </button>
                          </div>
                        )}`;

content = content.replace(/\{lecture\.videoProcessingStatus === .processing. && \([\s\S]*?<span[\s\S]*?Processing Video\.\.\.[\s\S]*?<\/span>[\s\S]*?\)\}/, newBlock);

fs.writeFileSync(file, content);
