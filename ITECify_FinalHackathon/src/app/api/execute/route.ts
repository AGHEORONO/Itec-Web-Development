import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { language, sourceCode } = await request.json();
    
    // HTML/CSS are not terminal-executable languages
    if (language === "html" || language === "css") {
      return NextResponse.json({ output: `[Browser Engine]\nHTML/CSS cannot be executed in a Terminal.\nThey are rendered visually in the DOM.\n\nPayload Size: ${sourceCode.length} bytes.` });
    }

    // Mapping to the resilient Japanese Cloud Compiler (Wandbox API)
    // Completely unblocked, anonymous, robust and supports C++, TypeScript, Python and NodeJS without installations
    const languageMap: Record<string, string> = {
      javascript: "nodejs-20.17.0",
      typescript: "typescript-5.6.2",
      python: "cpython-3.7.17",
      cpp: "gcc-head"
    };

    const compilerName = languageMap[language] || "nodejs-20.17.0";

    const payload: any = {
      compiler: compilerName,
      code: sourceCode,
      save: false
    };

    // Special GCC parameters to properly execute modern C++ without standard errors
    if (language === "cpp") {
      payload.options = "warning,gnu++17";
    }

    const response = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        return NextResponse.json({ output: `[External Sandbox Unavailable]: Wandbox Service returned ${response.status} Error.` });
    }

    const result = await response.json();
    
    // Priority: the standard process output, followed by internal runtime errors, followed by compilation fail traces
    const output = result.program_message || result.program_error || result.compiler_error || result.compiler_message || "Execution completed seamlessly with no log outputs.";
    
    return NextResponse.json({ output });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ output: "Critical internal connection fault with the Cloud Compiler Node." }, { status: 500 });
  }
}
