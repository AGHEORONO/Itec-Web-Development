import dotenv from 'dotenv';
import { fileURLToPath as fileURLToPathDotenv } from 'url';
import { dirname as dirnameDotenv, join as joinDotenv } from 'path';
const __dirnameDotenv = dirnameDotenv(fileURLToPathDotenv(import.meta.url));
dotenv.config({ path: joinDotenv(__dirnameDotenv, '..', '.env') });

import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection, docs } from 'y-websocket/bin/utils';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// ── OpenRouter config ──
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_BASE = 'https://api.groq.com/openai/v1';

if (!GROQ_API_KEY) {
    console.warn('⚠  GROQ_API_KEY is not set. AI features will use fallback templates.');
}

// ── OpenRouter helpers ──
async function chatCompletion(messages, options = {}) {
    const body = {
        model: options.model || GROQ_MODEL,
        messages,
        ...(options.max_tokens && { max_tokens: options.max_tokens }),
        temperature: options.temperature ?? 0.3,
        stream: false,
    };

    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error(`[GROQ API ERROR] Status: ${res.status}, Body: ${err}`);
        const error = new Error(`OpenRouter error: ${res.status} ${err}`);
        error.status = res.status;
        throw error;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
}

async function chatCompletionStream(messages, options = {}) {
    const body = {
        model: options.model || GROQ_MODEL,
        messages,
        ...(options.max_tokens && { max_tokens: options.max_tokens }),
        temperature: options.temperature ?? 0.3,
        stream: true,
    };

    const res = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const err = await res.text();
        console.error(`[GROQ API ERROR] Status: ${res.status}, Body: ${err}`);
        const error = new Error(`OpenRouter stream error: ${res.status} ${err}`);
        error.status = res.status;
        throw error;
    }

    return res.body;
}

// Helper: retry with backoff for rate limits
async function withRetry(fn, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            if (err.status === 429 && attempt < maxRetries) {
                const wait = (attempt + 1) * 5000;
                console.log(`[AI] Rate limited. Retrying in ${wait / 1000}s (attempt ${attempt + 1}/${maxRetries})...`);
                await new Promise(r => setTimeout(r, wait));
            } else {
                throw err;
            }
        }
    }
}

