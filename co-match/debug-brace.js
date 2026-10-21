const line = '              <form onSubmit={handleSubmit} className="space-y-6">';
let braceCount = 0;
for (let j = 0; j < line.length; j++) {
  if (line[j] === '{' && line[j+1] !== '{') { braceCount++; console.log('Open at', j, braceCount); }
  if (line[j] === '}' && line[j-1] !== '}') { braceCount--; console.log('Close at', j, braceCount); }
}
console.log('Final:', braceCount);