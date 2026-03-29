const LANGUAGE_MAP = {
    python: { language: 'python', version: '3.10.0', extension: 'py' },
    javascript: { language: 'javascript', version: '18.15.0', extension: 'js' },
    cpp: { language: 'c++', version: '10.2.0', extension: 'cpp' },
};

export async function executeCode(language, code) {
    const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code }),
    });

    if (!response.ok) {
        throw new Error('Code execution failed');
    }

    return response.json();
}

export async function getAISuggestion(prompt, language, contextCode = '') {
    const response = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language, contextCode }),
    });

    if (!response.ok) {
        let msg = 'AI suggestion failed';
        try {
            const data = await response.json();
            if (data.error) msg = data.error;
        } catch (_) {}
        throw new Error(msg);
    }

    return response.json();
}

// Robust SSE stream parser with buffer to handle partial chunks
export async function getAISuggestionStream(prompt, language, onChunk) {
    const response = await fetch('/api/ai-suggest-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language }),
    });

    if (!response.ok) {
        throw new Error('AI stream request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = ''; // Buffer for partial SSE lines

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines only (lines ending with \n)
        const lines = buffer.split('\n');
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.substring(6).trim();
                if (dataStr === '[DONE]') return;
                try {
                    const parsed = JSON.parse(dataStr);
                    if (parsed.text) onChunk(parsed.text);
                } catch (e) {
                    // Partial JSON — will be completed in next chunk
                }
            }
        }
    }

    // Process any remaining buffer
    if (buffer.trim().startsWith('data: ')) {
        const dataStr = buffer.trim().substring(6).trim();
        if (dataStr !== '[DONE]') {
            try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) onChunk(parsed.text);
            } catch (e) {
                // ignore
            }
        }
    }
}

// Autocomplete — for inline ghost text suggestions
export async function getAutocompletion(code, language, cursorLine, cursorColumn) {
    const response = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, cursorLine, cursorColumn }),
    });

    if (!response.ok) {
        return { completion: '' };
    }

    return response.json();
}

export const LANGUAGES = Object.keys(LANGUAGE_MAP);
export default LANGUAGE_MAP;