// ── Local execution helper ──
async function buildContainer(language, code) {
    const tmpDir = os.tmpdir();
    const id = Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    let cleanup = [];
    let dockerfileContent = '';
    let fileName = '';

    if (language === 'python') {
        fileName = `itecify_${id}.py`;
        const pyModules = code.match(/^(?:import|from)\s+([a-zA-Z0-9_\.]+)/gm);
        let toInstall = [];
        if (pyModules) {
            const modules = [...new Set(pyModules.map(m => m.split(/\s+/)[1].split('.')[0]))];
            const standardLibs = ['os', 'sys', 'time', 'math', 're', 'json', 'datetime', 'random', 'collections', 'itertools', 'functools', 'urllib', 'typing', 'hashlib', 'sqlite3', 'csv', 'string', 'warnings'];
            const ignorePackages = ['mpl_toolkits'];
            const aliases = {
                'cv2': 'opencv-python',
                'sklearn': 'scikit-learn',
                'bs4': 'beautifulsoup4',
                'PIL': 'Pillow'
            };
            toInstall = modules
                .filter(m => !standardLibs.includes(m) && !ignorePackages.includes(m))
                .map(m => aliases[m] || m);
        }

        dockerfileContent = `FROM python:3.10-slim
WORKDIR /app
COPY ${fileName} .
${toInstall.length > 0 ? `RUN pip install --no-cache-dir ${toInstall.join(' ')}` : ''}
CMD ["python", "${fileName}"]`;
    } else if (language === 'javascript' || language === 'typescript') {
        fileName = `itecify_${id}.js`;
        const jsModules = code.match(/(?:require\(['"]([a-zA-Z0-9_\-]+)['"]\))|(?:import\s+.*\s+from\s+['"]([a-zA-Z0-9_\-]+)['"])/g);
        let toInstall = [];
        if (jsModules) {
            const modules = jsModules.map(m => {
                const match = m.match(/['"]([a-zA-Z0-9_\-]+)['"]/);
                return match ? match[1] : null;
            }).filter(Boolean);

            const standardLibs = ['fs', 'path', 'http', 'https', 'crypto', 'os', 'util', 'events', 'stream', 'url', 'child_process'];
            toInstall = [...new Set(modules)].filter(m => !standardLibs.includes(m) && !m.startsWith('.'));
        }

        dockerfileContent = `FROM node:20-slim
WORKDIR /app
COPY ${fileName} .
${toInstall.length > 0 ? `RUN npm install ${toInstall.join(' ')}` : ''}
${language === 'typescript' ? 'RUN npm install -g typescript && tsc ' + fileName : ''}
CMD ["node", "${fileName.replace('.js', language === 'typescript' ? '.js' : '.js')}"]`;
    } else if (language === 'cpp') {
        fileName = `itecify_${id}.cpp`;
        dockerfileContent = `FROM frolvlad/alpine-gxx
WORKDIR /app
COPY ${fileName} .
RUN g++ ${fileName} -o out
CMD ["./out"]`;
    } else if (language === 'java') {
        fileName = `Main.java`;
        dockerfileContent = `FROM amazoncorretto:17-alpine
WORKDIR /app
COPY ${fileName} .
RUN javac ${fileName}
CMD ["java", "Main"]`;
    } else if (language === 'go') {
        fileName = `main.go`;
        dockerfileContent = `FROM golang:1.20-alpine
WORKDIR /app
COPY ${fileName} .
RUN go build -o main ${fileName}
CMD ["./main"]`;
    } else if (language === 'rust') {
        fileName = `main.rs`;
        dockerfileContent = `FROM rust:alpine
WORKDIR /app
COPY ${fileName} .
RUN rustc ${fileName} -o main
CMD ["./main"]`;
    } else if (language === 'ruby') {
        fileName = `main.rb`;
        dockerfileContent = `FROM ruby:alpine
WORKDIR /app
COPY ${fileName} .
CMD ["ruby", "${fileName}"]`;
    } else if (language === 'php') {
        fileName = `main.php`;
        dockerfileContent = `FROM php:cli-alpine
WORKDIR /app
COPY ${fileName} .
CMD ["php", "${fileName}"]`;
    } else {
        return { error: `Unsupported language: ${language}` };
    }

    const filePath = path.join(tmpDir, fileName);
    const dockerfilePath = path.join(tmpDir, `Dockerfile_${id}`);
    const imageName = `itecify-run-${id.toLowerCase()}`;
    const containerName = `itecify-cont-${id.toLowerCase()}`;

    fs.writeFileSync(filePath, code);
    fs.writeFileSync(dockerfilePath, dockerfileContent);

    cleanup.push(filePath, dockerfilePath);

    try {
        console.log(`[Docker] Building isolated execution container ${imageName}`);
        execSync(`docker build -t ${imageName} -f Dockerfile_${id} .`, { cwd: tmpDir, timeout: 300000 });
        return { error: null, imageName, containerName, cleanup };
    } catch (e) {
        cleanup.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f) });
        const stdoutStr = e.stdout ? e.stdout.toString() : '';
        const stderrStr = e.stderr ? e.stderr.toString() : '';
        return { error: `Failed to build the isolated environment. Docker Build Error:\n\n${stderrStr}\n${stdoutStr}\n\nCommand output: ${e.message}` };
    }
}

async function executeLocally(language, code) {
    const buildRes = await buildContainer(language, code);
    if (buildRes.error) {
        return { stdout: '', stderr: buildRes.error, exitCode: 1, time: 0 };
    }
    const { imageName, containerName, cleanup } = buildRes;

    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        const t0 = Date.now();

        const proc = spawn('docker', [
            'run', '--name', containerName, '--rm',
            '--memory=128m',
            '--cpus=0.5',
            '--network=none',
            imageName
        ]);

        let isTimedOut = false;
        const executionTimeout = setTimeout(() => {
            isTimedOut = true;
            try { execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' }); } catch (_) { }
            proc.kill();
        }, 15000);

        proc.stdout.on('data', (data) => { stdout += data.toString(); });
        proc.stderr.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', (code) => {
            clearTimeout(executionTimeout);
            const time = Date.now() - t0;
            cleanup.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
            try { execSync(`docker rmi -f ${imageName}`, { stdio: 'ignore' }); } catch (_) { }

            if (isTimedOut) {
                stderr += "\n\nError: Execution timed out after 15 seconds.";
                code = 124;
            }

            console.log(`[Docker] Container ${imageName} exited with code ${code}`);
            resolve({ stdout, stderr, exitCode: code ?? 0, time });
        });

        proc.on('error', (err) => {
            clearTimeout(executionTimeout);
            cleanup.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
            try { execSync(`docker rmi -f ${imageName}`, { stdio: 'ignore' }); } catch (_) { }
            resolve({ stdout: '', stderr: err.message, exitCode: 1 });
        });
    });
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Local code execution engine ──
app.post('/api/execute', async (req, res) => {
    try {
        const { language, code } = req.body;

        if (!code || !code.trim()) {
            return res.json({ stdout: '', stderr: 'No code to execute', code: 1, time: 0 });
        }

        const startTime = Date.now();
        console.log(`[Execute] Language: ${language}, Code length: ${code.length}`);

        let result = await executeLocally(language, code);
        
        // If Docker is entirely unavailable (e.g. timeout on the CLI itself)
        if (result.stderr && result.stderr.includes('Is the docker daemon running')) {
            console.log(`[Execute] Docker Engine unavailable.`);
            result.stderr = "iTECify Execution Engine Error:\n\nCould not communicate with Docker Desktop. Check if it is running.";
        }

        const elapsed = Date.now() - startTime;

        console.log(`[Execute] stdout: ${result.stdout.substring(0, 100)}`);
        console.log(`[Execute] stderr: ${result.stderr.substring(0, 100)}`);

        res.json({
            stdout: result.stdout,
            stderr: result.stderr,
            code: result.exitCode, // Note: response map maps this to `code`
            signal: null,
            time: elapsed,
        });
    } catch (err) {
        console.error('Execution error:', err);
        res.status(500).json({ error: 'Code execution failed' });
    }
});

// ── AI suggestion endpoint ──
app.post('/api/ai-suggest', async (req, res) => {
    try {
        const { prompt, language, contextCode } = req.body;

        if (GROQ_API_KEY) {
            let systemPrompt, userPrompt;

            if (contextCode && contextCode.trim()) {
                systemPrompt = `You are an expert AI pair programmer. The user is currently editing a ${language} file. Return ONLY the raw code. Do not include markdown code block wrappers (no \`\`\`), no explanations, no chat, just the precise code block.`;
                userPrompt = `Here is the CURRENT code:\n${contextCode}\n\nThe user's request is: "${prompt}"\n\nPlease REWRITE the code to fully implement their request while preserving anything they didn't ask to change. Return ONLY the fully updated raw code from top to bottom.`;
            } else {
                systemPrompt = `You are an expert AI programmer. Write concise, clean code. Return ONLY the raw code. Do not include markdown code block wrappers (no \`\`\`), no explanations, no chat, just the precise code block.`;
                userPrompt = `Write a ${language} snippet for: "${prompt}"`;
            }

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ];

            let suggestion = await withRetry(() => chatCompletion(messages));
            // Strip markdown block markers just in case
            if (suggestion.startsWith('```')) {
                suggestion = suggestion.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '').trim();
            }
            return res.json({ suggestion });
        }

        // Fallback templates
        const suggestions = {
            python: generatePythonSuggestion(prompt),
            javascript: generateJSSuggestion(prompt),
            cpp: generateCppSuggestion(prompt),
        };

        const suggestion = suggestions[language] || suggestions.javascript;
        await new Promise((resolve) => setTimeout(resolve, 500));
        res.json({ suggestion });
    } catch (err) {
        console.error('AI suggestion error:', err.message || err);
        const msg = err.status === 429 ? 'AI rate limit reached. Please wait a moment and try again.' : `AI suggestion failed: ${err.message || ''}`;
        res.status(err.status === 429 ? 429 : 500).json({ error: msg });
    }
});

