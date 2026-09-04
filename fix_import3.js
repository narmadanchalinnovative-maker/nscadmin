const fs = require("fs");
const file = "c:/Users/adars/OneDrive/Desktop/adminforclass/src/app/admin/courses/[id]/subjects/[subjectId]/chapters/[chapterId]/lectures/page.tsx";
let content = fs.readFileSync(file, "utf8");
if (!content.includes("import { TranscoderStatus }")) {
  content = content.replace("use client';", "use client';\nimport { TranscoderStatus } from \"@/components/admin/TranscoderStatus\";");
  fs.writeFileSync(file, content);
}

