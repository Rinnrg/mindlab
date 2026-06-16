import { NextRequest, NextResponse } from "next/server"

// POST /api/compiler - Execute Python code
export async function POST(req: NextRequest) {
  try {
    const { code, stdin } = await req.json()

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      )
    }

    // Try Godbolt (Compiler Explorer) first - most reliable free API
    const godboltResult = await tryGodbolt(code, stdin || "")
    if (godboltResult) {
      return NextResponse.json(godboltResult)
    }

    // Fallback to Wandbox API with correct compiler version
    const wandboxResult = await tryWandbox(code, stdin || "")
    if (wandboxResult) {
      return NextResponse.json(wandboxResult)
    }

    return NextResponse.json(
      {
        stdout: "",
        stderr: "Error: All execution services are currently unavailable. Please try again later.",
        exitCode: 1,
      },
      { status: 503 }
    )
  } catch (error) {
    console.error("Compiler API error:", error)
    return NextResponse.json(
      {
        stdout: "",
        stderr: `Server error: ${error instanceof Error ? error.message : "Unknown error"}`,
        exitCode: 1,
      },
      { status: 500 }
    )
  }
}

// Godbolt Compiler Explorer - Free, no API key needed, very reliable
async function tryGodbolt(code: string, stdin: string = ""): Promise<{ stdout: string; stderr: string; exitCode: number } | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    const response = await fetch("https://godbolt.org/api/compiler/python312/compile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        source: code,
        options: {
          executeParameters: {
            args: [],
            stdin: stdin,
          },
          compilerOptions: {
            executorRequest: true,
          },
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (response.ok) {
      const data = await response.json()

      // Godbolt returns stdout as array of {text: string}
      const stdout = (data.stdout || [])
        .map((line: { text: string }) => line.text)
        .join("\n")

      const stderr = (data.stderr || [])
        .map((line: { text: string }) => line.text)
        .join("\n")

      // Also check buildResult for compilation errors
      const buildStderr = (data.buildResult?.stderr || [])
        .map((line: { text: string }) => line.text)
        .join("\n")

      return {
        stdout: stdout,
        stderr: stderr || buildStderr,
        exitCode: data.code ?? 0,
      }
    }

    console.log("Godbolt returned status:", response.status)
    return null
  } catch (error) {
    console.log("Godbolt API failed:", error)
    return null
  }
}

// Wandbox API - Free, no API key needed
// Uses correct compiler names from https://wandbox.org/api/list.json
async function tryWandbox(code: string, stdin: string = ""): Promise<{ stdout: string; stderr: string; exitCode: number } | null> {
  // Try multiple compiler versions in case one is temporarily broken
  const compilerVersions = ["cpython-3.12.7", "cpython-3.13.8", "cpython-3.11.10"]

  for (const compiler of compilerVersions) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const response = await fetch("https://wandbox.org/api/compile.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code,
          compiler: compiler,
          stdin: stdin,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (response.ok) {
        const data = await response.json()
        const stdout = data.program_output || ""
        const stderr = data.program_error || data.compiler_error || ""

        // Skip if the output contains container infrastructure errors
        if (stderr.includes("catatonit") || stderr.includes("failed to exec pid1")) {
          console.log(`Wandbox ${compiler} has infrastructure issues, trying next...`)
          continue
        }

        return {
          stdout,
          stderr,
          exitCode: data.status === "0" || data.status === 0 ? 0 : 1,
        }
      }
    } catch (error) {
      console.log(`Wandbox ${compiler} failed:`, error)
      continue
    }
  }

  return null
}