// ── Streaming AI endpoint (Ghost Cursor) ──
app.post('/api/ai-suggest-stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const { prompt, language } = req.body;

    if (GROQ_API_KEY) {
        try {
            const messages = [
                { role: 'system', content: `Write a precise, functional implementation in ${language}. Return ONLY the raw code. No markdown wrappers, no explanations, just the code.` },
                { role: 'user', content: prompt },
            ];

            const stream = await withRetry(() => chatCompletionStream(messages));

            // Parse OpenAI SSE format from the stream
            const reader = stream.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data: ')) {
                        const dataStr = trimmed.substring(6).trim();
                        if (dataStr === '[DONE]') {
                            res.write('data: [DONE]\n\n');
                            res.end();
                            return;
                        }
                        try {
                            const parsed = JSON.parse(dataStr);
                            const text = parsed.choices?.[0]?.delta?.content;
                            if (text) {
                                res.write(`data: ${JSON.stringify({ text })}\n\n`);
                            }
                        } catch (e) {
                            // partial JSON, skip
                        }
                    }
                }
            }

            res.write('data: [DONE]\n\n');
            res.end();
            return;
        } catch (err) {
            console.error('Stream error:', err);
            res.write(`data: ${JSON.stringify({ text: '// Stream Error: ' + err.message })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
        }
    } else {
        res.write(`data: ${JSON.stringify({ text: '// AI API Key missing' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
    }
});

// ── Autocomplete endpoint (for inline ghost text suggestions) ──
app.post('/api/autocomplete', async (req, res) => {
    try {
        const { code, language, cursorLine, cursorColumn } = req.body;

        if (!GROQ_API_KEY || !code || !code.trim()) {
            return res.json({ completion: '' });
        }

        // Extract context around cursor (keep it small for speed)
        const lines = code.split('\n');
        const startLine = Math.max(0, cursorLine - 30);
        const endLine = Math.min(lines.length, cursorLine + 5);
        const contextBefore = lines.slice(startLine, cursorLine).join('\n');
        const currentLine = lines[cursorLine - 1] || '';
        const linePrefix = currentLine.substring(0, cursorColumn - 1);

        const prompt = `You are an intelligent code autocomplete engine. Given the following ${language} code context and the current line being typed, predict what the developer will type next. Return ONLY the completion text (the continuation of the current line and possibly a few more lines). Do NOT repeat any code that's already been written. Do NOT include explanations or markdown. If unsure, return an empty string.

Code context:
${contextBefore}
${linePrefix}`;

        const messages = [
            { role: 'system', content: 'You are a code autocomplete engine. Return ONLY the completion text that should follow after the cursor. No markdown, no explanations, no code fences. Keep completions concise (1-5 lines max). If you cannot provide a meaningful completion, respond with an empty string.' },
            { role: 'user', content: prompt },
        ];

        const completion = await chatCompletion(messages, {
            max_tokens: 150,
            temperature: 0.1,
        });

        // Clean up the completion
        let cleaned = completion.trim();
        // Remove markdown wrappers if present
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
        }
        // Remove thinking tags if model includes them
        cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

        res.json({ completion: cleaned });
    } catch (err) {
        console.error('Autocomplete error:', err.message || err);
        res.json({ completion: '' });
    }
});

// ── Virtual HTML / API Hosting ──
app.all('/preview/:roomId/:file(*)', async (req, res) => {
    try {
        const { roomId, file } = req.params;
        const doc = docs.get(roomId);

        if (!doc) {
            return res.status(404).send('Workspace not found or inactive. Connect via iTECify first.');
        }

        const filesystem = doc.getMap('filesystem');
        const ytext = filesystem.get(file);

        if (!ytext) {
            return res.status(404).send(`File not found: ${file}`);
        }

        const code = ytext.toString();
        const ext = file.split('.').pop().toLowerCase();

        // 0) Serve Base64-encoded image assets
        const imageExts = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp' };
        if (imageExts[ext] && code.startsWith('data:')) {
            const commaIndex = code.indexOf(',');
            if (commaIndex !== -1) {
                const base64Data = code.slice(commaIndex + 1);
                const buffer = Buffer.from(base64Data, 'base64');
                res.setHeader('Content-Type', imageExts[ext]);
                res.setHeader('Content-Length', buffer.length);
                return res.send(buffer);
            }
        }

        // 1) Serve static frontend files
        if (ext === 'html') {
            res.setHeader('Content-Type', 'text/html');
            return res.send(code);
        } else if (ext === 'css') {
            res.setHeader('Content-Type', 'text/css');
            return res.send(code);
        } else if (ext === 'js' || ext === 'mjs') {
            // Is it a frontend JS file or backend? 
            // If they are navigating to it as a static asset from HTML, it's frontend.
            res.setHeader('Content-Type', 'application/javascript');
            return res.send(code);
        } else if (ext === 'json') {
            res.setHeader('Content-Type', 'application/json');
            return res.send(code);
        }

        // 2) Serve CGI Backend execution
        const extToLanguage = {
            'py': 'python',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'cpp': 'cpp',
            'c': 'cpp',
            'java': 'java'
        };

        const language = extToLanguage[ext];

        if (language) {
            console.log(`[Preview CGI] Executing ${file} as ${language} for HTTP ${req.method}`);
            const startTime = Date.now();
            let result = await executeLocally(language, code);
            const elapsed = Date.now() - startTime;
            
            console.log(`[Preview CGI] Process exited (${elapsed}ms). Code: ${result.exitCode}`);
            const output = result.stdout || result.stderr;
            
            // Smart auto-detect HTML payload in backend script output
            if (output && (output.toLowerCase().includes('<!doctype html>') || output.toLowerCase().includes('<html'))) {
                res.setHeader('Content-Type', 'text/html');
            } else {
                res.setHeader('Content-Type', 'text/plain');
            }
            return res.send(output);
        }

        // 3) Fallback
        res.setHeader('Content-Type', 'text/plain');
        return res.send(code);

    } catch (err) {
        console.error('[Preview] Error handling virtual file:', err);
        res.status(500).send(`Internal Server Error: ${err.message}`);
    }
});

// ── Fallback templates ──
function generatePythonSuggestion(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('sort')) {
        return `# Sorting algorithm based on your prompt
def sort_list(arr):
    """Sort a list using an optimized approach."""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return sort_list(left) + middle + sort_list(right)

# Example usage
data = [3, 6, 8, 10, 1, 2, 1]
print(sort_list(data))`;
    }
    if (lower.includes('hello') || lower.includes('greet')) {
        return `# Greeting program
def greet(name):
    """Print a personalized greeting."""
    print(f"Hello, {name}! Welcome to iTECify.")

greet("World")`;
    }
    if (lower.includes('fibonacci') || lower.includes('fib')) {
        return `# Fibonacci sequence generator
def fibonacci(n):
    """Generate the first n Fibonacci numbers."""
    sequence = []
    a, b = 0, 1
    for _ in range(n):
        sequence.append(a)
        a, b = b, a + b
    return sequence

print(fibonacci(10))`;
    }
    return `# AI-generated code for: ${prompt}
def solution():
    """Generated solution based on your prompt."""
    # TODO: Implement your logic here
    print("Hello from iTECify AI!")
    return True

result = solution()
print(f"Result: {result}")`;
}

