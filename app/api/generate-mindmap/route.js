import { NextResponse } from 'next/server';

// Maximum characters allowed by Gemini API
const MAX_CHAR_LIMIT = 131072;

export async function POST(request) {
  try {
    const { text, apiKey, apiEndpoint, modelId } = await request.json();
    
    if (!text || !apiKey || !apiEndpoint) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Log detailed text information for debugging
    console.log(`API received text: length=${text.length}, byteLength=${new Blob([text]).size}`);
    
    // Check if text appears to be binary/non-text content
    const hasBinaryContent = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(text.substring(0, 1000));
    if (hasBinaryContent) {
      console.log("Warning: Text appears to contain binary data. This may be a binary file incorrectly read as text.");
    }

    // Check text length before proceeding
    if (text.length > MAX_CHAR_LIMIT) {
      console.log(`Text exceeds limit: ${text.length} > ${MAX_CHAR_LIMIT}`);
      return NextResponse.json(
        { error: `Input length ${text.length} exceeds the maximum length ${MAX_CHAR_LIMIT}` },
        { status: 400 }
      );
    }

    // Use the provided modelId or default to gemini-2.0-flash
    const model = modelId || 'gemini-2.0-flash';
    const endpoint = apiEndpoint || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    const url = `${endpoint}?key=${apiKey}`;

    const prompt = `
Objective:
* Help the user organize the file into a structured document for better clarity and readability.
* Use markmap syntax to create a mind map for a better presentation of the document structure.
* During the organization process, retain the original wording as much as possible, without extra explanation or modification.
* Ensure that no details from the original text are omitted.
* For each node in the mind map, add a reference link to a valid, relevant source (such as Wikipedia, official documentation, or reputable educational sites) that helps explain or provide context for the node's text. Use the [text](url) markdown format for links.

Guidelines:
1. Analyze the text content to identify its logical structure and hierarchy.
2. The generated mind map should clearly show all parts of the document and their relationships.
3. Strictly follow markmap syntax rules when generating markmap code.
4. Output the generated markmap code as markdown text.
5. Avoid any form of alteration or deletion of the original content throughout the process.
6. For each node, append a reference link in the format: [Reference](https://example.com) after the node text, using a real, relevant, and valid source.
7. Example markmap code:
"---
title: markmap
---

## Links

- [Website](https://markmap.js.org/)
- [GitHub](https://github.com/gera2ld/markmap)

## Related Projects

- [coc-markmap](https://github.com/gera2ld/coc-markmap) for Neovim
- [markmap-vscode](https://marketplace.visualstudio.com/items?itemName=gera2ld.markmap-vscode) for VSCode
- [eaf-markmap](https://github.com/emacs-eaf/eaf-markmap) for Emacs

## Features

Note that if blocks and lists appear at the same level, the lists will be ignored.

### Lists

- **strong** ~~del~~ *italic* ==highlight==
- \`inline code\`
- [x] checkbox
- Katex: $x = {-b \pm \sqrt{b^2-4ac} \over 2a}$ <!-- markmap: fold -->
  - [More Katex Examples](#?d=gist:af76a4c245b302206b16aec503dbe07b:katex.md)
- Now we can wrap very very very very long text based on \`maxWidth\` option
- Ordered list
  1. item 1
  2. item 2

### Blocks

\`\`\`js
console.log('hello, JavaScript')
\`\`\`

| Products | Price |
|-|-|
| Apple | 4 |
| Banana | 2 |

![](https://markmap.js.org/favicon.png)"

Tone:
* Present the organized result clearly and concisely.
* Avoid subjective or speculative language.

The following is the text to be organized:

${text}
`;

    // Create and return a streaming-like response (Gemini does not support streaming)
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Gemini expects a different request body structure
    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    };

    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || 'Failed to generate mind map';
        writer.write(encoder.encode(JSON.stringify({ error: errorMessage })));
        writer.close();
        return;
      }

      const data = await response.json();
      // Gemini's response: data.candidates[0].content.parts[0].text
      const markdownContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Clean up markdown as before
      let cleanedMarkdown = markdownContent.trim();
      if (cleanedMarkdown.startsWith('```markdown')) {
        cleanedMarkdown = cleanedMarkdown.substring('```markdown'.length);
      } else if (cleanedMarkdown.startsWith('```')) {
        cleanedMarkdown = cleanedMarkdown.substring('```'.length);
      }
      if (cleanedMarkdown.endsWith('```')) {
        cleanedMarkdown = cleanedMarkdown.substring(0, cleanedMarkdown.length - 3);
      }
      cleanedMarkdown = cleanedMarkdown.trim();

      writer.write(encoder.encode(JSON.stringify({
        done: true,
        markdown: cleanedMarkdown
      }) + '\n'));
      writer.close();
    }).catch(error => {
      writer.write(encoder.encode(JSON.stringify({ error: error.message || 'Error fetching response' })));
      writer.close();
    });

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error generating mind map:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}