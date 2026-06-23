const fs = require('fs');
const path = require('path');

const aiDir = path.join(__dirname, 'src', 'app', '(dashboard)', 'ai');
const filesToUpdate = [
  'summarize/page.tsx',
  'revision/page.tsx',
  'quiz/page.tsx',
  'question-bank/page.tsx',
  'notes/page.tsx',
  'mindmap/page.tsx',
  'interview/page.tsx',
  'flashcards/page.tsx',
  'exam-generator/page.tsx'
];

const newEmptyState = `
                <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-border rounded-xl bg-muted/30">
                  <AlertCircle className="h-6 w-6 text-yellow-500 mb-2" />
                  <p className="text-sm font-semibold text-foreground mb-1">No Documents Found</p>
                  <p className="text-xs text-muted-foreground mb-4">You need to upload a PDF to your vault before using this feature.</p>
                  <a href="/dashboard" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                    Upload a PDF
                  </a>
                </div>
`;

const oldRegex = /<div className="text-sm text-yellow-600 bg-yellow-50 dark:bg-yellow-950\/20 dark:text-yellow-400 p-3 rounded-md flex items-center gap-2">\s*<AlertCircle className="h-4 w-4" \/>\s*Please upload a PDF file first.\s*<\/div>/g;

filesToUpdate.forEach(file => {
  const filePath = path.join(aiDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.match(oldRegex)) {
      content = content.replace(oldRegex, newEmptyState.trim());
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', file);
    } else {
      console.log('Regex not matched in:', file);
    }
  }
});

// chat/page.tsx has a different message
const chatPath = path.join(aiDir, 'chat/page.tsx');
if (fs.existsSync(chatPath)) {
  let content = fs.readFileSync(chatPath, 'utf8');
  const chatRegex = /<div className="flex flex-col items-center justify-center h-full text-muted-foreground">\s*<AlertCircle className="h-8 w-8 mb-4 opacity-50" \/>\s*<p>Upload a file to start chatting\.<\/p>\s*<\/div>/g;
  
  const newChatEmptyState = `
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No File Selected</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">You need to upload a PDF document before you can start chatting with it.</p>
                <a href="/dashboard" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 py-2">
                  Go to Upload
                </a>
              </div>
  `;
  if (content.match(chatRegex)) {
    content = content.replace(chatRegex, newChatEmptyState.trim());
    fs.writeFileSync(chatPath, content, 'utf8');
    console.log('Updated: chat/page.tsx');
  } else {
      console.log('Regex not matched in chat/page.tsx');
  }
}