function generateJSSuggestion(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('sort')) {
        return `// Sorting algorithm based on your prompt
function sortArray(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[Math.floor(arr.length / 2)];
  const left = arr.filter(x => x < pivot);
  const middle = arr.filter(x => x === pivot);
  const right = arr.filter(x => x > pivot);
  return [...sortArray(left), ...middle, ...sortArray(right)];
}

const data = [3, 6, 8, 10, 1, 2, 1];
console.log(sortArray(data));`;
    }
    if (lower.includes('fetch') || lower.includes('api')) {
        return `// Fetch data from an API
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log("Data received:", data);
    return data;
  } catch (error) {
    console.error("Fetch error:", error.message);
  }
}

fetchData("https://jsonplaceholder.typicode.com/posts/1");`;
    }
    return `// AI-generated code for: ${prompt}
function solution() {
  // TODO: Implement your logic here
  console.log("Hello from iTECify AI!");
  return true;
}

const result = solution();
console.log("Result:", result);`;
}

function generateCppSuggestion(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('sort')) {
        return `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    vector<int> data = {3, 6, 8, 10, 1, 2, 1};
    sort(data.begin(), data.end());
    for (int x : data) cout << x << " ";
    cout << endl;
    return 0;
}`;
    }
    return `#include <iostream>
using namespace std;

// AI-generated code for: ${prompt}
int main() {
    cout << "Hello from iTECify AI!" << endl;
    // TODO: Implement your logic here
    return 0;
}`;
}

