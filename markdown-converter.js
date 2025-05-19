/**
 * A simple Markdown to HTML converter
 * Supports:
 * - Headers (# to ######)
 * - Bold (**text**)
 * - Italic (*text*)
 * - Lists (- or * or 1.)
 * - Links ([text](url))
 * - Code blocks (```code```)
 * - Inline code (`code`)
 * - Blockquotes (> text)
 * - Horizontal rules (---, ___, ***)
 */
function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  // Escape HTML chars
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Code blocks (```code```)
  html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');
  
  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Headers
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.*$)/gm, '<h4>$1</h4>');
  html = html.replace(/^##### (.*$)/gm, '<h5>$1</h5>');
  html = html.replace(/^###### (.*$)/gm, '<h6>$1</h6>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Blockquotes
  html = html.replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>');
  
  // Horizontal rules
  html = html.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Lists - this is a bit more complex
  
  // Unordered lists
  // First find all list blocks and process them as a group
  html = html.replace(/(^[\*\-] .+\n?)+/gm, function(match) {
    // Process each line as a list item
    return '<ul>' + 
      match.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>') + 
      '</ul>';
  });
  
  // Ordered lists
  html = html.replace(/(^[0-9]+\. .+\n?)+/gm, function(match) {
    return '<ol>' + 
      match.replace(/^[0-9]+\. (.+)$/gm, '<li>$1</li>') + 
      '</ol>';
  });
  
  // Paragraphs - wrap text blocks not already wrapped in HTML
  html = html.replace(/^(?!<[a-z])[^\n\r]+(?:\n|\r\n?)?/gm, function(match) {
    if(match.trim() === '') return match;
    return '<p>' + match.trim() + '</p>';
  });
  
  // Replace line breaks not in pre blocks with <br>
  // But preserve line breaks inside code blocks
  const codeBlocks = [];
  html = html.replace(/<pre>[\s\S]*?<\/pre>/g, function(match) {
    codeBlocks.push(match);
    return `[[CODE_BLOCK_${codeBlocks.length - 1}]]`;
  });
  
  // Replace line breaks with <br> (outside of pre blocks)
  html = html.replace(/\n/g, '<br>');
  
  // Restore code blocks
  codeBlocks.forEach((block, i) => {
    html = html.replace(`[[CODE_BLOCK_${i}]]`, block);
  });
  
  return html;
}