// ── HTTP + WebSocket server ──

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.join(__dirname, '..', 'client', 'dist');

if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist, { 
        etag: false, 
        lastModified: false, 
        maxAge: 0,
        setHeaders: (res, path) => {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.sendFile(path.join(clientDist, 'index.html'));
        }
    });
    console.log('📦 Serving built frontend from client/dist');
}

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });
const execWss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, req) => setupWSConnection(ws, req));

execWss.on('connection', (ws) => {
    let proc = null;
    let cleanup = [];
    let imageName = '';
    let containerName = '';
    let executionTimeout = null;
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'start') {
                const { language, code } = data;
                const buildRes = await buildContainer(language, code);
                if (buildRes.error) {
                    ws.send(JSON.stringify({ type: 'stderr', data: buildRes.error }));
                    ws.send(JSON.stringify({ type: 'exit', code: 1, time: 0 }));
                    return ws.close();
                }
                
                imageName = buildRes.imageName;
                containerName = buildRes.containerName;
                cleanup = buildRes.cleanup;

                // Spawning interactively with -i allows writing to STDIN
                proc = spawn('docker', [
                    'run', '--name', containerName, '-i', '--rm',
                    '--memory=128m',
                    '--cpus=0.5',
                    '--network=none',
                    imageName
                ]);
                
                // 60 seconds timeout for interactive sessions
                executionTimeout = setTimeout(() => {
                    ws.send(JSON.stringify({ type: 'stderr', data: '\n\nError: Execution timed out after 60 seconds.' }));
                    try { execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' }); } catch (_) { }
                    if (proc) proc.kill();
                }, 60000);

                const t0 = Date.now();
                
                proc.stdout.on('data', (chunk) => ws.send(JSON.stringify({ type: 'stdout', data: chunk.toString() })));
                proc.stderr.on('data', (chunk) => ws.send(JSON.stringify({ type: 'stderr', data: chunk.toString() })));
                proc.on('close', (code) => {
                    if (executionTimeout) clearTimeout(executionTimeout);
                    ws.send(JSON.stringify({ type: 'exit', code, time: Date.now() - t0 }));
                    cleanup.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
                    try { execSync(`docker rmi -f ${imageName}`, { stdio: 'ignore' }); } catch (_) { }
                    ws.close();
                });
                
            } else if (data.type === 'stdin') {
                if (proc && proc.stdin) {
                    proc.stdin.write(data.data);
                }
            } else if (data.type === 'kill') {
                if (proc) {
                    try { execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' }); } catch(_) {}
                    proc.kill();
                }
            }
        } catch (e) {
            console.error('WS EXEC ERROR:', e);
        }
    });

    ws.on('close', () => {
        if (executionTimeout) clearTimeout(executionTimeout);
        if (proc) {
            try { execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' }); } catch(_) {}
            proc.kill();
            cleanup.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
            try { execSync(`docker rmi -f ${imageName}`, { stdio: 'ignore' }); } catch (_) { }
        }
    });
});

server.on('upgrade', (request, socket, head) => {
    if (request.url.startsWith('/api/execute-ws')) {
        execWss.handleUpgrade(request, socket, head, (ws) => {
            execWss.emit('connection', ws, request);
        });
    } else {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ iTECify server running on http://localhost:${PORT}`);
    console.log(`   WebSocket ready for Yjs collaboration`);
    console.log(`   AI Model: ${GROQ_MODEL}`);
    console.log(`   AI Key: ${GROQ_API_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`   Accessible on your network at http://<your-ip>:${PORT}`);
});
